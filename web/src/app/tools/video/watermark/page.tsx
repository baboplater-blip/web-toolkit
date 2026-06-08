'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  ImageIcon,
  Loader2,
  RotateCcw,
  Stamp,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { triggerDownload } from '@/lib/tools/file-utils';
import {
  VIDEO_ACCEPT,
  explainFfmpegError,
  validateMediaSize,
} from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';

const IMAGE_ACCEPT = 'image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

const CORNER_LABEL: Record<Corner, string> = {
  tl: '좌상단',
  tr: '우상단',
  bl: '좌하단',
  br: '우하단',
};

interface ResultData {
  blob: Blob;
  url: string;
  size: number;
  name: string;
}

/**
 * 모서리·여백에 따른 overlay 좌표식을 만든다.
 * overlay 필터의 W/H 는 메인 영상, w/h 는 워터마크 크기를 가리킨다.
 */
function overlayPosition(corner: Corner, margin: number): string {
  switch (corner) {
    case 'tl':
      return `${margin}:${margin}`;
    case 'tr':
      return `W-w-${margin}:${margin}`;
    case 'bl':
      return `${margin}:H-h-${margin}`;
    case 'br':
      return `W-w-${margin}:H-h-${margin}`;
  }
}

function buildArgs(
  corner: Corner,
  margin: number,
  opacity: number,
  videoInput: string,
  logoInput: string,
  output: string,
): string[] {
  // opacity 0~1 을 alpha 채널 배율로 적용한 뒤 overlay 합성
  const pos = overlayPosition(corner, margin);
  const filter = `[1]format=rgba,colorchannelmixer=aa=${opacity}[wm];[0][wm]overlay=${pos}`;
  return [
    '-i',
    videoInput,
    '-i',
    logoInput,
    '-filter_complex',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'copy',
    '-y',
    output,
  ];
}

export default function VideoWatermarkPage() {
  const [video, setVideo] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [corner, setCorner] = useState<Corner>('br');
  const [margin, setMargin] = useState('16');
  const [opacity, setOpacity] = useState(0.8);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const acceptVideo = useCallback((f: File) => {
    const sizeError = validateMediaSize(f);
    if (sizeError) {
      setError(sizeError);
      return;
    }
    setError(null);
    setResult(null);
    setVideo(f);
    setVideoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const acceptLogo = useCallback((f: File) => {
    setError(null);
    setResult(null);
    setLogo(f);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const reset = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    if (result?.url) URL.revokeObjectURL(result.url);
    setVideo(null);
    setLogo(null);
    setVideoPreview(null);
    setLogoPreview(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStage('');
  };

  const run = async () => {
    if (!video) {
      setError('워터마크를 적용할 영상을 먼저 선택해주세요.');
      return;
    }
    if (!logo) {
      setError('워터마크로 합성할 로고 이미지를 선택해주세요.');
      return;
    }
    const marginPx = Number(margin);
    if (!Number.isFinite(marginPx) || !Number.isInteger(marginPx) || marginPx < 0) {
      setError('여백은 0 이상의 정수로 입력해주세요.');
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const videoExt = video.name.split('.').pop() || 'mp4';
    const logoExt = logo.name.split('.').pop() || 'png';
    const videoInput = `in.${videoExt}`;
    const logoInput = `logo.${logoExt}`;
    const outputName = 'watermarked.mp4';
    let ffmpeg;
    try {
      setStage('FFmpeg 로딩');
      ffmpeg = await getFFmpeg();
      setStage('파일 준비');
      await writeFile(ffmpeg, videoInput, video);
      await writeFile(ffmpeg, logoInput, logo);

      const onProgress = ({ progress: p }: { progress: number }) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      };
      ffmpeg.on('progress', onProgress);

      setStage('워터마크 합성');
      await ffmpeg.exec(
        buildArgs(corner, marginPx, opacity, videoInput, logoInput, outputName),
      );
      ffmpeg.off('progress', onProgress);

      const blob = await readOutput(ffmpeg, outputName, 'video/mp4');
      const url = URL.createObjectURL(blob);

      const base = video.name.replace(/\.[^.]+$/, '');
      setResult({ blob, url, size: blob.size, name: `${base}-watermarked.mp4` });
      setProgress(100);
      setStage('완료');

      await cleanupFiles(ffmpeg, [videoInput, logoInput, outputName]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '워터마크 처리 실패';
      setError(explainFfmpegError(msg, video.size));
      if (ffmpeg) await cleanupFiles(ffmpeg, [videoInput, logoInput, outputName]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'h-8 w-8',
              })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Stamp className="h-5 w-5" />
            <h1 className="font-semibold text-base">영상 워터마크</h1>
          </div>
          {(video || logo) && !busy && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1. 영상
            </h2>
            {!video ? (
              <FileDropZone
                accept={VIDEO_ACCEPT}
                description="영상을 업로드하세요"
                onFiles={(picked) => acceptVideo(picked[0])}
                onError={setError}
              />
            ) : (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <FileVideo className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatBytes(video.size)}
                    </p>
                  </div>
                </div>
                {videoPreview && (
                  <video
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg max-h-[200px] bg-black"
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              2. 로고 이미지
            </h2>
            {!logo ? (
              <FileDropZone
                accept={IMAGE_ACCEPT}
                description="로고/이미지를 업로드하세요"
                hint="PNG 등 투명 배경 이미지를 권장합니다."
                onFiles={(picked) => acceptLogo(picked[0])}
                onError={setError}
              />
            ) : (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{logo.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatBytes(logo.size)}
                    </p>
                  </div>
                </div>
                {logoPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="로고 미리보기"
                    className="mx-auto max-h-[120px] rounded-lg border bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-[length:16px_16px]"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {video && (
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              워터마크 설정
            </h2>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                위치
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(CORNER_LABEL) as Corner[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCorner(c)}
                    className={`rounded-lg border h-10 text-xs font-medium transition ${
                      corner === c
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                    aria-pressed={corner === c}
                  >
                    {CORNER_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  여백 (px)
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  placeholder="16"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  불투명도 ({Math.round(opacity * 100)}%)
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-primary mt-3"
                  aria-label="불투명도"
                />
              </label>
            </div>

            <Button onClick={run} disabled={busy} className="w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {stage} {progress}%
                </>
              ) : (
                <>
                  <Stamp className="h-4 w-4 mr-1.5" />
                  워터마크 적용
                </>
              )}
            </Button>
            {busy && (
              <div
                className="h-1.5 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {formatBytes(result.size)}
              </span>
            </div>
            <Separator />
            <video
              src={result.url}
              controls
              className="w-full rounded-lg max-h-[400px] bg-black"
            />
            <Button
              onClick={() => triggerDownload(result.blob, result.name)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1.5" />
              다운로드
            </Button>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            로고 이미지를 RGBA 로 변환한 뒤 colorchannelmixer 로 불투명도를 적용하고
            overlay 필터로 지정한 모서리에 합성합니다. 비디오는 H.264 로 재인코딩되고
            오디오는 그대로 복사됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
