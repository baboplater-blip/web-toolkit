'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  FileImage,
  Loader2,
  Plus,
  RotateCcw,
  Scan,
  Trash2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  canvasToBlob,
  detectFormatFromFile,
  formatExtension,
  loadImageFile,
  type ImageFormat,
  type LoadedImage,
} from '@/lib/tools/image-common';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';
import {
  paintCover,
  type CoverBox,
  type CoverOptions,
  type CoverStyle,
  type CoverShape,
} from '@/lib/tools/cover';
import { detectYuNet } from '@/lib/tools/yunet';

interface FaceBox extends CoverBox {
  id: string;
  source: 'auto' | 'manual';
  enabled: boolean;
  score?: number;
}

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];
const EMOJIS = ['😎', '🙂', '😀', '🐶', '🌚', '⭐', '❤️', '🔵', '🚫', '👤'];

interface RawBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FaceDetectorLike {
  detect: (input: HTMLImageElement | HTMLCanvasElement) => {
    detections?: Array<{
      boundingBox?: { originX: number; originY: number; width: number; height: number };
      categories?: Array<{ score?: number }>;
    }>;
  };
  close: () => void;
}

interface ScoredBox extends RawBox {
  score: number;
}

async function createFaceDetector(
  onStatus?: (s: string) => void,
  minConfidence = 0.4,
): Promise<FaceDetectorLike> {
  onStatus?.('MediaPipe 로드 중');
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
  onStatus?.('WASM 초기화 중');
  const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
  onStatus?.('감지 모델 로드 중 (~500KB)');
  const detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'IMAGE',
    minDetectionConfidence: minConfidence,
  });
  return detector as unknown as FaceDetectorLike;
}

function iou(a: RawBox, b: RawBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (inter <= 0) return 0;
  return inter / (a.w * a.h + b.w * b.h - inter);
}

/** Non-max suppression — 점수 높은 박스를 남기고 IoU 가 임계 이상인 중복 제거. */
function nms(boxes: ScoredBox[], thresh: number): ScoredBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: ScoredBox[] = [];
  for (const b of sorted) {
    if (kept.some((k) => iou(k, b) > thresh)) continue;
    kept.push(b);
  }
  return kept;
}

/**
 * 타일 분할 감지 — 큰 이미지/다수 인물에서 작은 얼굴까지 포착.
 *
 * BlazeFace 는 입력을 128px 로 축소해 처리하므로 단체사진의 작은 얼굴을 놓친다.
 * 전체 1회 + 겹치는 격자 타일별 감지 후 NMS 로 중복 제거하면 회수율이 크게 오른다.
 */
type Sensitivity = 'standard' | 'high' | 'max';

interface SensParams {
  /** 모델 최소 신뢰도 (낮을수록 더 많이 잡음) */
  conf: number;
  /** 타일 1칸 목표 픽셀 (작을수록 더 촘촘) */
  tilePx: number;
  /** 격자 최대 칸수(가로/세로) */
  maxTiles: number;
  /** 타일 겹침 비율 */
  overlap: number;
}

const SENS: Record<Sensitivity, SensParams> = {
  standard: { conf: 0.4, tilePx: 1100, maxTiles: 3, overlap: 0.15 },
  high: { conf: 0.3, tilePx: 1000, maxTiles: 4, overlap: 0.18 },
  max: { conf: 0.2, tilePx: 700, maxTiles: 5, overlap: 0.22 },
};

/** 얼굴로 보기 어려운 비율(너무 길쭉/납작)을 제거 — 벽·패턴 오검출 컷. */
function looksLikeFace(b: RawBox): boolean {
  if (b.w < 4 || b.h < 4) return false;
  const ratio = b.w / b.h;
  return ratio >= 0.4 && ratio <= 2.2;
}

async function detectAllFaces(
  detector: FaceDetectorLike,
  img: HTMLImageElement,
  imgW: number,
  imgH: number,
  params: SensParams,
  useYuNet: boolean,
  onStatus?: (s: string) => void,
): Promise<ScoredBox[]> {
  const all: ScoredBox[] = [];
  const collect = (
    dets: ReturnType<FaceDetectorLike['detect']>['detections'],
    ox: number,
    oy: number,
    inv: number,
  ) => {
    (dets ?? []).forEach((d) => {
      const bb = d.boundingBox;
      if (!bb) return;
      all.push({
        x: ox + bb.originX * inv,
        y: oy + bb.originY * inv,
        w: bb.width * inv,
        h: bb.height * inv,
        score: d.categories?.[0]?.score ?? 1,
      });
    });
  };

  // 1) 전체 이미지 (큰 얼굴)
  collect(detector.detect(img).detections, 0, 0, 1);

  // 2) 겹치는 격자 타일 (작은·측면 얼굴) — 민감도에 따라 칸 수 조절
  const cols = Math.min(params.maxTiles, Math.max(1, Math.round(imgW / params.tilePx)));
  const rows = Math.min(params.maxTiles, Math.max(1, Math.round(imgH / params.tilePx)));
  if (cols > 1 || rows > 1) {
    const overlap = params.overlap;
    const tw = imgW / cols;
    const th = imgH / rows;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = Math.max(0, c * tw - tw * overlap);
          const oy = Math.max(0, r * th - th * overlap);
          const ex = Math.min(imgW, (c + 1) * tw + tw * overlap);
          const ey = Math.min(imgH, (r + 1) * th + th * overlap);
          const cw = ex - ox;
          const ch = ey - oy;
          const target = 800; // 타일을 적당 해상도로 (메모리·속도 균형)
          const sc = Math.min(1, target / Math.max(cw, ch));
          canvas.width = Math.max(1, Math.round(cw * sc));
          canvas.height = Math.max(1, Math.round(ch * sc));
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, ox, oy, cw, ch, 0, 0, canvas.width, canvas.height);
          collect(detector.detect(canvas).detections, ox, oy, 1 / sc);
        }
      }
    }
  }

  // 2.5) YuNet(ONNX) 보조 검출 — 측면·각도·작은 얼굴 보강 (최고 민감도)
  if (useYuNet) {
    try {
      onStatus?.('정밀 모델(YuNet) 분석 중');
      const yu = await detectYuNet(img, imgW, imgH, 0.6);
      for (const b of yu) all.push(b);
    } catch {
      /* YuNet 로드·추론 실패 시 BlazeFace 결과만 사용 */
    }
  }

  // 3) 얼굴 비율 필터(오검출 컷) → 마진 추가 + 클램프
  const padded: ScoredBox[] = all
    .filter(looksLikeFace)
    .map((b) => {
      const padX = b.w * 0.1;
      const padY = b.h * 0.15;
      const x = Math.max(0, b.x - padX);
      const y = Math.max(0, b.y - padY);
      return {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(Math.min(imgW - x, b.w + padX * 2)),
        h: Math.round(Math.min(imgH - y, b.h + padY * 2)),
        score: b.score,
      };
    });

  // 4) 중복 제거
  return nms(padded, 0.35);
}

/** 캔버스에 가림 효과를 적용 후 지정 포맷으로 인코딩 (전체 해상도). */
async function applyCoverToImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  boxes: CoverBox[],
  opts: CoverOptions,
  outputFormat: ImageFormat,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트 생성 실패');
  if (outputFormat === 'jpeg' || outputFormat === 'avif') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  for (const box of boxes) paintCover(ctx, img, width, height, width, height, box, opts);
  return await canvasToBlob(canvas, outputFormat, quality / 100);
}

export default function BlurFacePage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [boxes, setBoxes] = useState<FaceBox[]>([]);

  // 가림 설정
  const [style, setStyle] = useState<CoverStyle>('blur');
  const [shape, setShape] = useState<CoverShape>('rect');
  const [strength, setStrength] = useState(25);
  const [autoScale, setAutoScale] = useState(true);
  const [invert, setInvert] = useState(false);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [solidColor, setSolidColor] = useState('#111111');
  const [target, setTarget] = useState<'face' | 'object'>('face');
  const [sensitivity, setSensitivity] = useState<Sensitivity>('high');
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(92);

  const [detecting, setDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(null);
  const [compare, setCompare] = useState(50);
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);

  // 폴더 모드 샘플 미리보기 (강도·스타일 가늠용)
  const [folderSample, setFolderSample] = useState<{ loaded: LoadedImage; boxes: FaceBox[] } | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const samplePreviewRef = useRef<HTMLCanvasElement>(null);
  const sampleIdxRef = useRef(0);

  const [addMode, setAddMode] = useState(false);
  const interactionRef = useRef<
    | null
    | {
        kind: 'add' | 'move' | 'resize';
        id: string;
        corner?: 'nw' | 'ne' | 'sw' | 'se';
        startImg: { x: number; y: number };
        startBox: FaceBox;
      }
  >(null);

  useEffect(() => () => loaded?.cleanup(), [loaded]);
  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  // 표시 크기 측정
  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    const el = containerRef.current;
    const obs = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const maxH = window.innerHeight * 0.6;
      const r = loaded.width / loaded.height;
      let dw = cw;
      let dh = cw / r;
      if (dh > maxH) {
        dh = maxH;
        dw = dh * r;
      }
      setDisplaySize({ w: dw, h: dh });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaded]);

  const scale = loaded && displaySize ? displaySize.w / loaded.width : 1;
  const coverOpts: CoverOptions = { style, shape, strength, autoScale, emoji, solidColor };
  const STYLE_LABELS: Record<CoverStyle, string> = {
    blur: '블러',
    pixelate: '모자이크',
    bar: '검은 막대',
    solid: '단색',
    emoji: '이모지',
  };
  const styleLabel = STYLE_LABELS[style];

  const coverBoxes = (): FaceBox[] =>
    invert ? boxes.filter((b) => !b.enabled) : boxes.filter((b) => b.enabled);

  // 실시간 미리보기 렌더
  useEffect(() => {
    const cv = previewCanvasRef.current;
    if (!cv || !loaded || !displaySize) return;
    cv.width = Math.round(displaySize.w);
    cv.height = Math.round(displaySize.h);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(loaded.element, 0, 0, cv.width, cv.height);
    for (const box of coverBoxes()) {
      paintCover(ctx, loaded.element, loaded.width, loaded.height, cv.width, cv.height, box, coverOpts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, displaySize, boxes, style, shape, strength, autoScale, invert, emoji, solidColor]);

  // 폴더 샘플 미리보기 렌더 (전체 해상도 → 최대 520px 로 축소, 가림은 모든 감지 얼굴)
  useEffect(() => {
    const cv = samplePreviewRef.current;
    if (!cv || !folderSample) return;
    const { loaded: ld, boxes: bx } = folderSample;
    const sc = Math.min(1, 520 / ld.width);
    const dw = Math.max(1, Math.round(ld.width * sc));
    const dh = Math.max(1, Math.round(ld.height * sc));
    cv.width = dw;
    cv.height = dh;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, dw, dh);
    ctx.drawImage(ld.element, 0, 0, dw, dh);
    for (const box of bx) paintCover(ctx, ld.element, ld.width, ld.height, dw, dh, box, coverOpts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderSample, style, shape, strength, autoScale, emoji, solidColor]);

  /** 폴더에서 한 장을 골라 감지 후 샘플 미리보기로 설정. */
  const loadSample = async (file: File) => {
    setSampleLoading(true);
    setFolderSample((prev) => {
      prev?.loaded.cleanup();
      return null;
    });
    let detector: FaceDetectorLike | null = null;
    try {
      const info = await loadImageFile(file);
      const sp = SENS[sensitivity];
      detector = await createFaceDetector(undefined, sp.conf);
      const scored = await detectAllFaces(
        detector,
        info.element,
        info.width,
        info.height,
        sp,
        sensitivity === 'max',
      );
      const sboxes: FaceBox[] = scored.map((b, i) => ({
        id: `sample-${i}`,
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        source: 'auto',
        enabled: true,
        score: b.score,
      }));
      setFolderSample({ loaded: info, boxes: sboxes });
    } catch {
      /* 샘플 감지 실패 — 미리보기 생략 */
    } finally {
      detector?.close();
      setSampleLoading(false);
    }
  };

  // 민감도 변경 시 폴더 샘플 재감지 (감지 결과가 달라지므로)
  useEffect(() => {
    if (inputMode === 'folder' && folderFiles.length > 0) {
      const idx = Math.min(sampleIdxRef.current, folderFiles.length - 1);
      void loadSample(folderFiles[idx].file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensitivity]);

  const detectFaces = useCallback(async (info: LoadedImage) => {
    setDetecting(true);
    setDetectStatus('MediaPipe 로드 중');
    setError(null);
    let detector: FaceDetectorLike | null = null;
    try {
      const sp = SENS[sensitivity];
      detector = await createFaceDetector(setDetectStatus, sp.conf);
      setDetectStatus('얼굴 분석 중 (정밀)');
      const scored = await detectAllFaces(
        detector,
        info.element,
        info.width,
        info.height,
        sp,
        sensitivity === 'max',
        setDetectStatus,
      );
      const detected: FaceBox[] = scored.map((b, i) => ({
        id: `auto-${Date.now()}-${i}`,
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        source: 'auto',
        enabled: true,
        score: b.score,
      }));
      setBoxes(detected);
      setDetectStatus('');
      if (detected.length === 0)
        setError('얼굴이 자동 감지되지 않았습니다. "영역 직접 그리기"로 지정하세요.');
    } catch (err) {
      setError(
        `자동 감지 실패: ${err instanceof Error ? err.message : '알 수 없음'}. 영역을 직접 그릴 수 있습니다.`,
      );
    } finally {
      detector?.close();
      setDetecting(false);
    }
  }, [sensitivity]);

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setBatchResults(null);
    loaded?.cleanup();
    setBoxes([]);
    try {
      const info = await loadImageFile(f);
      setFile(f);
      setLoaded(info);
      setOutputFormat(detectFormatFromFile(f) ?? 'jpeg');
      if (target === 'face') await detectFaces(info);
      else setAddMode(true); // 번호판·기타 모드는 바로 그리기
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드 실패');
    }
  };

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setBatchResults(null);
    const filtered = filterFiles(files, { mimePrefixes: ['image/'], extensions: IMAGE_EXTS });
    if (filtered.length === 0) {
      setError('폴더 안에 이미지가 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
    // 첫 이미지를 샘플로 감지·미리보기 (강도·스타일 가늠용)
    sampleIdxRef.current = 0;
    void loadSample(filtered[0].file);
  };

  /** 폴더의 다음 이미지를 샘플로 교체. */
  const nextSample = () => {
    if (folderFiles.length === 0) return;
    sampleIdxRef.current = (sampleIdxRef.current + 1) % folderFiles.length;
    void loadSample(folderFiles[sampleIdxRef.current].file);
  };

  const reset = () => {
    loaded?.cleanup();
    folderSample?.loaded.cleanup();
    setFolderSample(null);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setLoaded(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setBoxes([]);
    setResult(null);
    setBatchResults(null);
    setError(null);
    setAddMode(false);
  };

  const toggleBox = (id: string) =>
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  const deleteBox = (id: string) => setBoxes((prev) => prev.filter((b) => b.id !== id));
  const selectAll = () => setBoxes((prev) => prev.map((b) => ({ ...b, enabled: true })));
  const deselectAll = () => setBoxes((prev) => prev.map((b) => ({ ...b, enabled: false })));

  // 포인터 → 이미지 좌표
  const toImg = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const imgOffsetX = rect.width / 2 - (displaySize?.w ?? 0) / 2;
    return {
      x: (e.clientX - rect.left - imgOffsetX) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const onContainerPointerDown = (e: React.PointerEvent) => {
    if (!loaded || !displaySize) return;
    if (!addMode) return; // 박스 자체 핸들러가 move/resize 처리
    const p = toImg(e);
    const id = `manual-${Date.now()}`;
    const nb: FaceBox = {
      id,
      x: Math.max(0, Math.min(loaded.width, p.x)),
      y: Math.max(0, Math.min(loaded.height, p.y)),
      w: 1,
      h: 1,
      source: 'manual',
      enabled: true,
    };
    setBoxes((prev) => [...prev, nb]);
    interactionRef.current = { kind: 'add', id, startImg: p, startBox: nb };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const startBoxInteraction = (
    e: React.PointerEvent,
    box: FaceBox,
    kind: 'move' | 'resize',
    corner?: 'nw' | 'ne' | 'sw' | 'se',
  ) => {
    if (addMode) return;
    e.stopPropagation();
    const p = toImg(e);
    interactionRef.current = { kind, id: box.id, corner, startImg: p, startBox: { ...box } };
    const overlay = containerRef.current;
    overlay?.setPointerCapture(e.pointerId);
  };

  const onContainerPointerMove = (e: React.PointerEvent) => {
    const it = interactionRef.current;
    if (!it || !loaded) return;
    const p = toImg(e);
    const dx = p.x - it.startImg.x;
    const dy = p.y - it.startImg.y;
    const clampX = (v: number) => Math.max(0, Math.min(loaded.width, v));
    const clampY = (v: number) => Math.max(0, Math.min(loaded.height, v));

    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== it.id) return b;
        const s = it.startBox;
        if (it.kind === 'move') {
          const nx = clampX(s.x + dx);
          const ny = clampY(s.y + dy);
          return { ...b, x: Math.round(Math.min(nx, loaded.width - s.w)), y: Math.round(Math.min(ny, loaded.height - s.h)) };
        }
        // add / resize: 코너에 따라
        let x1 = s.x;
        let y1 = s.y;
        let x2 = s.x + s.w;
        let y2 = s.y + s.h;
        const c = it.kind === 'add' ? 'se' : it.corner;
        if (c === 'nw') {
          x1 = clampX(s.x + dx);
          y1 = clampY(s.y + dy);
        } else if (c === 'ne') {
          x2 = clampX(s.x + s.w + dx);
          y1 = clampY(s.y + dy);
        } else if (c === 'sw') {
          x1 = clampX(s.x + dx);
          y2 = clampY(s.y + s.h + dy);
        } else {
          x2 = clampX(s.x + s.w + dx);
          y2 = clampY(s.y + s.h + dy);
        }
        const nx = Math.min(x1, x2);
        const ny = Math.min(y1, y2);
        return { ...b, x: Math.round(nx), y: Math.round(ny), w: Math.round(Math.abs(x2 - x1)), h: Math.round(Math.abs(y2 - y1)) };
      }),
    );
  };

  const onContainerPointerUp = (e: React.PointerEvent) => {
    const it = interactionRef.current;
    interactionRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    if (it) {
      // 너무 작은 박스 제거
      setBoxes((prev) => prev.filter((b) => !(b.id === it.id && (b.w < 8 || b.h < 8))));
    }
  };

  const runCover = async () => {
    setError(null);
    setBatchResults(null);

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      let detector: FaceDetectorLike | null = null;
      const sp = SENS[sensitivity];
      try {
        detector = await createFaceDetector((s) => setProgressText(s), sp.conf);
        const det = detector;
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const info = await loadImageFile(rf.file);
            try {
              const rawBoxes = await detectAllFaces(
                det,
                info.element,
                info.width,
                info.height,
                sp,
                sensitivity === 'max',
                (s) => setProgressText(s),
              );
              const blob = await applyCoverToImage(
                info.element,
                info.width,
                info.height,
                rawBoxes,
                coverOpts,
                outputFormat,
                quality,
              );
              return {
                relativePath: replaceExtension(rf.relativePath, formatExtension(outputFormat)),
                blob,
                ...(rawBoxes.length === 0 ? { error: '얼굴 미감지 (원본 유지)' } : {}),
              };
            } finally {
              info.cleanup();
            }
          },
          {
            concurrency: 1,
            signal: ctrl.signal,
            onProgress: (done, total, path) => {
              setProgress({ done, total, current: path });
              setProgressText(`처리 중 ${done}/${total} — ${path}`);
            },
          },
        );
        setBatchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일괄 처리 실패');
      } finally {
        detector?.close();
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setProcessing(false);
        setProgressText('');
      }
      return;
    }

    if (!file || !loaded) return;
    const targets = coverBoxes();
    if (targets.length === 0) {
      setError(invert ? '남길 얼굴을 선택하세요 (나머지가 가려집니다).' : '가릴 영역을 최소 1개 선택하세요.');
      return;
    }
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const blob = await applyCoverToImage(
        loaded.element,
        loaded.width,
        loaded.height,
        targets.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h })),
        coverOpts,
        outputFormat,
        quality,
      );
      const newName = renameWithSuffix(file.name, '-blurred', formatExtension(outputFormat));
      setResult({ blob, url: URL.createObjectURL(blob), fileName: newName });
      setCompare(50);
    } catch (err) {
      setError(err instanceof Error ? err.message : '가림 적용 실패');
    } finally {
      setProcessing(false);
    }
  };

  const cancelRun = () => {
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
    }
  };

  const enabledCount = coverBoxes().length;
  const imgOffsetX =
    containerRef.current && displaySize ? containerRef.current.clientWidth / 2 - displaySize.w / 2 : 0;
  const folderInputSize = folderFiles.reduce((s, f) => s + f.file.size, 0);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Scan className="h-5 w-5" />
            <h1 className="font-semibold text-base">얼굴·번호판 가리기</h1>
          </div>
          {(file || allFolderFiles.length > 0) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-4">
        {!file && allFolderFiles.length === 0 && (
          <>
            {inputMode === 'files' && (
              <div className="rounded-xl border bg-card p-3 flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">대상</span>
                {(
                  [
                    ['face', '얼굴 (자동 감지)'],
                    ['object', '번호판·기타 (직접 그리기)'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTarget(v)}
                    aria-pressed={target === v}
                    className={`h-8 px-2.5 text-xs rounded-md border ${
                      target === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <DualDropZone
              mode={inputMode}
              onModeChange={(m) => {
                setInputMode(m);
                setError(null);
                // 폴더 일괄은 익명화 표준인 모자이크를 기본값으로
                if (m === 'folder') setStyle('pixelate');
              }}
              fileProps={{
                accept: 'image/*',
                description:
                  target === 'face' ? '얼굴이 포함된 이미지를 업로드하세요' : '번호판 등 가릴 영역이 있는 이미지를 업로드하세요',
                hint: 'AI 얼굴 감지 모델 최초 1회 ~2MB 로드 (이후 캐시). 서버 전송 없음.',
                onFiles: (files) => acceptFile(files[0]),
              }}
              folderProps={{
                accept: 'image/*',
                description: '폴더 안 모든 이미지의 얼굴을 자동 감지해 일괄 모자이크 → ZIP 다운로드',
                onFolder: onFolderPicked,
              }}
            />
            {inputMode === 'folder' && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                폴더(또는 여러 장)를 올리면 <strong className="text-foreground">모든 이미지의 인물 얼굴을 자동
                감지</strong>해 한 번에 가립니다. 기본은 <strong className="text-foreground">모자이크</strong>이며,
                아래 설정에서 블러·이모지 등으로 바꿀 수 있습니다. 결과는 ZIP으로 묶여 다운로드됩니다.
              </div>
            )}
          </>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <>
            <FolderPreviewPanel files={allFolderFiles} onSelectionChange={setFolderFiles} fileKindLabel="이미지" />
            <p className="text-[10px] text-yellow-500">
              타일 정밀 감지로 단체사진의 작은 얼굴까지 최대한 잡습니다(고해상도는 처리에 시간이 더 걸릴 수
              있습니다). 끝까지 감지되지 않은 파일은 원본 그대로 저장됩니다.
            </p>

            {(sampleLoading || folderSample) && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    샘플 미리보기
                  </h2>
                  {folderFiles.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={nextSample}
                      disabled={sampleLoading || processing}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      다른 이미지
                    </Button>
                  )}
                </div>
                {sampleLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    샘플 감지 중…
                  </div>
                ) : (
                  <>
                    <canvas
                      ref={samplePreviewRef}
                      className="mx-auto block max-w-full h-auto rounded border bg-muted"
                      aria-label="샘플 미리보기"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      아래 설정(스타일·강도)을 바꾸면 이 미리보기에 즉시 반영됩니다. 같은 설정이 폴더 전체에
                      일괄 적용됩니다. (이 이미지 감지 {folderSample?.boxes.length ?? 0}명)
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {inputMode === 'files' && file && loaded && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {loaded.width}×{loaded.height} · 박스 {boxes.length} · {invert ? '남길' : '가릴'} {enabledCount}
                </p>
              </div>
              {detecting && (
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {detectStatus}
                </div>
              )}
            </div>

            <div
              ref={containerRef}
              className="relative rounded-lg border bg-muted overflow-hidden select-none touch-none"
              style={displaySize ? { height: displaySize.h } : { minHeight: 200 }}
              onPointerDown={onContainerPointerDown}
              onPointerMove={onContainerPointerMove}
              onPointerUp={onContainerPointerUp}
            >
              {displaySize && (
                <>
                  {/* 실시간 미리보기 캔버스 (가림 효과 반영) */}
                  <canvas
                    ref={previewCanvasRef}
                    className="absolute"
                    style={{ width: displaySize.w, height: displaySize.h, left: imgOffsetX, top: 0 }}
                    aria-label="가림 미리보기"
                  />
                  {boxes.map((box) => {
                    const active = invert ? !box.enabled : box.enabled;
                    return (
                      <div
                        key={box.id}
                        className={`absolute border-2 ${
                          active
                            ? box.source === 'manual'
                              ? 'border-yellow-400'
                              : 'border-primary'
                            : 'border-muted-foreground/50 border-dashed'
                        } ${addMode ? '' : 'cursor-move'}`}
                        style={{
                          left: imgOffsetX + box.x * scale,
                          top: box.y * scale,
                          width: box.w * scale,
                          height: box.h * scale,
                        }}
                        onPointerDown={(e) => startBoxInteraction(e, box, 'move')}
                      >
                        <div className="absolute -top-5 left-0 flex items-center gap-1">
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBox(box.id);
                            }}
                            className={`h-4 px-1 rounded border text-[9px] font-mono flex items-center gap-0.5 ${
                              box.enabled ? 'bg-primary text-primary-foreground' : 'bg-background'
                            }`}
                            aria-label={box.enabled ? '선택 해제' : '선택'}
                          >
                            {box.enabled && <Check className="h-2.5 w-2.5" />}
                            {box.source === 'manual' ? '수동' : '자동'}
                            {box.score ? ` ${Math.round(box.score * 100)}%` : ''}
                          </button>
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBox(box.id);
                            }}
                            className="h-4 w-4 rounded-full bg-destructive text-white text-[9px] flex items-center justify-center"
                            aria-label="삭제"
                          >
                            ×
                          </button>
                        </div>
                        {/* 리사이즈 핸들 (4 코너) */}
                        {!addMode &&
                          (['nw', 'ne', 'sw', 'se'] as const).map((c) => (
                            <span
                              key={c}
                              onPointerDown={(e) => startBoxInteraction(e, box, 'resize', c)}
                              className="absolute h-3 w-3 rounded-full bg-white border-2 border-primary shadow"
                              style={{
                                left: c.includes('w') ? -6 : undefined,
                                right: c.includes('e') ? -6 : undefined,
                                top: c.includes('n') ? -6 : undefined,
                                bottom: c.includes('s') ? -6 : undefined,
                                cursor: c === 'nw' || c === 'se' ? 'nwse-resize' : 'nesw-resize',
                              }}
                              aria-label="크기 조절"
                            />
                          ))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={addMode ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAddMode((v) => !v)}
                disabled={processing}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {addMode ? '그리기 종료' : '영역 직접 그리기'}
              </Button>
              {target === 'face' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => loaded && detectFaces(loaded)}
                  disabled={processing || detecting}
                >
                  <Scan className="h-3.5 w-3.5 mr-1" />
                  다시 감지
                </Button>
              )}
              {boxes.length > 0 && (
                <>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll} disabled={processing}>
                    모두 선택
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAll} disabled={processing}>
                    모두 해제
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => setBoxes([])} disabled={processing}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    전체 삭제
                  </Button>
                </>
              )}
            </div>
            {addMode && (
              <p className="text-[10px] text-yellow-500">
                이미지 위에서 드래그해 사각형을 그리세요. 코너 핸들로 크기 조절, 박스 안을 드래그해 이동.
              </p>
            )}
          </div>
        )}

        {(file || allFolderFiles.length > 0) && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">가림 설정</h2>

            {(inputMode === 'folder' || target === 'face') && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">감지 민감도</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      ['standard', '표준', '오검출 적음'],
                      ['high', '높음', '권장'],
                      ['max', '최고', '측면·AI 보강'],
                    ] as const
                  ).map(([v, label, hint]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSensitivity(v)}
                      disabled={processing}
                      aria-pressed={sensitivity === v}
                      className={`h-12 text-xs rounded-md border px-1 ${
                        sensitivity === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      <div className="font-semibold">{label}</div>
                      <div className={`text-[10px] ${sensitivity === v ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{hint}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  측면·먼 얼굴을 놓치면 <strong>최고</strong>로 — BlazeFace에 더해 <strong>YuNet AI 모델</strong>을
                  추가로 돌려 측면·각도 얼굴까지 잡습니다(첫 실행 시 모델 로드로 조금 느릴 수 있고, 오검출이 늘 수
                  있어요 — 잘못 잡힌 박스는 클릭해 해제). {inputMode === 'files' && '변경 후 "다시 감지"를 누르세요.'}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-1.5 block">가림 스타일</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(
                  [
                    ['blur', '블러'],
                    ['pixelate', '모자이크'],
                    ['bar', '검은 막대'],
                    ['solid', '단색'],
                    ['emoji', '이모지'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setStyle(v)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      style === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {(style === 'blur' || style === 'solid') && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">모양</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ['rect', '사각형'],
                      ['ellipse', '타원'],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setShape(v)}
                      disabled={processing}
                      className={`h-8 text-xs rounded-md border ${
                        shape === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {style === 'emoji' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">이모지</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`h-9 w-9 text-lg rounded-md border ${
                        emoji === em ? 'bg-primary/20 border-primary' : 'bg-background hover:bg-muted'
                      }`}
                      aria-label={`이모지 ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {style === 'solid' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" htmlFor="solid">단색 색상</label>
                <input id="solid" type="color" value={solidColor} onChange={(e) => setSolidColor(e.target.value)} className="h-8 w-12 rounded border bg-background" aria-label="단색 색상" />
              </div>
            )}

            {(style === 'blur' || style === 'pixelate') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">{style === 'pixelate' ? '모자이크 크기' : '블러 강도'}</label>
                  <span className="text-xs text-muted-foreground">{strength}px</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={80}
                  step={1}
                  value={strength}
                  onChange={(e) => setStrength(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                  aria-label="강도"
                />
                <label className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                  <input type="checkbox" checked={autoScale} onChange={(e) => setAutoScale(e.target.checked)} className="accent-primary" />
                  얼굴 크기에 비례해 강도 자동 조절 (작은 얼굴도 확실히 익명화)
                </label>
              </div>
            )}

            {inputMode === 'files' && (
              <label className="flex items-center gap-1.5 text-[12px] rounded-md border bg-background p-2">
                <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} className="accent-primary" />
                <span>
                  <strong>반전 모드</strong> — 선택한 얼굴만 남기고 <strong>나머지 모두 가림</strong> (행인 가리기)
                </span>
              </label>
            )}

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['jpeg', 'png', 'webp'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOutputFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      outputFormat === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {outputFormat !== 'png' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">품질</label>
                  <span className="text-xs text-muted-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                  aria-label="품질"
                />
              </div>
            )}

            {processing && progressText && inputMode === 'folder' && (
              <p className="text-xs text-muted-foreground truncate">{progressText}</p>
            )}

            <Separator />

            <Button
              onClick={runCover}
              disabled={
                processing ||
                (inputMode === 'files' && enabledCount === 0) ||
                (inputMode === 'folder' && folderFiles.length === 0)
              }
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {inputMode === 'folder' ? '일괄 처리 중...' : '적용 중...'}
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4" />
                  {inputMode === 'folder' ? `${folderFiles.length}장 일괄 ${styleLabel} 적용` : `${enabledCount}개 영역 ${styleLabel} 적용`}
                </>
              )}
            </Button>
          </div>
        )}

        {result && loaded && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">결과 (원본 ↔ 결과 비교)</h2>
            <div className="relative rounded-lg border overflow-hidden bg-muted" style={{ aspectRatio: `${loaded.width} / ${loaded.height}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={loaded.element.src} alt="원본" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${compare}%` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt="결과" className="absolute inset-0 h-full object-contain" style={{ width: `${(100 / compare) * 100}%`, maxWidth: 'none' }} draggable={false} />
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${compare}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={compare}
              onChange={(e) => setCompare(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="비교 슬라이더"
            />
            <p className="text-xs text-muted-foreground text-center">결과 크기: {formatBytes(result.blob.size)}</p>
            <Button className="w-full" onClick={() => triggerDownload(result.blob, result.fileName)}>
              <Download className="h-4 w-4" />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}

        {progress && (
          <BatchProgressPanel done={progress.done} total={progress.total} current={progress.current} onCancel={cancelRun} label="가림 처리 중" cancelling={cancelling} />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'blurred'}
            zipFileName={`${commonRoot(folderFiles) || 'images'}-blurred.zip`}
            totalInputSize={folderInputSize}
          />
        )}

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          MediaPipe Tasks Vision (Apache 2.0) · BlazeFace 모델. 모든 처리는 브라우저에서 — 이미지는 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
