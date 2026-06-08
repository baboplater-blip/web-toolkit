'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, FileImage, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { loadImageFile, type LoadedImage } from '@/lib/tools/image-common';
import { formatBytes } from '@/lib/compress/format';

interface Swatch {
  hex: string;
  rgb: [number, number, number];
  count: number;
  ratio: number;
}

/**
 * 간단한 색상 양자화 (Median Cut 유사 - 분산 기반 분할).
 * 픽셀을 샘플링하여 k개의 주요 색상을 추출.
 */
function extractPalette(
  img: HTMLImageElement,
  k: number = 8,
  maxDim = 200,
): Swatch[] {
  const canvas = document.createElement('canvas');
  const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.max(1, Math.floor(img.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.floor(img.naturalHeight * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트 생성 실패');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 픽셀 배열 (투명/완전 흰색 제외)
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 125) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) return [];

  // Median Cut
  const buckets: [number, number, number][][] = [pixels];
  while (buckets.length < k) {
    // 가장 범위가 큰 버킷 찾기
    let targetIdx = 0;
    let targetRange = -1;
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      if (b.length <= 1) continue;
      const ranges = [0, 1, 2].map((ch) => {
        let min = 255;
        let max = 0;
        for (const p of b) {
          if (p[ch] < min) min = p[ch];
          if (p[ch] > max) max = p[ch];
        }
        return max - min;
      });
      const maxRange = Math.max(...ranges);
      if (maxRange > targetRange) {
        targetRange = maxRange;
        targetIdx = i;
      }
    }
    if (targetRange <= 0) break;

    const bucket = buckets[targetIdx];
    const ranges = [0, 1, 2].map((ch) => {
      let min = 255;
      let max = 0;
      for (const p of bucket) {
        if (p[ch] < min) min = p[ch];
        if (p[ch] > max) max = p[ch];
      }
      return max - min;
    });
    const splitCh = ranges.indexOf(Math.max(...ranges));
    bucket.sort((a, b) => a[splitCh] - b[splitCh]);
    const mid = Math.floor(bucket.length / 2);
    const left = bucket.slice(0, mid);
    const right = bucket.slice(mid);
    buckets.splice(targetIdx, 1, left, right);
  }

  const total = pixels.length;
  const swatches: Swatch[] = buckets
    .filter((b) => b.length > 0)
    .map((b) => {
      let r = 0;
      let g = 0;
      let bl = 0;
      for (const p of b) {
        r += p[0];
        g += p[1];
        bl += p[2];
      }
      const n = b.length;
      const ar = Math.round(r / n);
      const ag = Math.round(g / n);
      const ab = Math.round(bl / n);
      const hex = `#${[ar, ag, ab].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      return {
        hex,
        rgb: [ar, ag, ab] as [number, number, number],
        count: n,
        ratio: n / total,
      };
    })
    .sort((a, b) => b.count - a.count);

  return swatches;
}

export default function PalettePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [k, setK] = useState(8);
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      loaded?.cleanup();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [loaded, previewUrl]);

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setSwatches([]);
    loaded?.cleanup();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setProcessing(true);
    try {
      const info = await loadImageFile(f);
      setFile(f);
      setLoaded(info);
      setPreviewUrl(URL.createObjectURL(f));
      // 바로 추출
      setSwatches(extractPalette(info.element, k));
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리 실패');
    } finally {
      setProcessing(false);
    }
  };

  // k 변경 시 재추출 — 슬라이더를 드래그하면 매 틱마다 동기 재추출되어 끊기므로 200ms 디바운스.
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      setProcessing(true);
      try {
        setSwatches(extractPalette(loaded.element, k));
      } finally {
        setProcessing(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [k, loaded]);

  const reset = () => {
    loaded?.cleanup();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setLoaded(null);
    setPreviewUrl(null);
    setSwatches([]);
    setError(null);
  };

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      /* noop */
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(swatches.map((s) => s.hex).join('\n'));
      setCopiedHex('__all__');
      setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 색상 팔레트" onReset={file ? reset : undefined} />

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {!file && (
          <FileDropZone
            accept="image/*"
            description="이미지에서 주요 색상을 추출합니다"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && loaded && previewUrl && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {loaded.width}×{loaded.height}
                  </p>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">추출할 색상 수</label>
                  <span className="text-xs text-muted-foreground">{k}개</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={16}
                  step={1}
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                  className="w-full accent-primary" aria-label="추출할 색상 수" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  팔레트
                </h2>
                {swatches.length > 0 && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyAll}>
                    {copiedHex === '__all__' ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        전체 복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        전체 복사
                      </>
                    )}
                  </Button>
                )}
              </div>

              {processing && swatches.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                  분석 중...
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {swatches.map((s) => (
                    <button
                      key={s.hex}
                      type="button"
                      onClick={() => copyHex(s.hex)}
                      className="rounded-lg border overflow-hidden hover:border-primary transition-colors text-left"
                    >
                      <div
                        className="h-16 w-full"
                        style={{ backgroundColor: s.hex }}
                      />
                      <div className="p-2">
                        <p className="text-xs font-mono font-semibold flex items-center justify-between">
                          {s.hex.toUpperCase()}
                          {copiedHex === s.hex && (
                            <Check className="h-3 w-3 text-green-500" />
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          rgb({s.rgb[0]}, {s.rgb[1]}, {s.rgb[2]})
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(s.ratio * 100).toFixed(1)}%
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground text-center">
                팔레트 박스를 눌러 HEX 값을 복사
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
