'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';

// 미리보기 재처리 디바운스(ms): 연속 슬라이더 조작 시 마지막 값만 처리.
const RENDER_DEBOUNCE_MS = 250;
// 이 픽셀 수를 넘으면 메인스레드 프리징 경고(폭×높이).
const LARGE_IMAGE_PIXELS = 2400 * 2400;

export default function DenoisePage() {
  const [file, setFile] = useState<File | null>(null);
  const [strength, setStrength] = useState(2);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [largeWarning, setLargeWarning] = useState(false);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, strength]);

  async function render() {
    if (!file) return;
    setBusy(true);
    setError(null);
    let img: HTMLImageElement;
    try {
      img = await load(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 로드 실패');
      setBusy(false);
      return;
    }
    try {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setLargeWarning(w * h > LARGE_IMAGE_PIXELS);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
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
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('이미지 인코딩 실패'))), 'image/jpeg', 0.95));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '노이즈 제거 처리 실패');
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
          <input type="range" min={1} max={5} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-full" aria-label="강도 ( /5)" />
          <p className="text-[10px] text-muted-foreground">강도가 높을수록 디테일이 흐려집니다.</p>
        </div>
      )}

      {largeWarning && !busy && (
        <p className="text-[11px] text-amber-600 dark:text-amber-500">큰 이미지입니다. 처리 중 잠시 화면이 멈출 수 있습니다.</p>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
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
