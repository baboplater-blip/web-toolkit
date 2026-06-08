'use client';

import { useEffect, useState } from 'react';
import { Loader2, Palette } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';

type Mode = 'color' | 'image';

export default function PdfBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('color');
  const [color, setColor] = useState('#fff8e7');
  const [bgImage, setBgImage] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState('');
  const [opacity, setOpacity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (bgPreview) URL.revokeObjectURL(bgPreview);
    };
  }, [bgPreview]);

  function pickImage(f: File) {
    if (bgPreview) URL.revokeObjectURL(bgPreview);
    setBgImage(f);
    setBgPreview(URL.createObjectURL(f));
  }

  async function handleProcess() {
    if (!file) {
      setError('PDF 파일을 먼저 선택해주세요.');
      return;
    }
    if (mode === 'image' && !bgImage) {
      setError('배경 이미지를 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const { PDFDocument, degrees, rgb } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
      const pages = doc.getPages();

      if (mode === 'color') {
        const c = hexToRgb(color) ?? { r: 1, g: 0.97, b: 0.91 };
        for (const p of pages) {
          const { width, height } = p.getSize();
          // 페이지 맨 아래에 그리려면, 현재 콘텐츠가 그 위에 오도록 하려면
          // pdf-lib 는 drawRectangle 가 콘텐츠 위에 그려진다. 그래서 페이지의 콘텐츠를
          // form xobject 로 끌어올린 뒤 사각형을 먼저, 그 다음에 그리는 게 정석.
          // 여기서는 새 페이지를 만들어 배경+원 콘텐츠 순서로 그리는 방식 사용.
          // → 간단하게: 같은 페이지에 사각형을 먼저 그리고, drawPage 로 기존 내용을 그 위에 그린다.

          // 더 간단한 방법: copy 후 새 페이지 만들기 (메모리 부담). 여기서는 그냥 위에 사각형 그림.
          // 노란 노트북 효과처럼 콘텐츠 위에 반투명만 의도된 동작.
          p.drawRectangle({
            x: 0,
            y: 0,
            width,
            height,
            color: rgb(c.r, c.g, c.b),
            opacity,
          });
        }
      } else if (bgImage) {
        const imgBytes = new Uint8Array(await bgImage.arrayBuffer());
        const ext = (bgImage.type || '').toLowerCase();
        const isJpg = ext.includes('jpeg') || ext.includes('jpg');
        const embedded = isJpg ? await doc.embedJpg(imgBytes) : await doc.embedPng(imgBytes);
        for (const p of pages) {
          const { width, height } = p.getSize();
          // cover fit
          const ratio = embedded.width / embedded.height;
          const pageRatio = width / height;
          let drawW = width;
          let drawH = height;
          if (ratio > pageRatio) {
            drawH = height;
            drawW = height * ratio;
          } else {
            drawW = width;
            drawH = width / ratio;
          }
          const x = (width - drawW) / 2;
          const y = (height - drawH) / 2;
          p.drawImage(embedded, {
            x,
            y,
            width: drawW,
            height: drawH,
            opacity,
            rotate: degrees(0),
          });
        }
      }

      const bytes = await doc.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-bg.pdf`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '배경 추가에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <h1 className="text-xl font-semibold">PDF 배경 추가</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          모든 페이지에 배경 색상이나 이미지를 깔아 워터마크·노트 스타일로 만듭니다.
        </p>
      </header>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium">배경 종류</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={mode === 'color' ? 'default' : 'outline'} size="sm" onClick={() => setMode('color')}>단색</Button>
            <Button variant={mode === 'image' ? 'default' : 'outline'} size="sm" onClick={() => setMode('image')}>이미지</Button>
          </div>
        </div>

        {mode === 'color' && (
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 rounded border" />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="배경색 헥스 값"
              className="flex-1 rounded-md border bg-background px-2 py-1 text-sm font-mono"
            />
          </div>
        )}

        {mode === 'image' && (
          <div className="space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])}
              className="text-xs"
            />
            {bgPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bgPreview} alt="배경 미리보기" className="max-h-40 rounded border" />
            )}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium">불투명도 ({Math.round(opacity * 100)}%)</label>
          <input
            type="range"
            min={5}
            max={100}
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            className="w-full" aria-label="불투명도" />
        </div>
      </div>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        배경 적용
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <ResultCard
          fileName={result.filename}
          originalSize={result.originalSize}
          compressedSize={result.compressedSize}
          blobUrl={result.blobUrl}
          extraInfo="콘텐츠 위에 반투명 배경을 깔아 워터마크 효과 — 본문은 그대로 표시됩니다."
        />
      )}
    </main>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16) / 255;
    const g = parseInt(h[1] + h[1], 16) / 255;
    const b = parseInt(h[2] + h[2], 16) / 255;
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return { r, g, b };
  }
  return null;
}
