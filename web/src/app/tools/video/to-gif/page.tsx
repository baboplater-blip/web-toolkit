'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clapperboard,
  Download,
  FileVideo,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  formatTime,
  getFFmpeg,
  parseTimeToSeconds,
  probeVideo,
  readOutput,
  writeFile,
  type LoadProgress,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type Effect = 'none' | 'reverse' | 'pingpong';

export default function VideoToGifPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [startTime, setStartTime] = useState('00:00.00');
  const [endTime, setEndTime] = useState('00:03.00');
  const [fps, setFps] = useState(12);
  const [width, setWidth] = useState(480);
  const [effect, setEffect] = useState<Effect>('none');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('비디오 파일만 업로드 가능합니다 (mp4, webm, mov, avi 등).');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const info = await probeVideo(f);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setMeta(info);
      // 기본 구간: 처음 최대 3초
      const endSec = Math.min(info.duration, 3);
      setStartTime('00:00.00');
      setEndTime(formatTime(endSec));
      // 기본 너비: 원본의 절반, 최대 480
      setWidth(Math.min(480, Math.round(info.width / 2)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '비디오 메타 로드 실패');
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setResult(null);
    setError(null);
  };

  const useCurrentTime = (setter: (s: string) => void) => {
    if (!videoRef.current) return;
    setter(formatTime(videoRef.current.currentTime));
  };

  const runConvert = async () => {
    if (!file || !meta) return;
    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);
    if (end <= start) {
      setError('종료 시간이 시작 시간보다 커야 합니다.');
      return;
    }
    const duration = end - start;
    if (duration > 30) {
      setError('구간이 너무 깁니다 (최대 30초 권장). 메모리 부족으로 실패할 수 있습니다.');
      // 경고만 하고 진행 (사용자 판단)
    }

    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);

    const inputName = `input.${file.name.split('.').pop() ?? 'mp4'}`;
    const outputName = 'output.gif';
    const paletteName = 'palette.png';
    const createdFiles: string[] = [inputName, outputName, paletteName];

    try {
      setProgressText('FFmpeg 로드 중 (최초만 ~30MB)');
      const ffmpeg = await getFFmpeg((p: LoadProgress) => {
        const stageMap: Record<LoadProgress['stage'], string> = {
          'fetching-core': 'FFmpeg 코어 다운로드',
          'fetching-wasm': 'WASM 바이너리 다운로드 (~30MB)',
          initializing: 'FFmpeg 초기화',
          ready: '준비 완료',
        };
        setProgressText(stageMap[p.stage]);
      });

      // 진행률 리스너 (한 번만 등록, 이후 계속 사용)
      const onProgress = ({ progress }: { progress: number }) => {
        if (Number.isFinite(progress)) {
          setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);

      try {
        setProgressText('입력 파일 준비');
        await writeFile(ffmpeg, inputName, file);

        const vf: string[] = [];
        vf.push(`fps=${fps}`);
        vf.push(`scale=${width}:-1:flags=lanczos`);
        if (effect === 'reverse') vf.push('reverse');

        // 2-pass 팔레트 기법: 고품질 GIF 생성
        // 1) palettegen 으로 최적 팔레트 생성
        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-ss',
          String(start),
          '-t',
          String(duration),
          '-i',
          inputName,
          '-vf',
          `${vf.join(',')},palettegen=stats_mode=diff`,
          '-y',
          paletteName,
        ]);

        // 2) 팔레트를 사용하여 GIF 인코딩
        setProgressText('GIF 인코딩 중');
        const finalFilter = `${vf.join(',')}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`;
        await ffmpeg.exec([
          '-ss',
          String(start),
          '-t',
          String(duration),
          '-i',
          inputName,
          '-i',
          paletteName,
          '-lavfi',
          finalFilter,
          '-loop',
          '0',
          '-y',
          outputName,
        ]);

        // 핑퐁 효과: 원본 GIF + 역재생 GIF 를 concat
        if (effect === 'pingpong') {
          setProgressText('핑퐁 효과 적용 중');
          const reversedName = 'reversed.gif';
          const combinedName = 'combined.gif';
          createdFiles.push(reversedName, combinedName);
          await ffmpeg.exec(['-i', outputName, '-vf', 'reverse', '-y', reversedName]);
          await ffmpeg.exec([
            '-i',
            outputName,
            '-i',
            reversedName,
            '-filter_complex',
            '[0:v][1:v]concat=n=2:v=1:a=0,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3',
            '-loop',
            '0',
            '-y',
            combinedName,
          ]);
          const pingBlob = await readOutput(ffmpeg, combinedName, 'image/gif');
          setResult({
            blob: pingBlob,
            url: URL.createObjectURL(pingBlob),
            fileName: `${stripExtension(file.name)}.gif`,
          });
          return;
        }

        const blob = await readOutput(ffmpeg, outputName, 'image/gif');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}.gif`,
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, createdFiles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GIF 변환 실패');
    } finally {
      setProcessing(false);
      setProgress(0);
      setProgressText('');
    }
  };

  const estimatedDuration = (() => {
    const s = parseTimeToSeconds(startTime);
    const e = parseTimeToSeconds(endTime);
    return Math.max(0, e - s);
  })();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Clapperboard className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 → GIF</h1>
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
            accept="video/*"
            description="MP4 / WebM / MOV / AVI / MKV 등 비디오"
            hint="FFmpeg.wasm (~30MB) 을 최초 실행 시 다운로드합니다. 이후 캐시."
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && meta && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileVideo className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {meta.width}×{meta.height} ·{' '}
                  {formatTime(meta.duration)}
                </p>
              </div>
            </div>

            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full rounded-lg border bg-black max-h-[40vh]"
            />

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">구간 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-muted-foreground">시작</label>
                    <button
                      type="button"
                      onClick={() => useCurrentTime(setStartTime)}
                      disabled={processing}
                      className="text-[10px] text-primary hover:underline"
                    >
                      현재 시점 사용
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="MM:SS.ms"
                    disabled={processing}
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-muted-foreground">종료</label>
                    <button
                      type="button"
                      onClick={() => useCurrentTime(setEndTime)}
                      disabled={processing}
                      className="text-[10px] text-primary hover:underline"
                    >
                      현재 시점 사용
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="MM:SS.ms"
                    disabled={processing}
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                구간 길이: {estimatedDuration.toFixed(2)}초
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">프레임률 (FPS)</label>
                  <span className="text-xs text-muted-foreground">{fps}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">너비 (px)</label>
                  <span className="text-xs text-muted-foreground">{width}</span>
                </div>
                <input
                  type="range"
                  min={120}
                  max={Math.max(120, Math.min(1280, meta.width))}
                  step={10}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">효과</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['none', '기본'],
                    ['reverse', '역재생'],
                    ['pingpong', '핑퐁 (앞뒤반복)'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEffect(v)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      effect === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

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

            <Button onClick={runConvert} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  변환 중...
                </>
              ) : (
                <>
                  <Clapperboard className="h-4 w-4" />
                  GIF 로 변환
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              팁: 구간 3~5초, 너비 320~480, FPS 10~15 조합이 가장 실용적입니다.
            </p>
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
                alt="GIF"
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

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          FFmpeg.wasm (GPL) · 2-pass 팔레트 기법으로 고품질 GIF 생성. 모든 처리는 브라우저에서.
        </p>
      </main>
    </div>
  );
}
