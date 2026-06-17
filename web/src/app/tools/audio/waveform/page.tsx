'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { AUDIO_ACCEPT } from '@/lib/tools/media-limits';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

/** 파형 그리기는 메인스레드 메모리 안에서 디코드되므로 보수적인 가드를 둔다. */
const MAX_BYTES = 100 * 1024 * 1024;

interface WaveOptions {
  width: number;
  height: number;
  waveColor: string;
  bgColor: string;
  transparent: boolean;
}

const DEFAULT_OPTIONS: WaveOptions = {
  width: 1200,
  height: 300,
  waveColor: '#2563eb',
  bgColor: '#ffffff',
  transparent: false,
};

/**
 * AudioBuffer 의 모든 채널을 평균낸 뒤 width 개의 구간으로 다운샘플해
 * 각 구간의 최소·최대 진폭을 구한다. (피크 기반 파형)
 */
function computePeaks(buffer: AudioBuffer, columns: number): { min: number; max: number }[] {
  const channelCount = buffer.numberOfChannels;
  const length = buffer.length;
  const samplesPerColumn = Math.max(1, Math.floor(length / columns));
  const peaks: { min: number; max: number }[] = [];

  const channels: Float32Array[] = [];
  for (let c = 0; c < channelCount; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let col = 0; col < columns; col++) {
    const start = col * samplesPerColumn;
    const end = Math.min(start + samplesPerColumn, length);
    let min = 0;
    let max = 0;
    for (let i = start; i < end; i++) {
      let sum = 0;
      for (let c = 0; c < channelCount; c++) {
        sum += channels[c][i];
      }
      const value = sum / channelCount;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    peaks.push({ min, max });
  }
  return peaks;
}

/** 계산된 피크를 캔버스에 그린다. */
function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: { min: number; max: number }[],
  opts: WaveOptions,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('캔버스를 초기화할 수 없습니다.');

  canvas.width = opts.width;
  canvas.height = opts.height;

  ctx.clearRect(0, 0, opts.width, opts.height);
  if (!opts.transparent) {
    ctx.fillStyle = opts.bgColor;
    ctx.fillRect(0, 0, opts.width, opts.height);
  }

  const mid = opts.height / 2;
  const columns = peaks.length;
  const columnWidth = opts.width / columns;

  ctx.fillStyle = opts.waveColor;
  for (let i = 0; i < columns; i++) {
    const { min, max } = peaks[i];
    const yTop = mid - max * mid;
    const barHeight = Math.max(1, (max - min) * mid);
    ctx.fillRect(i * columnWidth, yTop, Math.max(1, columnWidth - 0.5), barHeight);
  }
}

export default function AudioWaveformPage() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<WaveOptions>(DEFAULT_OPTIONS);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const acceptFile = (f: File) => {
    if (!f.type.startsWith('audio/') && !/\.(mp3|wav|ogg|oga|aac|m4a|flac|opus|amr|aiff|wma)$/i.test(f.name)) {
      setError('오디오 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setFile(f);
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setOptions(DEFAULT_OPTIONS);
    setProcessing(false);
    setError(null);
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);

    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      setError('이 브라우저는 Web Audio 를 지원하지 않습니다.');
      setProcessing(false);
      return;
    }

    const ctx = new AudioCtx();
    try {
      const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('캔버스를 찾을 수 없습니다.');

      const columns = Math.max(1, Math.min(options.width, 4000));
      const peaks = computePeaks(buffer, columns);
      drawWaveform(canvas, peaks, options);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('PNG 생성에 실패했습니다.'));
        }, 'image/png');
      });
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        fileName: renameWithSuffix(file.name, '-waveform', 'png'),
      });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? `파형 생성 실패: ${err.message}`
          : '오디오를 디코드할 수 없습니다. 손상되었거나 지원하지 않는 형식일 수 있습니다.',
      );
    } finally {
      void ctx.close();
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="파형 이미지 생성" onReset={reset} widthClass="max-w-2xl" />

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          오디오 파일의 파형을 분석해 이미지(PNG)로 그립니다. 모든 처리는 브라우저 안에서
          이루어집니다.
        </p>

        {!file && (
          <FileDropZone
            accept={AUDIO_ACCEPT}
            description="파형을 그릴 오디오 파일"
            maxBytes={MAX_BYTES}
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

        {file && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="wf-width" className="mb-1 block text-xs font-medium">
                  너비 (px)
                </label>
                <input
                  id="wf-width"
                  type="number"
                  min={100}
                  max={4000}
                  step={50}
                  value={options.width}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      width: Math.max(100, Math.min(4000, Number(e.target.value) || 100)),
                    }))
                  }
                  disabled={processing}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="wf-height" className="mb-1 block text-xs font-medium">
                  높이 (px)
                </label>
                <input
                  id="wf-height"
                  type="number"
                  min={50}
                  max={2000}
                  step={10}
                  value={options.height}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      height: Math.max(50, Math.min(2000, Number(e.target.value) || 50)),
                    }))
                  }
                  disabled={processing}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="wf-wave" className="mb-1 block text-xs font-medium">
                  파형 색
                </label>
                <input
                  id="wf-wave"
                  type="color"
                  value={options.waveColor}
                  onChange={(e) => setOptions((o) => ({ ...o, waveColor: e.target.value }))}
                  disabled={processing}
                  className="h-9 w-full rounded-md border bg-background"
                  aria-label="파형 색"
                />
              </div>
              <div>
                <label htmlFor="wf-bg" className="mb-1 block text-xs font-medium">
                  배경 색
                </label>
                <input
                  id="wf-bg"
                  type="color"
                  value={options.bgColor}
                  onChange={(e) => setOptions((o) => ({ ...o, bgColor: e.target.value }))}
                  disabled={processing || options.transparent}
                  className="h-9 w-full rounded-md border bg-background disabled:opacity-50"
                  aria-label="배경 색"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={options.transparent}
                onChange={(e) => setOptions((o) => ({ ...o, transparent: e.target.checked }))}
                disabled={processing}
                className="accent-primary"
              />
              투명 배경 (PNG)
            </label>

            <Separator />

            <Button onClick={run} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  파형 생성
                </>
              )}
            </Button>
          </div>
        )}

        {/* 캔버스는 항상 마운트해 두고 화면에는 결과 카드에서만 노출 */}
        <canvas ref={canvasRef} className="hidden" aria-hidden />

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              결과
            </h2>
            <div className="flex items-center justify-center overflow-auto rounded-lg border bg-muted p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="파형 이미지"
                className="max-h-[40vh] max-w-full object-contain"
              />
            </div>
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
