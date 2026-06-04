'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, Download, Loader2, ScanFace, Square } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';
import { paintCover, type CoverOptions, type CoverStyle } from '@/lib/tools/cover';

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const EMOJIS = ['😎', '🙂', '🐶', '🌚', '🚫', '👤'];

interface VideoFaceDetector {
  detectForVideo: (
    input: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number,
  ) => {
    detections?: Array<{
      boundingBox?: { originX: number; originY: number; width: number; height: number };
    }>;
  };
  close: () => void;
}

async function createVideoDetector(onStatus?: (s: string) => void): Promise<VideoFaceDetector> {
  onStatus?.('MediaPipe 로드 중');
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
  onStatus?.('감지 모델 로드 중');
  const detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    minDetectionConfidence: 0.4,
  });
  return detector as unknown as VideoFaceDetector;
}

function pickMime(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm',
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'video/webm';
}

export default function VideoBlurFacePage() {
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<CoverStyle>('blur');
  const [strength, setStrength] = useState(30);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  function onFiles(files: File[]) {
    const f = files[0];
    if (!f) return;
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
    setFile(f);
  }

  async function process() {
    if (!file || !canvasRef.current) return;
    setProcessing(true);
    setError(null);
    setProgress(0);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);

    const opts: CoverOptions = { style, shape: 'rect', strength, autoScale: true, emoji, solidColor: '#111111' };
    const video = document.createElement('video');
    video.muted = false;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    let detector: VideoFaceDetector | null = null;
    let audioCtx: AudioContext | null = null;
    let recorder: MediaRecorder | null = null;
    let stopped = false;

    const cleanup = () => {
      detector?.close();
      try {
        audioCtx?.close();
      } catch {
        /* noop */
      }
      URL.revokeObjectURL(objectUrl);
    };

    try {
      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('동영상을 불러올 수 없습니다.'));
      });

      const W = video.videoWidth;
      const H = video.videoHeight;
      const duration = video.duration;
      if (!W || !H) throw new Error('동영상 크기를 확인할 수 없습니다.');

      const canvas = canvasRef.current;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트 생성 실패');

      setStatus('감지 모델 준비 중');
      detector = await createVideoDetector(setStatus);

      // 캔버스 영상 트랙 + 원본 오디오 트랙(스피커로는 무음) 합성
      const canvasStream = canvas.captureStream(30);
      const videoTrack = canvasStream.getVideoTracks()[0];
      const tracks: MediaStreamTrack[] = [videoTrack];
      try {
        audioCtx = new AudioContext();
        const srcNode = audioCtx.createMediaElementSource(video);
        const destNode = audioCtx.createMediaStreamDestination();
        srcNode.connect(destNode); // destination(스피커)에는 연결 안 함 → 무음
        destNode.stream.getAudioTracks().forEach((t) => tracks.push(t));
      } catch {
        /* 오디오 없는 영상이거나 미지원 — 영상만 */
      }

      const outStream = new MediaStream(tracks);
      const mime = pickMime();
      recorder = new MediaRecorder(outStream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      const done = new Promise<Blob>((res) => {
        recorder!.onstop = () => res(new Blob(chunks, { type: 'video/webm' }));
      });

      setStatus('얼굴 가림 처리 중 (재생 속도로 진행)');
      recorder.start();

      stopRef.current = () => {
        stopped = true;
        video.pause();
      };

      const detect = (tsMs: number) => {
        let dets: ReturnType<VideoFaceDetector['detectForVideo']>['detections'];
        try {
          dets = detector!.detectForVideo(video, tsMs).detections;
        } catch {
          dets = [];
        }
        ctx.drawImage(video, 0, 0, W, H);
        (dets ?? []).forEach((d) => {
          const bb = d.boundingBox;
          if (!bb) return;
          const padX = bb.width * 0.1;
          const padY = bb.height * 0.15;
          paintCover(
            ctx,
            video,
            W,
            H,
            W,
            H,
            {
              x: Math.max(0, bb.originX - padX),
              y: Math.max(0, bb.originY - padY),
              w: bb.width + padX * 2,
              h: bb.height + padY * 2,
            },
            opts,
          );
        });
        if (videoTrack && 'requestFrame' in videoTrack) {
          (videoTrack as CanvasCaptureMediaStreamTrack).requestFrame();
        }
        if (duration > 0) setProgress(Math.min(100, Math.round((video.currentTime / duration) * 100)));
      };

      // 프레임 콜백 (지원 시) 또는 rAF 폴백
      const rvfc =
        typeof video.requestVideoFrameCallback === 'function'
          ? video.requestVideoFrameCallback.bind(video)
          : null;
      const loop = (tsMs: number) => {
        if (stopped || video.ended) return;
        detect(tsMs);
        if (rvfc) {
          rvfc((_n, meta) => loop(meta.mediaTime * 1000));
        } else {
          requestAnimationFrame(() => loop(video.currentTime * 1000));
        }
      };

      await video.play();
      loop(0);

      await new Promise<void>((res) => {
        video.onended = () => res();
        const iv = setInterval(() => {
          if (stopped || video.ended) {
            clearInterval(iv);
            res();
          }
        }, 200);
      });

      if (recorder.state !== 'inactive') recorder.stop();
      const blob = await done;
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size });
      setStatus(stopped ? '중단됨 (지금까지 분량 저장)' : '완료');
    } catch (e) {
      setError(e instanceof Error ? e.message : '동영상 처리 실패');
    } finally {
      stopRef.current = null;
      cleanup();
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <ScanFace className="h-5 w-5" />
          <h1 className="font-semibold text-base">동영상 얼굴 블러</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {!file && (
          <FileDropZone accept="video/*" onFiles={onFiles} onError={(m) => setError(m)} />
        )}
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

        {file && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <p className="text-sm font-medium truncate">{file.name}</p>

              <div>
                <label className="text-xs font-medium mb-1.5 block">가림 스타일</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      ['blur', '블러'],
                      ['pixelate', '모자이크'],
                      ['bar', '검은 막대'],
                      ['emoji', '이모지'],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStyle(v)}
                      disabled={processing}
                      className={`h-9 text-xs rounded-md border ${
                        style === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                      } disabled:opacity-50`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {style === 'emoji' && (
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`h-9 w-9 text-lg rounded-md border ${emoji === em ? 'bg-primary/20 border-primary' : 'bg-background hover:bg-muted'}`}
                      aria-label={`이모지 ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {(style === 'blur' || style === 'pixelate') && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">{style === 'pixelate' ? '모자이크 크기' : '블러 강도'}</label>
                    <span className="text-xs text-muted-foreground">{strength}px</span>
                  </div>
                  <input type="range" min={10} max={80} value={strength} onChange={(e) => setStrength(Number(e.target.value))} disabled={processing} className="w-full accent-primary" aria-label="강도" />
                </div>
              )}

              {!processing ? (
                <Button className="w-full" onClick={process}>
                  <ScanFace className="h-4 w-4" />
                  얼굴 가림 시작
                </Button>
              ) : (
                <Button className="w-full" variant="outline" onClick={() => stopRef.current?.()}>
                  <Square className="h-4 w-4" />
                  중단하고 저장
                </Button>
              )}
            </div>

            {/* 처리 미리보기 캔버스 */}
            <div className={`rounded-xl border bg-muted p-2 ${processing || result ? '' : 'hidden'}`}>
              <canvas ref={canvasRef} className="w-full rounded" aria-label="처리 미리보기" />
            </div>

            {processing && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {status} · {progress}%
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {result && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">결과 · {(result.size / 1048576).toFixed(1)} MB (webm)</h2>
                <video src={result.url} controls className="w-full rounded border" />
                <Button
                  className="w-full"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = result.url;
                    a.download = file.name.replace(/\.[^.]+$/, '') + '-blurred.webm';
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                  webm 다운로드
                </Button>
              </div>
            )}
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
          <p>
            동영상의 모든 얼굴을 AI로 추적해 가립니다. 처리는 <strong>재생 속도로 진행</strong>되며(30초 영상 ≈ 30초),
            원본 오디오는 그대로 유지됩니다. 출력은 webm 포맷입니다.
          </p>
          <p>
            긴 영상·고해상도는 시간이 오래 걸리고 일부 프레임에서 얼굴이 순간 노출될 수 있습니다. 짧은 클립을
            권장합니다. 모든 처리는 브라우저 안에서 이뤄지며 영상은 어디로도 전송되지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
