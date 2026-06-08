'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FastForward,
  FileImage,
  Loader2,
  Repeat,
  RotateCcw,
  Shuffle,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  resetFFmpeg,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { explainFfmpegError, validateMediaSize } from '@/lib/tools/media-limits';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

type Effect = 'reverse' | 'speed' | 'pingpong';

export default function GifEffectsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [effect, setEffect] = useState<Effect>('speed');
  const [speedPct, setSpeedPct] = useState(200); // 200% = 2x
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  // 취소 여부 — 취소 시 in-flight exec 의 reject 를 에러로 표시하지 않기 위해 사용.
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const acceptFile = (f: File) => {
    if (!/\.gif$/i.test(f.name) && f.type !== 'image/gif') {
      setError('GIF 파일만 업로드 가능합니다.');
      return;
    }
    const sizeError = validateMediaSize(f);
    if (sizeError) {
      setError(sizeError);
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  /**
   * GIF 의 평균 프레임레이트를 FFmpeg 로그에서 읽는다.
   * 속도 효과 시 명시적 출력 fps 를 지정해 GIF delay 양자화로 인한 속도 어긋남을 막는다.
   */
  const probeGifFps = async (
    ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
    name: string,
  ): Promise<number> => {
    let fps = 0;
    const logHandler = (e: { message: string }) => {
      const m = e.message.match(/(\d+(?:\.\d+)?)\s*fps/);
      if (m) fps = Number(m[1]);
    };
    ffmpeg.on('log', logHandler);
    try {
      await ffmpeg.exec(['-i', name, '-f', 'null', '-']).catch(() => {
        /* null muxer 는 에러 코드 반환하지만 로그는 파싱됨 */
      });
    } finally {
      ffmpeg.off('log', logHandler);
    }
    return Number.isFinite(fps) && fps > 0 ? fps : 0;
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const runEffect = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    cancelledRef.current = false;
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const created = ['input.gif', 'palette.png', 'output.gif'];
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress }: { progress: number }) => {
        if (Number.isFinite(progress)) {
          setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);
      try {
        await writeFile(ffmpeg, 'input.gif', file);

        if (effect === 'pingpong') {
          // 핑퐁은 이미 팔레트화된 결과를 다시 concat 하면 이중 양자화로 밴딩이
          // 생긴다. 원본에서 reverse+concat 후 단일 팔레트로 한 번에 인코딩한다.
          setProgressText('앞뒤 결합 중');
          await ffmpeg.exec([
            '-i',
            'input.gif',
            '-filter_complex',
            '[0:v]reverse[r];[0:v][r]concat=n=2[v];[v]split[a][b];' +
              '[a]palettegen=stats_mode=diff:reserve_transparent=1[p];' +
              '[b][p]paletteuse=dither=bayer:bayer_scale=3:alpha_threshold=128',
            '-loop',
            '0',
            '-y',
            'output.gif',
          ]);
        } else {
          // 각 효과에 맞는 filter chain 구성
          let vf = '';
          if (effect === 'reverse') {
            vf = 'reverse';
          } else {
            // 속도 조절: setpts=PTS/N 만으로는 GIF delay 양자화로 실제 속도가
            // 슬라이더와 어긋난다 — 원본 fps 를 읽어 명시적 출력 fps 를 짝지운다.
            const n = speedPct / 100;
            const srcFps = await probeGifFps(ffmpeg, 'input.gif');
            const fpsPart = srcFps > 0 ? `,fps=${srcFps}` : '';
            vf = `setpts=PTS/${n}${fpsPart}`;
          }

          setProgressText('팔레트 생성 중');
          await ffmpeg.exec([
            '-i',
            'input.gif',
            '-vf',
            `${vf},palettegen=stats_mode=diff:reserve_transparent=1`,
            '-y',
            'palette.png',
          ]);

          setProgressText('GIF 인코딩 중');
          await ffmpeg.exec([
            '-i',
            'input.gif',
            '-i',
            'palette.png',
            '-lavfi',
            `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:alpha_threshold=128`,
            '-loop',
            '0',
            '-y',
            'output.gif',
          ]);
        }

        const blob = await readOutput(ffmpeg, 'output.gif', 'image/gif');
        const suffix =
          effect === 'reverse'
            ? '-reversed'
            : effect === 'pingpong'
              ? '-pingpong'
              : `-${(speedPct / 100).toFixed(1)}x`;
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(file.name, suffix, 'gif'),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      // 취소로 인한 reject 는 에러로 표시하지 않는다 (cancelRun 이 상태를 이미 정리).
      if (cancelledRef.current) return;
      const msg = err instanceof Error ? err.message : '효과 적용 실패';
      const friendly = explainFfmpegError(msg, file.size);
      // explainFfmpegError 가 메시지를 바꿨다면 OOM/abort 패턴 — 싱글턴이
      // 망가졌을 수 있으니 폐기해 다음 도구가 깨끗하게 재로드하도록 한다.
      if (friendly !== msg) resetFFmpeg();
      setError(friendly);
    } finally {
      // 취소 시엔 cancelRun 이 상태를 정리하므로 건너뛴다.
      if (!cancelledRef.current) {
        setProcessing(false);
        setProgressText('');
        setProgress(0);
      }
    }
  };

  // 처리 중 취소: FFmpeg 워커를 종료(resetFFmpeg)해 즉시 멈춘다.
  // 워커 종료로 in-flight exec 는 reject 되지만 cancelledRef 로 무시한다.
  const cancelRun = () => {
    if (!processing) return;
    cancelledRef.current = true;
    resetFFmpeg();
    setProcessing(false);
    setProgressText('');
    setProgress(0);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <FastForward className="h-5 w-5" />
            <h1 className="font-semibold text-base">GIF 효과</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {!file && (
          <FileDropZone
            accept="image/gif"
            description="효과를 적용할 GIF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="원본"
                className="max-w-full max-h-[30vh] object-contain"
              />
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">효과 선택</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEffect('speed')}
                  disabled={processing}
                  className={`h-auto py-2 px-2 text-xs rounded-md border flex flex-col items-center gap-0.5 ${
                    effect === 'speed'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <FastForward className="h-4 w-4" />
                  <span className="font-medium">속도 조절</span>
                  <span className="text-[10px] opacity-80">0.25x ~ 4x</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEffect('reverse')}
                  disabled={processing}
                  className={`h-auto py-2 px-2 text-xs rounded-md border flex flex-col items-center gap-0.5 ${
                    effect === 'reverse'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <Shuffle className="h-4 w-4" />
                  <span className="font-medium">역재생</span>
                  <span className="text-[10px] opacity-80">뒤에서 앞으로</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEffect('pingpong')}
                  disabled={processing}
                  className={`h-auto py-2 px-2 text-xs rounded-md border flex flex-col items-center gap-0.5 ${
                    effect === 'pingpong'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <Repeat className="h-4 w-4" />
                  <span className="font-medium">핑퐁</span>
                  <span className="text-[10px] opacity-80">앞뒤 반복</span>
                </button>
              </div>
            </div>

            {effect === 'speed' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">재생 속도</label>
                  <span className="text-xs text-muted-foreground">
                    {(speedPct / 100).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={400}
                  step={5}
                  value={speedPct}
                  onChange={(e) => setSpeedPct(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary" aria-label="재생 속도" />
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {[50, 100, 200, 300].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSpeedPct(v)}
                      disabled={processing}
                      className="h-7 text-[10px] rounded-md border hover:bg-muted"
                    >
                      {(v / 100).toFixed(v === 100 ? 0 : 1)}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {processing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={cancelRun}>
                  <X className="h-3.5 w-3.5" />
                  취소
                </Button>
              </div>
            )}

            <Separator />

            <Button onClick={runEffect} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  적용 중...
                </>
              ) : (
                <>
                  <FastForward className="h-4 w-4" />
                  효과 적용
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
                className="max-w-full max-h-[40vh] object-contain"
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
      </main>
    </div>
  );
}
