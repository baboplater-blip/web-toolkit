'use client';

import { useState } from 'react';
import { Loader2, FileImage } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

export default function SvgToPngPage() {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(2);
  const [bg, setBg] = useState<'transparent' | 'white'>('transparent');
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('SVG 파일을 선택해주세요.');
      return;
    }
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const svgText = await file.text();
      const svgUrl = URL.createObjectURL(
        new Blob([svgText], { type: 'image/svg+xml' }),
      );

      const img = new Image();
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('SVG 파싱 실패'));
        img.src = svgUrl;
      });
      await loaded;

      // SVG 의 자연 크기 (viewBox 기반)
      const w = (img.naturalWidth || 512) * scale;
      const h = (img.naturalHeight || 512) * scale;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      if (bg === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(svgUrl);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 인코딩 실패'))), 'image/png'),
      );

      const baseName = file.name.replace(/\.svg$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.png`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          <h1 className="text-xl font-semibold">SVG → PNG</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          벡터 SVG 를 원하는 해상도의 PNG 로 래스터화합니다.
        </p>
      </header>

      <FileDropZone
        accept=".svg,image/svg+xml"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="SVG 파일을 끌어다 놓거나 클릭하여 선택"
        hint="단일 SVG 파일"
      />

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium w-20">스케일</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                className={`h-8 rounded-md border px-3 text-xs ${
                  scale === s
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium w-20">배경</label>
          <div className="flex gap-1">
            {(['transparent', 'white'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBg(b)}
                className={`h-8 rounded-md border px-3 text-xs ${
                  bg === b
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {b === 'transparent' ? '투명' : '흰색'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        PNG 로 변환
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
        />
      )}
    </main>
  );
}
