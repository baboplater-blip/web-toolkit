'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FastForward,
  FileImage,
  Loader2,
  Repeat,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { triggerDownload } from '@/lib/tools/pdf-common';
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
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
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
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const created = [
      'input.gif',
      'palette.png',
      'output.gif',
      'reversed.gif',
      'combined.gif',
    ];
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

        // 각 효과에 맞는 filter chain 구성
        let vf = '';
        if (effect === 'reverse') {
          vf = 'reverse';
        } else if (effect === 'speed') {
          // GIF는 보통 비디오로 취급; setpts=PTS/N 가 N배 재생
          const n = speedPct / 100;
          vf = `setpts=PTS/${n}`;
        } else {
          vf = 'null';
        }

        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-vf',
          `${vf},palettegen=stats_mode=diff`,
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
          `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
          '-loop',
          '0',
          '-y',
          'output.gif',
        ]);

        let finalName = 'output.gif';

        if (effect === 'pingpong') {
          setProgressText('역재생 생성 중');
          await ffmpeg.exec([
            '-i',
            'input.gif',
            '-vf',
            'reverse',
            '-y',
            'reversed.gif',
          ]);

          setProgressText('앞뒤 결합 중');
          await ffmpeg.exec([
            '-i',
            'output.gif',
            '-i',
            'reversed.gif',
            '-filter_complex',
            '[0:v][1:v]concat=n=2:v=1:a=0,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3',
            '-loop',
            '0',
            '-y',
            'combined.gif',
          ]);
          finalName = 'combined.gif';
        }

        const blob = await readOutput(ffmpeg, finalName, 'image/gif');
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
      setError(err instanceof Error ? err.message : '효과 적용 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
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
              <div>
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
