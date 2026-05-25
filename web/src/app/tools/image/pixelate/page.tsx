'use client';

import { useEffect, useState } from 'react';
import { Loader2, Grid3X3, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';

type Mode = 'full' | 'region';

export default function PixelatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState(20);
  const [mode, setMode] = useState<Mode>('full');
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  // 영역 선택 (퍼센트 좌표)
  const [region, setRegion] = useState({ x: 25, y: 25, w: 50, h: 50 });

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (file) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, size, mode, region]);

  async function render() {
    if (!file) return;
    setBusy(true);
    const img = await load(file);
    try {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      if (mode === 'full') {
        applyPixelate(canvas, 0, 0, w, h, size);
      } else {
        const rx = Math.round((region.x / 100) * w);
        const ry = Math.round((region.y / 100) * h);
        const rw = Math.round((region.w / 100) * w);
        const rh = Math.round((region.h / 100) * h);
        applyPixelate(canvas, rx, ry, rw, rh, size);
      }

      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } finally {
      URL.revokeObjectURL(img.src);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          <h1 className="text-xl font-semibold">이미지 모자이크/픽셀화</h1>
        </div>
        <p className="text-sm text-muted-foreground">전체 또는 특정 영역만 모자이크 처리합니다.</p>
      </header>

      <FileDropZone accept="image/*" onFiles={(f) => setFile(f[0] ?? null)} title="이미지 1장 드롭" />

      {file && (
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button variant={mode === 'full' ? 'default' : 'outline'} size="sm" onClick={() => setMode('full')}>전체</Button>
            <Button variant={mode === 'region' ? 'default' : 'outline'} size="sm" onClick={() => setMode('region')}>영역</Button>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">픽셀 크기 ({size}px)</label>
            <input type="range" min={4} max={80} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" aria-label="픽셀 크기 ( px)" />
          </div>
          {mode === 'region' && (
            <div className="grid grid-cols-4 gap-2">
              <RangeBox label="x %" v={region.x} onChange={(v) => setRegion({ ...region, x: v })} />
              <RangeBox label="y %" v={region.y} onChange={(v) => setRegion({ ...region, y: v })} />
              <RangeBox label="너비 %" v={region.w} onChange={(v) => setRegion({ ...region, w: v })} />
              <RangeBox label="높이 %" v={region.h} onChange={(v) => setRegion({ ...region, h: v })} />
            </div>
          )}
        </div>
      )}

      {busy && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> 처리 중…</p>}

      {previewUrl && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="미리보기" className="rounded-md border bg-card w-full" />
          <a href={previewUrl} download={`pixelated-${Date.now()}.png`} className={buttonVariants({ variant: 'default', className: 'w-full' })}>
            <Download className="h-4 w-4" /> PNG 다운로드
          </a>
        </div>
      )}
    </main>
  );
}

function RangeBox({ label, v, onChange }: { label: string; v: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input type="number" min={0} max={100} value={v} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
    </div>
  );
}

function applyPixelate(canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number, blockSize: number) {
  const ctx = canvas.getContext('2d')!;
  const region = ctx.getImageData(x, y, w, h);
  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      let r = 0, g = 0, b = 0, c = 0;
      for (let yy = 0; yy < blockSize; yy++) {
        for (let xx = 0; xx < blockSize; xx++) {
          const px = bx + xx;
          const py = by + yy;
          if (px >= w || py >= h) continue;
          const idx = (py * w + px) * 4;
          r += region.data[idx];
          g += region.data[idx + 1];
          b += region.data[idx + 2];
          c++;
        }
      }
      if (c === 0) continue;
      r = Math.round(r / c);
      g = Math.round(g / c);
      b = Math.round(b / c);
      for (let yy = 0; yy < blockSize; yy++) {
        for (let xx = 0; xx < blockSize; xx++) {
          const px = bx + xx;
          const py = by + yy;
          if (px >= w || py >= h) continue;
          const idx = (py * w + px) * 4;
          region.data[idx] = r;
          region.data[idx + 1] = g;
          region.data[idx + 2] = b;
        }
      }
    }
  }
  ctx.putImageData(region, x, y);
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('로드 실패'));
    img.src = URL.createObjectURL(file);
  });
}
