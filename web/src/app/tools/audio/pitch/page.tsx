'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  resetFFmpeg,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import {
  AUDIO_ACCEPT,
  explainFfmpegError,
  validateMediaSize,
} from '@/lib/tools/media-limits';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

/** 표준 출력 샘플레이트 — asetrate 로 바뀐 sr 을 정상값으로 되돌린다. */
const TARGET_SAMPLE_RATE = 44100;

/**
 * FFmpeg atempo 는 0.5~2.0 만 허용하므로 범위를 벗어나면 체인으로 분해한다.
 * 반음 ±12 범위에서 tempo 보정 계수는 정확히 0.5~2.0 안에 들지만,
 * 안전을 위해 일반화된 체인을 사용한다.
 */
function buildAtempoChain(rate: number): string {
  const filters: string[] = [];
  let remaining = rate;
  while (remaining > 2.0) {
    filters.push('atempo=2.0');
    remaining /= 2.0;
  }
  while (remaining < 0.5) {
    filters.push('atempo=0.5');
    remaining /= 0.5;
  }
  filters.push(`atempo=${remaining.toFixed(6)}`);
  return filters.join(',');
}

/**
 * 반음(semitone) 단위 피치 변경 필터 그래프 생성.
 * asetrate 로 피치+속도를 함께 올린 뒤, atempo 로 속도를 원래대로 되돌려
 * "속도 유지, 피치만 변경" 을 구현한다. aresample 로 표준 sr 로 리샘플.
 */
function buildPitchFilter(semitones: number, sourceRate: number): string {
  const factor = Math.pow(2, semitones / 12);
  const shiftedRate = Math.round(sourceRate * factor);
  const tempoChain = buildAtempoChain(1 / factor);
  return `asetrate=${shiftedRate},aresample=${TARGET_SAMPLE_RATE},${tempoChain}`;
}

export default function AudioPitchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [semitones, setSemitones] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const sampleRateRef = useRef<number>(44100);

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

  /** Web Audio 로 원본 샘플레이트만 빠르게 추출 (실패해도 기본값 사용). */
  const probeSampleRate = async (f: File): Promise<number> => {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return TARGET_SAMPLE_RATE;
    const ctx = new AudioCtx();
    try {
      const buffer = await ctx.decodeAudioData(await f.arrayBuffer());
      return buffer.sampleRate;
    } finally {
      void ctx.close();
    }
  };

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('audio/') && !/\.(mp3|wav|ogg|oga|aac|m4a|flac|opus|amr|aiff|wma)$/i.test(f.name)) {
      setError('오디오 파일만 업로드 가능합니다.');
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
    try {
      sampleRateRef.current = await probeSampleRate(f);
    } catch {
      sampleRateRef.current = TARGET_SAMPLE_RATE;
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setSemitones(0);
    setProcessing(false);
    setProgress(0);
    setProgressText('');
    setError(null);
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    if (semitones === 0) {
      setError('반음을 0 이외의 값으로 설정하세요.');
      return;
    }
    setError(null);
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
    const inputName = `input.${ext}`;
    const outputName = `output.${ext}`;
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress: p }: { progress: number }) => {
        if (Number.isFinite(p)) {
          setProgress(Math.max(0, Math.min(100, Math.round(p * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);
      try {
        await writeFile(ffmpeg, inputName, file);
        setProgressText('피치 변경 중');
        const filter = buildPitchFilter(semitones, sampleRateRef.current);
        await ffmpeg.exec(['-i', inputName, '-af', filter, '-y', outputName]);
        const blob = await readOutput(ffmpeg, outputName, file.type || `audio/${ext}`);
        const suffix = semitones > 0 ? `-pitch+${semitones}` : `-pitch${semitones}`;
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(file.name, suffix, ext),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [inputName, outputName]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '피치 변경에 실패했습니다.';
      const friendly = explainFfmpegError(msg, file.size);
      if (friendly !== msg) resetFFmpeg();
      setError(friendly);
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="오디오 음정 변경" onReset={reset} widthClass="max-w-2xl" />

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          속도는 유지하고 음정(피치)만 반음 단위로 올리거나 내립니다.
        </p>

        {!file && (
          <FileDropZone
            accept={AUDIO_ACCEPT}
            description="음정을 바꿀 오디오 파일 (속도 유지)"
            onFiles={(files) => acceptFile(files[0])}
            onError={setError}
          />
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {file && previewUrl && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Music2 className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <audio src={previewUrl} controls className="w-full" />

            <Separator />

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="pitch-range" className="text-xs font-medium">
                  음정 (반음)
                </label>
                <span className="font-mono text-base font-bold">
                  {semitones > 0 ? `+${semitones}` : semitones}
                </span>
              </div>
              <input
                id="pitch-range"
                type="range"
                min={-12}
                max={12}
                step={1}
                value={semitones}
                onChange={(e) => setSemitones(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary"
                aria-label="음정 (반음)"
              />
              <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground">
                <span>-12 (한 옥타브 낮게)</span>
                <span>0</span>
                <span>+12 (한 옥타브 높게)</span>
              </div>
            </div>

            {processing && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Separator />

            <Button onClick={run} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Music2 className="h-4 w-4" />
                  음정 변경
                </>
              )}
            </Button>

            <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
              FFmpeg asetrate + atempo — 속도는 유지하고 피치만 변경
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              결과
            </h2>
            <audio src={result.url} controls className="w-full" />
            <p className="text-center text-xs text-muted-foreground">
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
