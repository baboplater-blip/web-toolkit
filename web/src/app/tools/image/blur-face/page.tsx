'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Download,
  FileImage,
  Loader2,
  Plus,
  RotateCcw,
  Scan,
  Shapes,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  canvasToBlob,
  detectFormatFromFile,
  formatExtension,
  loadImageFile,
  type ImageFormat,
  type LoadedImage,
} from '@/lib/tools/image-common';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

interface FaceBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 감지 결과 (자동) 인지 수동 추가인지 */
  source: 'auto' | 'manual';
  /** 블러 적용 여부 */
  enabled: boolean;
  /** 감지 신뢰도 (자동인 경우) */
  score?: number;
}

type BlurShape = 'rect' | 'ellipse' | 'pixelate';

// MediaPipe 리소스 경로
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

interface RawBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FaceDetectorLike {
  detect: (input: HTMLImageElement) => {
    detections?: Array<{
      boundingBox?: { originX: number; originY: number; width: number; height: number };
      categories?: Array<{ score?: number }>;
    }>;
  };
  close: () => void;
}

/** MediaPipe FaceDetector 인스턴스를 생성 (재사용 가능) */
async function createFaceDetector(
  onStatus?: (s: string) => void,
): Promise<FaceDetectorLike> {
  onStatus?.('MediaPipe 로드 중');
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
  onStatus?.('WASM 초기화 중');
  const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
  onStatus?.('감지 모델 로드 중 (~500KB)');
  const detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    minDetectionConfidence: 0.4,
  });
  return detector as unknown as FaceDetectorLike;
}

/** 감지 결과 → RawBox[] (이미지 좌표계, 마진 포함) */
function extractBoxes(
  detections: ReturnType<FaceDetectorLike['detect']>['detections'],
  imgW: number,
  imgH: number,
): RawBox[] {
  const out: RawBox[] = [];
  (detections ?? []).forEach((d) => {
    const bb = d.boundingBox;
    if (!bb) return;
    const padX = bb.width * 0.1;
    const padY = bb.height * 0.15;
    out.push({
      x: Math.max(0, Math.round(bb.originX - padX)),
      y: Math.max(0, Math.round(bb.originY - padY)),
      w: Math.min(imgW, Math.round(bb.width + padX * 2)),
      h: Math.min(imgH, Math.round(bb.height + padY * 2)),
    });
  });
  return out;
}

/** 캔버스에 박스 블러를 적용 후 지정 포맷으로 인코딩 */
async function applyBlurToImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  boxes: RawBox[],
  blurShape: BlurShape,
  blurStrength: number,
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

  for (const box of boxes) {
    if (blurShape === 'pixelate') {
      const blockSize = Math.max(4, Math.round(blurStrength / 2));
      const tmp = document.createElement('canvas');
      const smallW = Math.max(1, Math.floor(box.w / blockSize));
      const smallH = Math.max(1, Math.floor(box.h / blockSize));
      tmp.width = smallW;
      tmp.height = smallH;
      const tctx = tmp.getContext('2d');
      if (!tctx) throw new Error('임시 캔버스 생성 실패');
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, smallW, smallH);
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.w, box.h);
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, smallW, smallH, box.x, box.y, box.w, box.h);
      ctx.imageSmoothingEnabled = true;
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      if (blurShape === 'ellipse') {
        ctx.ellipse(
          box.x + box.w / 2,
          box.y + box.h / 2,
          box.w / 2,
          box.h / 2,
          0,
          0,
          Math.PI * 2,
        );
      } else {
        ctx.rect(box.x, box.y, box.w, box.h);
      }
      ctx.clip();
      ctx.filter = `blur(${blurStrength}px)`;
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }
  }

  return await canvasToBlob(canvas, outputFormat, quality / 100);
}

export default function BlurFacePage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [boxes, setBoxes] = useState<FaceBox[]>([]);
  const [blurStrength, setBlurStrength] = useState(25);
  const [blurShape, setBlurShape] = useState<BlurShape>('rect');
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(92);
  const [detecting, setDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);

  // 수동 박스 추가용 드래그 상태
  const addDragRef = useRef<null | { startX: number; startY: number; id: string }>(null);
  const [addMode, setAddMode] = useState(false);

  useEffect(() => () => loaded?.cleanup(), [loaded]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
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

  const detectFaces = useCallback(async (info: LoadedImage) => {
    setDetecting(true);
    setDetectStatus('MediaPipe 로드 중');
    setError(null);
    let detector: FaceDetectorLike | null = null;
    try {
      detector = await createFaceDetector(setDetectStatus);
      setDetectStatus('얼굴 분석 중');
      const result = detector.detect(info.element);

      const rawBoxes = extractBoxes(result.detections, info.width, info.height);
      const detected: FaceBox[] = rawBoxes.map((b, i) => ({
        id: `auto-${Date.now()}-${i}`,
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        source: 'auto',
        enabled: true,
        score: result.detections?.[i]?.categories?.[0]?.score,
      }));

      setBoxes(detected);
      setDetectStatus('');
      if (detected.length === 0) {
        setError('얼굴이 자동 감지되지 않았습니다. "수동 박스 추가" 로 직접 지정하세요.');
      }
    } catch (err) {
      setError(
        `자동 감지 실패: ${err instanceof Error ? err.message : '알 수 없음'}. 수동으로 박스를 추가할 수 있습니다.`,
      );
    } finally {
      detector?.close();
      setDetecting(false);
    }
  }, []);

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
      // 자동 감지 즉시 실행
      await detectFaces(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드 실패');
    }
  };

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setBatchResults(null);
    const filtered = filterFiles(files, {
      mimePrefixes: ['image/'],
      extensions: IMAGE_EXTS,
    });
    if (filtered.length === 0) {
      setError('폴더 안에 이미지가 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  };

  const reset = () => {
    loaded?.cleanup();
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

  const toggleBox = (id: string) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)),
    );
  };

  const deleteBox = (id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id));
  };

  const selectAll = () => setBoxes((prev) => prev.map((b) => ({ ...b, enabled: true })));
  const deselectAll = () => setBoxes((prev) => prev.map((b) => ({ ...b, enabled: false })));

  // 수동 박스 추가: 드래그로 사각형 그리기
  const onOverlayPointerDown = (e: React.PointerEvent) => {
    if (!addMode || !loaded || !displaySize) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const imgOffsetX = rect.width / 2 - displaySize.w / 2;
    const startX = (e.clientX - rect.left - imgOffsetX) / scale;
    const startY = (e.clientY - rect.top) / scale;
    const id = `manual-${Date.now()}`;
    const newBox: FaceBox = {
      id,
      x: Math.max(0, Math.min(loaded.width, startX)),
      y: Math.max(0, Math.min(loaded.height, startY)),
      w: 1,
      h: 1,
      source: 'manual',
      enabled: true,
    };
    setBoxes((prev) => [...prev, newBox]);
    addDragRef.current = { startX: newBox.x, startY: newBox.y, id };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onOverlayPointerMove = (e: React.PointerEvent) => {
    if (!addDragRef.current || !loaded || !displaySize) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const imgOffsetX = rect.width / 2 - displaySize.w / 2;
    const curX = (e.clientX - rect.left - imgOffsetX) / scale;
    const curY = (e.clientY - rect.top) / scale;
    const { startX, startY, id } = addDragRef.current;
    const x = Math.max(0, Math.min(startX, curX));
    const y = Math.max(0, Math.min(startY, curY));
    const w = Math.min(loaded.width - x, Math.abs(curX - startX));
    const h = Math.min(loaded.height - y, Math.abs(curY - startY));
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) } : b)),
    );
  };

  const onOverlayPointerUp = (e: React.PointerEvent) => {
    if (!addDragRef.current) return;
    const { id } = addDragRef.current;
    addDragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    // 너무 작은 박스 제거
    setBoxes((prev) => prev.filter((b) => !(b.id === id && (b.w < 10 || b.h < 10))));
  };

  const runBlur = async () => {
    setError(null);
    setBatchResults(null);

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      let detector: FaceDetectorLike | null = null;
      try {
        detector = await createFaceDetector((s) => setProgressText(s));
        const det = detector;
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const info = await loadImageFile(rf.file);
            try {
              const detection = det.detect(info.element);
              const rawBoxes = extractBoxes(detection.detections, info.width, info.height);
              if (rawBoxes.length === 0) {
                // 감지된 얼굴이 없으면 원본을 그대로 통과 (포맷만 일치시킴)
                const blob = await applyBlurToImage(
                  info.element,
                  info.width,
                  info.height,
                  [],
                  blurShape,
                  blurStrength,
                  outputFormat,
                  quality,
                );
                return {
                  relativePath: replaceExtension(rf.relativePath, formatExtension(outputFormat)),
                  blob,
                  error: '얼굴 미감지 (원본 유지)',
                };
              }
              const blob = await applyBlurToImage(
                info.element,
                info.width,
                info.height,
                rawBoxes,
                blurShape,
                blurStrength,
                outputFormat,
                quality,
              );
              return {
                relativePath: replaceExtension(rf.relativePath, formatExtension(outputFormat)),
                blob,
              };
            } finally {
              info.cleanup();
            }
          },
          {
            concurrency: 1,
            onProgress: (d, t, p) => setProgressText(`처리 중 ${d}/${t} — ${p}`),
          },
        );
        setBatchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일괄 처리 실패');
      } finally {
        detector?.close();
        setProcessing(false);
        setProgressText('');
      }
      return;
    }

    if (!file || !loaded) return;
    const enabled = boxes.filter((b) => b.enabled);
    if (enabled.length === 0) {
      setError('블러를 적용할 박스를 최소 1개 선택하세요.');
      return;
    }
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const rawBoxes: RawBox[] = enabled.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
      const blob = await applyBlurToImage(
        loaded.element,
        loaded.width,
        loaded.height,
        rawBoxes,
        blurShape,
        blurStrength,
        outputFormat,
        quality,
      );
      const newName = renameWithSuffix(file.name, '-blurred', formatExtension(outputFormat));
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        fileName: newName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '블러 적용 실패');
    } finally {
      setProcessing(false);
    }
  };

  const enabledCount = boxes.filter((b) => b.enabled).length;
  const imgOffsetX =
    containerRef.current && displaySize
      ? containerRef.current.clientWidth / 2 - displaySize.w / 2
      : 0;

  const folderInputSize = folderFiles.reduce((s, f) => s + f.file.size, 0);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Scan className="h-5 w-5" />
            <h1 className="font-semibold text-base">얼굴 블러</h1>
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
          <DualDropZone
            mode={inputMode}
            onModeChange={(m) => {
              setInputMode(m);
              setError(null);
            }}
            fileProps={{
              accept: 'image/*',
              description: '얼굴이 포함된 이미지를 업로드하세요',
              hint: 'AI 얼굴 감지 모델을 최초 실행 시 ~2MB 로드 (이후 캐시). 서버 전송 없음.',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'image/*',
              description: '폴더 안 모든 이미지에 자동 감지된 얼굴 블러를 일괄 적용합니다.',
              onFolder: onFolderPicked,
            }}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <>
            <FolderPreviewPanel
              files={allFolderFiles}
              onSelectionChange={setFolderFiles}
              fileKindLabel="이미지"
            />
            <p className="text-[10px] text-yellow-500">
              폴더 모드는 자동 감지된 얼굴만 블러합니다. 얼굴이 감지되지 않은 파일은 원본 그대로
              저장됩니다 (실패로 표시).
            </p>
          </>
        )}

        {inputMode === 'files' && file && loaded && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {loaded.width}×{loaded.height} · 감지 {boxes.length}명 · 선택 {enabledCount}명
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
                className="relative rounded-lg border bg-muted overflow-hidden"
                style={displaySize ? { height: displaySize.h } : { minHeight: 200 }}
                onPointerDown={onOverlayPointerDown}
                onPointerMove={onOverlayPointerMove}
                onPointerUp={onOverlayPointerUp}
              >
                {displaySize && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={loaded.element.src}
                      alt="원본"
                      className="absolute"
                      style={{
                        width: displaySize.w,
                        height: displaySize.h,
                        left: imgOffsetX,
                        top: 0,
                      }}
                      draggable={false}
                    />
                    {boxes.map((box) => (
                      <div
                        key={box.id}
                        onClick={(e) => {
                          if (addMode) return;
                          e.stopPropagation();
                          toggleBox(box.id);
                        }}
                        onPointerDown={(e) => {
                          if (addMode) return;
                          e.stopPropagation();
                        }}
                        className={`absolute border-2 transition-colors cursor-pointer ${
                          box.enabled
                            ? box.source === 'manual'
                              ? 'border-yellow-500 bg-yellow-500/20'
                              : 'border-primary bg-primary/20'
                            : 'border-muted-foreground/50 bg-transparent'
                        }`}
                        style={{
                          left: imgOffsetX + box.x * scale,
                          top: box.y * scale,
                          width: box.w * scale,
                          height: box.h * scale,
                        }}
                      >
                        <div className="absolute -top-5 left-0 bg-background border rounded px-1 text-[9px] font-mono flex items-center gap-1">
                          {box.enabled && <Check className="h-2.5 w-2.5 text-green-500" />}
                          {box.source === 'manual' ? '수동' : '자동'}
                          {box.score && ` ${Math.round(box.score * 100)}%`}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBox(box.id);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white text-[9px] flex items-center justify-center shadow"
                        >
                          ×
                        </button>
                      </div>
                    ))}
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
                  {addMode ? '추가 모드 종료' : '수동 박스 추가'}
                </Button>
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
                {boxes.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={selectAll}
                      disabled={processing}
                    >
                      모두 선택
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={deselectAll}
                      disabled={processing}
                    >
                      모두 해제
                    </Button>
                  </>
                )}
              </div>
              {addMode && (
                <p className="text-[10px] text-yellow-500">
                  이미지 위에서 드래그하여 사각형을 그리세요. 완료 후 &quot;추가 모드 종료&quot;.
                </p>
              )}
            </div>
          </>
        )}

        {(file || allFolderFiles.length > 0) && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              블러 설정
            </h2>

            <div>
              <label className="text-xs font-medium mb-1.5 block">블러 모양</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['rect', '사각형'],
                    ['ellipse', '타원'],
                    ['pixelate', '모자이크'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBlurShape(v)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border flex items-center justify-center gap-1 ${
                      blurShape === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    <Shapes className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">
                  {blurShape === 'pixelate' ? '블록 크기' : '블러 강도'}
                </label>
                <span className="text-xs text-muted-foreground">{blurStrength}px</span>
              </div>
              <input
                type="range"
                min={5}
                max={80}
                step={1}
                value={blurStrength}
                onChange={(e) => setBlurStrength(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary"
              />
            </div>

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
                      outputFormat === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
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
                />
              </div>
            )}

            {processing && progressText && inputMode === 'folder' && (
              <p className="text-xs text-muted-foreground truncate">{progressText}</p>
            )}

            <Separator />

            <Button
              onClick={runBlur}
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
                  {inputMode === 'folder' ? '일괄 처리 중...' : '블러 적용 중...'}
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4" />
                  {inputMode === 'folder'
                    ? `${folderFiles.length}장 일괄 블러 적용`
                    : `${enabledCount}명 얼굴에 블러 적용`}
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과
            </h2>
            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="결과"
                className="max-w-full max-h-[50vh] object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              크기: {formatBytes(result.blob.size)}
            </p>
            <Button
              className="w-full"
              onClick={() => triggerDownload(result.blob, result.fileName)}
            >
              <Download className="h-4 w-4" />
              {result.fileName} 다운로드
            </Button>
          </div>
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
          MediaPipe Tasks Vision (Apache 2.0) · BlazeFace 모델. 모든 처리는 브라우저에서.
        </p>
      </main>
    </div>
  );
}
