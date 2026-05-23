'use client';

import { useEffect, useState } from 'react';
import { Loader2, Images, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';

type Layout = '2x2' | '3x3' | '4x4' | '1x2' | '2x1' | '3x2';

const LAYOUTS: Record<Layout, { cols: number; rows: number }> = {
  '1x2': { cols: 1, rows: 2 },
  '2x1': { cols: 2, rows: 1 },
  '2x2': { cols: 2, rows: 2 },
  '3x2': { cols: 3, rows: 2 },
  '3x3': { cols: 3, rows: 3 },
  '4x4': { cols: 4, rows: 4 },
};

export default function CollagePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [layout, setLayout] = useState<Layout>('2x2');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [gap, setGap] = useState(10);
  const [padding, setPadding] = useState(20);
  const [cellW, setCellW] = useState(500);
  const [cellH, setCellH] = useState(500);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, layout, bgColor, gap, padding, cellW, cellH]);

  async function render() {
    const { cols, rows } = LAYOUTS[layout];
    const total = cols * rows;
    if (files.length === 0) {
      setPreviewUrl('');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const totalW = padding * 2 + cellW * cols + gap * (cols - 1);
      const totalH = padding * 2 + cellH * rows + gap * (rows - 1);
      const canvas = document.createElement('canvas');
      canvas.width = totalW;
      canvas.height = totalH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas ctx');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, totalW, totalH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const imgs = await Promise.all(files.slice(0, total).map(loadImage));
      for (let i = 0; i < imgs.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * (cellW + gap);
        const y = padding + row * (cellH + gap);
        drawContain(ctx, imgs[i], x, y, cellW, cellH);
      }

      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('인코딩 실패'))), 'image/jpeg', 0.92));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      imgs.forEach((img) => img.src.startsWith('blob:') && URL.revokeObjectURL(img.src));
    } catch (e) {
      setError(e instanceof Error ? e.message : '렌더링 실패');
    } finally {
      setBusy(false);
    }
  }

  const total = LAYOUTS[layout].cols * LAYOUTS[layout].rows;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          <h1 className="text-xl font-semibold">이미지 콜라주</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          여러 이미지를 격자로 합쳐 한 장의 JPG 로 만듭니다. {total} 장 필요.
        </p>
      </header>

      <FileDropZone
        accept="image/*"
        multiple
        onFiles={(arr) => setFiles((prev) => [...prev, ...arr])}
        title="이미지 여러 장 드롭"
      />

      {files.length > 0 && (
        <p className="text-xs text-muted-foreground">{files.length}장 선택됨 (그리드: {total}장 필요). <button onClick={() => setFiles([])} className="underline">모두 제거</button></p>
      )}

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium">레이아웃</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LAYOUTS) as Layout[]).map((k) => (
              <Button key={k} variant={layout === k ? 'default' : 'outline'} size="sm" onClick={() => setLayout(k)}>{k}</Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">셀 너비</label>
            <input type="number" min={100} max={2000} value={cellW} onChange={(e) => setCellW(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">셀 높이</label>
            <input type="number" min={100} max={2000} value={cellH} onChange={(e) => setCellH(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">여백 (외곽)</label>
            <input type="number" min={0} max={200} value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">간격 (셀 사이)</label>
            <input type="number" min={0} max={100} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">배경색</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-12 rounded border" />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {busy && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> 합성 중…
        </p>
      )}

      {previewUrl && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="콜라주 미리보기" className="rounded-md border bg-card max-w-full" />
          <a
            href={previewUrl}
            download={`collage-${Date.now()}.jpg`}
            className={buttonVariants({ variant: 'default', className: 'w-full' })}
          >
            <Download className="h-4 w-4" />
            JPG 다운로드
          </a>
        </div>
      )}
    </main>
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(file);
  });
}

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = img.naturalWidth / img.naturalHeight;
  const cellRatio = w / h;
  let drawW = w;
  let drawH = h;
  if (ratio > cellRatio) {
    drawH = w / ratio;
  } else {
    drawW = h * ratio;
  }
  const dx = x + (w - drawW) / 2;
  const dy = y + (h - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}
