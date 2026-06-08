'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { extOf, fmtBytes, parseEpub, resolveHref } from '@/lib/tools/epub-common';

export default function EpubImagesExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ count: number; totalBytes: number } | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  // 언마운트·결과 교체 시 이전 ObjectURL 해제(메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result?.blobUrl]);

  async function handleProcess() {
    if (!file) {
      setError('EPUB 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    // 이전 결과 URL 을 먼저 해제한 뒤 새로 만든다(재실행 누수 방지)
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setResult(null);
    setSummary(null);
    try {
      const epub = await parseEpub(file);
      const zip = new JSZip();
      let count = 0;
      let totalBytes = 0;

      for (const item of epub.manifest.values()) {
        if (!item.mediaType.startsWith('image/')) continue;
        const fullPath = resolveHref(epub.opfDir, item.href);
        const f = epub.zip.file(fullPath);
        if (!f) continue;
        const u8 = await f.async('uint8array');
        totalBytes += u8.byteLength;
        const ext = extOf(item.href) || (item.mediaType.split('/').pop() ?? 'bin');
        const baseName = (item.href.split('/').pop() || item.id).replace(/\.[^.]*$/, '');
        const safe = baseName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
        const fname = `${String(count + 1).padStart(3, '0')}-${safe}.${ext}`;
        zip.file(fname, u8);
        count++;
      }

      if (count === 0) {
        setError('이 EPUB 안에서 이미지를 찾지 못했습니다.');
        return;
      }

      const baseName = file.name.replace(/\.epub$/i, '');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-images.zip`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
      setSummary({ count, totalBytes });
    } catch (e) {
      setError(e instanceof Error ? e.message : '추출에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EPUB 이미지 일괄 추출" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          EPUB 안의 모든 이미지(표지·삽화 포함) 를 ZIP 으로 추출합니다.
        </p>

      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        이미지 추출
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {summary && (
        <div className="rounded-lg border bg-card p-3 text-sm">
          이미지 <span className="font-semibold">{summary.count}</span> 장 · 원본 합계{' '}
          <span className="font-semibold">{fmtBytes(summary.totalBytes)}</span>
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
    </div>
  );
}
