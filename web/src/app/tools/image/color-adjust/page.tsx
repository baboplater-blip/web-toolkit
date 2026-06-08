'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sliders, Download, RotateCcw } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface Adjust {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  grayscale: number;
  sepia: number;
  invert: number;
}

const DEFAULT: Adjust = { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0 };

// 재처리 디바운스(ms): 연속 슬라이더 조작 시 마지막 값만 처리(대용량 이미지 프리징 방지).
const RENDER_DEBOUNCE_MS = 250;

export default function ColorAdjustPage() {
  const [file, setFile] = useState<File | null>(null);
  const [adj, setAdj] = useState<Adjust>(DEFAULT);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, adj]);

  async function render() {
    if (!file) return;
    setBusy(true);
    setError(null);
    // load 를 try 안으로 옮겨 손상된 이미지의 디코드 실패 시에도 busy 가 풀리도록 한다.
    let img: HTMLImageElement | null = null;
    try {
      img = await load(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) hue-rotate(${adj.hue}deg) blur(${adj.blur}px) grayscale(${adj.grayscale}%) sepia(${adj.sepia}%) invert(${adj.invert}%)`;
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.92));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지를 처리할 수 없습니다.');
    } finally {
      if (img) URL.revokeObjectURL(img.src);
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setAdj(DEFAULT);
    setError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 색 보정" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">밝기·대비·채도·색조·블러·그레이·세피아·반전 — 실시간 미리보기.</p>

      <FileDropZone accept="image/*" onFiles={(f) => setFile(f[0] ?? null)} title="이미지 1장 드롭" />

      {file && (
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <SliderRow label={`밝기 ${adj.brightness}%`} value={adj.brightness} min={0} max={200} onChange={(v) => setAdj({ ...adj, brightness: v })} />
          <SliderRow label={`대비 ${adj.contrast}%`} value={adj.contrast} min={0} max={200} onChange={(v) => setAdj({ ...adj, contrast: v })} />
          <SliderRow label={`채도 ${adj.saturation}%`} value={adj.saturation} min={0} max={300} onChange={(v) => setAdj({ ...adj, saturation: v })} />
          <SliderRow label={`색조 ${adj.hue}°`} value={adj.hue} min={0} max={360} onChange={(v) => setAdj({ ...adj, hue: v })} />
          <SliderRow label={`블러 ${adj.blur}px`} value={adj.blur} min={0} max={30} onChange={(v) => setAdj({ ...adj, blur: v })} />
          <SliderRow label={`흑백 ${adj.grayscale}%`} value={adj.grayscale} min={0} max={100} onChange={(v) => setAdj({ ...adj, grayscale: v })} />
          <SliderRow label={`세피아 ${adj.sepia}%`} value={adj.sepia} min={0} max={100} onChange={(v) => setAdj({ ...adj, sepia: v })} />
          <SliderRow label={`반전 ${adj.invert}%`} value={adj.invert} min={0} max={100} onChange={(v) => setAdj({ ...adj, invert: v })} />
          <Button variant="outline" size="sm" onClick={() => setAdj(DEFAULT)}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> 초기화
          </Button>
        </div>
      )}

      {busy && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> 처리 중…</p>}

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {previewUrl && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="미리보기" className="rounded-md border bg-card w-full" />
          <a href={previewUrl} download={`adjusted-${Date.now()}.jpg`} className={buttonVariants({ variant: 'default', className: 'w-full' })}>
            <Download className="h-4 w-4" /> JPG 다운로드
          </a>
        </div>
      )}
      </main>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-0.5">
      <label className="text-xs font-medium">{label}</label>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} className="w-full" />
    </div>
  );
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => res(img);
    img.onerror = () => {
      // 디코드 실패 시 ObjectURL 이 새지 않도록 해제(성공 시엔 호출부 finally 가 해제).
      URL.revokeObjectURL(url);
      rej(new Error('로드 실패'));
    };
    img.src = url;
  });
}
