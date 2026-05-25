'use client';

import { useEffect, useState } from 'react';
import { Loader2, Diff, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';

export default function ImageDiffPage() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(15);
  const [result, setResult] = useState<{ url: string; diffPercent: number; w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (result?.url) URL.revokeObjectURL(result.url); };
  }, [result?.url]);

  useEffect(() => {
    if (a && b) compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, threshold]);

  async function compute() {
    if (!a || !b) return;
    setBusy(true);
    setError(null);
    try {
      const [imgA, imgB] = await Promise.all([load(a), load(b)]);
      const w = Math.max(imgA.naturalWidth, imgB.naturalWidth);
      const h = Math.max(imgA.naturalHeight, imgB.naturalHeight);

      const cA = renderTo(imgA, w, h);
      const cB = renderTo(imgB, w, h);
      const ctxA = cA.getContext('2d')!;
      const ctxB = cB.getContext('2d')!;
      const dataA = ctxA.getImageData(0, 0, w, h);
      const dataB = ctxB.getImageData(0, 0, w, h);

      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d')!;
      const outImg = ctx.createImageData(w, h);

      let diff = 0;
      const total = w * h;
      for (let i = 0; i < total; i++) {
        const o = i * 4;
        const r1 = dataA.data[o], g1 = dataA.data[o + 1], b1 = dataA.data[o + 2];
        const r2 = dataB.data[o], g2 = dataB.data[o + 1], b2 = dataB.data[o + 2];
        const delta = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / 3;
        if (delta > threshold) {
          outImg.data[o] = 255;
          outImg.data[o + 1] = 50;
          outImg.data[o + 2] = 50;
          outImg.data[o + 3] = 255;
          diff++;
        } else {
          const lum = (r1 + g1 + b1) / 3 * 0.4 + 153;
          outImg.data[o] = lum;
          outImg.data[o + 1] = lum;
          outImg.data[o + 2] = lum;
          outImg.data[o + 3] = 255;
        }
      }
      ctx.putImageData(outImg, 0, 0);
      const blob = await new Promise<Blob>((res) => out.toBlob((b) => res(b!), 'image/png'));
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ url: URL.createObjectURL(blob), diffPercent: (diff / total) * 100, w, h });
      URL.revokeObjectURL(imgA.src);
      URL.revokeObjectURL(imgB.src);
    } catch (e) {
      setError(e instanceof Error ? e.message : '비교 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Diff className="h-5 w-5" />
          <h1 className="text-xl font-semibold">이미지 시각 비교</h1>
        </div>
        <p className="text-sm text-muted-foreground">두 이미지를 픽셀 단위로 비교해 차이를 빨강으로 표시.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold">이미지 A</p>
          <FileDropZone accept="image/*" onFiles={(f) => setA(f[0] ?? null)} title="A" />
          {a && <p className="text-xs text-muted-foreground truncate">{a.name}</p>}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">이미지 B</p>
          <FileDropZone accept="image/*" onFiles={(f) => setB(f[0] ?? null)} title="B" />
          {b && <p className="text-xs text-muted-foreground truncate">{b.name}</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 space-y-1">
        <label className="text-xs font-medium">민감도 (threshold = {threshold})</label>
        <input type="range" min={0} max={80} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" aria-label="민감도 (threshold = )" />
        <p className="text-[10px] text-muted-foreground">낮음=민감 ↔ 높음=둔감</p>
      </div>

      {busy && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> 비교 중…</p>}
      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {result && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">차이 {result.diffPercent.toFixed(2)}% · {result.w} × {result.h}px</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="diff" className="block w-full rounded-md border bg-card" />
          <a href={result.url} download={`diff-${Date.now()}.png`} className={buttonVariants({ variant: 'default', className: 'w-full' })}>
            <Download className="h-4 w-4" /> 비교 결과 PNG 다운로드
          </a>
        </div>
      )}
    </main>
  );
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('로드 실패'));
    img.src = URL.createObjectURL(file);
  });
}

function renderTo(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
  return c;
}
