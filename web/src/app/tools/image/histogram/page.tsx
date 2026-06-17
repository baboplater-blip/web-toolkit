'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { loadBitmap } from '@/lib/tools/image-common';

const MAX_INPUT_BYTES = 50 * 1024 * 1024;
// 분석용 다운샘플 한도(긴 변). 큰 이미지도 분포는 충분히 보존하면서 빠르게 처리한다.
const ANALYSIS_MAX_DIMENSION = 1024;
const BINS = 256;

type Channel = 'r' | 'g' | 'b' | 'lum';

interface Histogram {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
}

const CHANNELS: { key: Channel; label: string; color: string }[] = [
  { key: 'r', label: 'R', color: '#ef4444' },
  { key: 'g', label: 'G', color: '#22c55e' },
  { key: 'b', label: 'B', color: '#3b82f6' },
  { key: 'lum', label: '밝기', color: '#a1a1aa' },
];

/** 긴 변을 max 이하로 줄이는 배율(1 이하). */
function analysisScale(width: number, height: number, max: number): number {
  const longest = Math.max(width, height);
  return longest > max ? max / longest : 1;
}

function computeHistogram(data: Uint8ClampedArray): Histogram {
  const r = new Array<number>(BINS).fill(0);
  const g = new Array<number>(BINS).fill(0);
  const b = new Array<number>(BINS).fill(0);
  const lum = new Array<number>(BINS).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    r[red]++;
    g[green]++;
    b[blue]++;
    // ITU-R BT.601 luma 가중치.
    const l = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
    lum[Math.min(BINS - 1, l)]++;
  }
  return { r, g, b, lum };
}

export default function ImageHistogramPage() {
  const [file, setFile] = useState<File | null>(null);
  const [histogram, setHistogram] = useState<Histogram | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Record<Channel, boolean>>({
    r: true,
    g: true,
    b: true,
    lum: false,
  });

  useEffect(() => {
    if (!file) return;
    void analyze(file);
  }, [file]);

  async function analyze(target: File): Promise<void> {
    setBusy(true);
    setError(null);
    setHistogram(null);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(target);
      const scale = analysisScale(bitmap.width, bitmap.height, ANALYSIS_MAX_DIMENSION);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
      ctx.drawImage(bitmap, 0, 0, width, height);

      const { data } = ctx.getImageData(0, 0, width, height);
      setHistogram(computeHistogram(data));
    } catch (e) {
      console.error('[image/histogram] analyze failed', e);
      setError(e instanceof Error ? e.message : '히스토그램 분석에 실패했습니다.');
    } finally {
      bitmap?.close();
      setBusy(false);
    }
  }

  function toggle(channel: Channel): void {
    setActive((prev) => ({ ...prev, [channel]: !prev[channel] }));
  }

  function reset(): void {
    setFile(null);
    setHistogram(null);
    setBusy(false);
    setError(null);
    setActive({ r: true, g: true, b: true, lum: false });
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 히스토그램" widthClass="max-w-2xl" onReset={file ? reset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">이미지의 RGB·밝기 분포를 히스토그램으로 분석합니다.</p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          maxBytes={MAX_INPUT_BYTES}
          title="이미지 1장을 끌어다 놓거나 클릭하여 선택"
          description="JPG · PNG · WebP · GIF 등"
        />

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {busy && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> 분석 중…
          </p>
        )}

        {histogram && !busy && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <Button
                  key={ch.key}
                  size="sm"
                  variant={active[ch.key] ? 'default' : 'outline'}
                  onClick={() => toggle(ch.key)}
                >
                  <span
                    className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ch.color }}
                    aria-hidden
                  />
                  {ch.label}
                </Button>
              ))}
            </div>
            <HistogramChart histogram={histogram} active={active} />
          </div>
        )}
      </main>
    </div>
  );
}

function HistogramChart({
  histogram,
  active,
}: {
  histogram: Histogram;
  active: Record<Channel, boolean>;
}) {
  const visible = CHANNELS.filter((ch) => active[ch.key]);
  // 표시 중인 채널들의 최대 빈도로 정규화(0 보호).
  const peak = Math.max(
    1,
    ...visible.flatMap((ch) => histogram[ch.key]),
  );

  const viewWidth = BINS;
  const viewHeight = 100;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="none"
      className="h-40 w-full rounded-md bg-black/40"
      role="img"
      aria-label="채널별 히스토그램"
    >
      {visible.map((ch) => {
        const bins = histogram[ch.key];
        // 채널마다 256개 막대를 합쳐 하나의 영역 path 로 그린다.
        const points = bins
          .map((count, i) => {
            const x = i;
            const y = viewHeight - (count / peak) * viewHeight;
            return `${x},${y.toFixed(2)}`;
          })
          .join(' ');
        return (
          <polyline
            key={ch.key}
            points={points}
            fill="none"
            stroke={ch.color}
            strokeWidth={0.8}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}
