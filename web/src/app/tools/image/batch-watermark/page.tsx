'use client';

import { useState } from 'react';
import { Loader2, Stamp } from 'lucide-react';
import JSZip from 'jszip';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export default function BatchWatermarkPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState('© 2026');
  const [position, setPosition] = useState<Position>('bottom-right');
  const [opacity, setOpacity] = useState(0.6);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ffffff');
  const [shadow, setShadow] = useState(true);
  const [margin, setMargin] = useState(20);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  async function handleProcess() {
    if (files.length === 0) {
      setError('이미지를 1장 이상 선택해주세요.');
      return;
    }
    if (!text.trim()) {
      setError('워터마크 텍스트를 입력해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    setProgress(0);
    try {
      const zip = new JSZip();
      let totalOriginal = 0;

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        totalOriginal += f.size;
        const img = await loadImage(f);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.drawImage(img, 0, 0);

          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          if (shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
          }
          const metrics = ctx.measureText(text);
          const tw = metrics.width;
          const th = fontSize;
          let x = margin;
          let y = canvas.height - margin;
          if (position === 'top-left') { x = margin; y = margin + th; }
          else if (position === 'top-right') { x = canvas.width - tw - margin; y = margin + th; }
          else if (position === 'bottom-right') { x = canvas.width - tw - margin; y = canvas.height - margin; }
          else if (position === 'center') { x = (canvas.width - tw) / 2; y = (canvas.height + th) / 2; }
          ctx.fillText(text, x, y);

          const isJpg = /\.(jpe?g)$/i.test(f.name);
          const mime = isJpg ? 'image/jpeg' : 'image/png';
          const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('인코딩 실패'))), mime, isJpg ? 0.92 : undefined));
          zip.file(f.name, new Uint8Array(await blob.arrayBuffer()));
        } finally {
          URL.revokeObjectURL(img.src);
        }
        setProgress(Math.round(((i + 1) / files.length) * 95));
      }

      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `watermarked-${Date.now()}.zip`,
        originalSize: totalOriginal,
        compressedSize: blob.size,
      });
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Stamp className="h-5 w-5" />
          <h1 className="text-xl font-semibold">이미지 일괄 워터마크</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          여러 이미지에 동일한 텍스트 워터마크를 한꺼번에 적용해 ZIP 으로 저장합니다.
        </p>
      </header>

      <FileDropZone accept="image/*" multiple onFiles={(arr) => setFiles((prev) => [...prev, ...arr])} title="이미지 여러 장 드롭" />
      {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length}장 선택됨. <button onClick={() => setFiles([])} className="underline">모두 제거</button></p>}

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">워터마크 텍스트</label>
          <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" aria-label="워터마크 텍스트" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium">위치</p>
          <div className="flex flex-wrap gap-2">
            {(['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'] as Position[]).map((p) => (
              <Button key={p} variant={position === p ? 'default' : 'outline'} size="sm" onClick={() => setPosition(p)}>{p}</Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">글자 크기</label>
            <input type="number" min={12} max={400} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="글자 크기" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">색상</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-full rounded border" aria-label="색상" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">여백</label>
            <input type="number" min={0} max={200} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="여백" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">불투명도 ({Math.round(opacity * 100)}%)</label>
          <input type="range" min={10} max={100} value={Math.round(opacity * 100)} onChange={(e) => setOpacity(Number(e.target.value) / 100)} className="w-full" aria-label="불투명도 ( %)" />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" className="h-4 w-4" checked={shadow} onChange={(e) => setShadow(e.target.checked)} />
          그림자 효과
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || files.length === 0}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {files.length} 장 일괄 처리
        </Button>
        {busy && <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
      </div>

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {result && <ResultCard fileName={result.filename} blobUrl={result.blobUrl} originalSize={result.originalSize} compressedSize={result.compressedSize} />}
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
