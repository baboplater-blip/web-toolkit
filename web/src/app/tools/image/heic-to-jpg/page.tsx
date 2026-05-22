'use client';

import { useState } from 'react';
import { Loader2, FileImage } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

type OutputFormat = 'jpeg' | 'png';

export default function HeicToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(0.9);
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
      setError('HEIC 파일을 선택해주세요.');
      return;
    }
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const heic2anyMod = await import('heic2any');
      const heic2any = heic2anyMod.default;
      const out = await heic2any({
        blob: file,
        toType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality: format === 'jpeg' ? quality : undefined,
      });
      const blob = Array.isArray(out) ? out[0] : out;
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const baseName = file.name.replace(/\.(heic|heif)$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.${ext}`,
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
          <h1 className="text-xl font-semibold">HEIC → JPG / PNG</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          iPhone 의 HEIC 사진을 JPG 또는 PNG 로 변환합니다.
        </p>
      </header>

      <FileDropZone
        accept=".heic,.heif,image/heic,image/heif"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="HEIC 파일을 끌어다 놓거나 클릭하여 선택"
        hint="iPhone 사진 (.heic / .heif)"
      />

      {file && (
        <p className="text-xs text-muted-foreground">
          선택됨: <span className="font-medium text-foreground">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium w-16">포맷</label>
          <div className="flex gap-1">
            {(['jpeg', 'png'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`h-8 rounded-md border px-3 text-xs ${
                  format === f
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {format === 'jpeg' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium w-16">품질</label>
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {Math.round(quality * 100)}%
            </span>
          </div>
        )}
      </div>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        변환하기
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
