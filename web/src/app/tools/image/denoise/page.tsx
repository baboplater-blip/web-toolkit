'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';

export default function DenoisePage() {
  const [file, setFile] = useState<File | null>(null);
  const [strength, setStrength] = useState(2);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (file) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, strength]);

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
      const src = ctx.getImageData(0, 0, w, h);
      const dst = ctx.createImageData(w, h);

      // 단순 미디언 필터 (3×3 또는 5×5)
      const ks = strength <= 1 ? 1 : strength <= 3 ? 1 : 2; // half-window
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          for (let c = 0; c < 3; c++) {
            const vals: number[] = [];
            for (let dy = -ks; dy <= ks; dy++) {
              for (let dx = -ks; dx <= ks; dx++) {
                const xx = Math.max(0, Math.min(w - 1, x + dx));
                const yy = Math.max(0, Math.min(h - 1, y + dy));
                vals.push(src.data[(yy * w + xx) * 4 + c]);
              }
            }
            vals.sort((a, b) => a - b);
            const med = vals[Math.floor(vals.length / 2)];
            // strength 에 따라 원본과 mix
            const orig = src.data[(y * w + x) * 4 + c];
            const mix = strength / 5;
            dst.data[(y * w + x) * 4 + c] = Math.round(orig * (1 - mix) + med * mix);
          }
          dst.data[(y * w + x) * 4 + 3] = 255;
        }
      }
      ctx.putImageData(dst, 0, 0);
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.95));
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
          <Sparkles className="h-5 w-5" />
          <h1 className="text-xl font-semibold">이미지 노이즈 제거</h1>
        </div>
        <p className="text-sm text-muted-foreground">미디언 필터로 노이즈를 줄입니다. 작은 사진 권장.</p>
      </header>

      <FileDropZone accept="image/*" onFiles={(f) => setFile(f[0] ?? null)} title="이미지 1장 드롭" />

      {file && (
        <div className="rounded-xl border bg-card p-3 space-y-1">
          <label className="text-xs font-medium">강도 ({strength}/5)</label>
          <input type="range" min={1} max={5} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-full" />
          <p className="text-[10px] text-muted-foreground">강도가 높을수록 디테일이 흐려집니다.</p>
        </div>
      )}

      {busy && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> 처리 중… (큰 이미지는 시간이 걸립니다)</p>}

      {previewUrl && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="미리보기" className="rounded-md border bg-card w-full" />
          <a href={previewUrl} download={`denoised-${Date.now()}.jpg`} className={buttonVariants({ variant: 'default', className: 'w-full' })}>
            <Download className="h-4 w-4" /> JPG 다운로드
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
