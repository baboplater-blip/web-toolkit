'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldOff } from 'lucide-react';
import JSZip from 'jszip';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

export default function ExifBatchPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ processed: number; bytesBefore: number; bytesAfter: number } | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  // 언마운트/교체 시 마지막 결과 blob URL 해제(누수 방지).
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result]);

  async function handleProcess() {
    if (files.length === 0) {
      setError('이미지를 1장 이상 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    setStats(null);
    setProgress(0);

    try {
      const piexif = (await import('piexifjs')) as unknown as {
        remove: (jpeg: string) => string;
      };

      const zip = new JSZip();
      let processed = 0;
      let bytesBefore = 0;
      let bytesAfter = 0;

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        bytesBefore += f.size;
        const isJpg = /\.(jpe?g)$/i.test(f.name) || f.type === 'image/jpeg';
        if (!isJpg) {
          // JPG 외 포맷은 캔버스 재인코딩 (EXIF 자동 손실)
          const img = await load(f);
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d')!.drawImage(img, 0, 0);
          const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.92));
          URL.revokeObjectURL(img.src);
          const u8 = new Uint8Array(await blob.arrayBuffer());
          bytesAfter += u8.byteLength;
          zip.file(f.name.replace(/\.[^.]+$/, '.jpg'), u8);
        } else {
          const dataUrl = await fileToDataUrl(f);
          const stripped = piexif.remove(dataUrl);
          const blob = dataUrlToBlob(stripped);
          const u8 = new Uint8Array(await blob.arrayBuffer());
          bytesAfter += u8.byteLength;
          zip.file(f.name, u8);
        }
        processed++;
        setProgress(Math.round(((i + 1) / files.length) * 95));
      }

      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `exif-stripped-${Date.now()}.zip`,
        originalSize: bytesBefore,
        compressedSize: blob.size,
      });
      setStats({ processed, bytesBefore, bytesAfter });
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
          <ShieldOff className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EXIF 일괄 제거</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          여러 사진의 GPS·촬영 정보·카메라 정보를 한꺼번에 제거합니다.
        </p>
      </header>

      <FileDropZone accept="image/*" multiple onFiles={(arr) => setFiles((prev) => [...prev, ...arr])} title="이미지 여러 장 드롭" />
      {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length}장 선택됨. <button onClick={() => setFiles([])} className="underline">모두 제거</button></p>}

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || files.length === 0}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          EXIF 일괄 제거
        </Button>
        {busy && <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
      </div>

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {stats && (
        <div className="rounded-xl border bg-card p-3 text-xs">
          {stats.processed} 장 처리 · {(stats.bytesBefore / 1024).toFixed(0)} KB → {(stats.bytesAfter / 1024).toFixed(0)} KB
        </div>
      )}

      {result && <ResultCard fileName={result.filename} blobUrl={result.blobUrl} originalSize={result.originalSize} compressedSize={result.compressedSize} extraInfo="JPG 는 EXIF 제거, 그 외는 JPG 재인코딩 (EXIF 자동 손실)" />}
    </main>
  );
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => res(img);
    img.onerror = () => {
      // 디코드 실패 시 ObjectURL 이 새지 않도록 해제(성공 시엔 호출부가 해제).
      URL.revokeObjectURL(url);
      rej(new Error('로드 실패'));
    };
    img.src = url;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error ?? new Error('FileReader 실패'));
    r.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}
