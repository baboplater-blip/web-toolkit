'use client';

import { useRef, useState } from 'react';
import { Loader2, Images, X } from 'lucide-react';
import JSZip from 'jszip';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { openPdfDoc } from '@/lib/tools/pdf-text';

type Format = 'png' | 'jpeg';

export default function PdfPreviewsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1.5);
  const [format, setFormat] = useState<Format>('png');
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Array<{ url: string; page: number }>>([]);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const abortRef = useRef<{ aborted: boolean } | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('PDF 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    setThumbs([]);
    setProgress(0);
    const token = { aborted: false };
    abortRef.current = token;

    try {
      const pdf = await openPdfDoc(file);
      const zip = new JSZip();
      const local: Array<{ url: string; page: number }> = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        if (token.aborted) break;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas ctx 실패');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        page.cleanup();

        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('인코딩 실패'))), `image/${format}`, format === 'jpeg' ? quality : undefined);
        });
        const u8 = new Uint8Array(await blob.arrayBuffer());
        const fname = `page-${String(i).padStart(3, '0')}.${format === 'jpeg' ? 'jpg' : 'png'}`;
        zip.file(fname, u8);

        const url = URL.createObjectURL(blob);
        local.push({ url, page: i });
        if (local.length <= 30) setThumbs([...local]);
        setProgress(Math.round((i / pdf.numPages) * 95));
      }
      pdf.destroy();

      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-pages.zip`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          <h1 className="text-xl font-semibold">PDF 페이지 미리보기 PNG</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          모든 페이지를 PNG/JPG 이미지로 렌더해 ZIP 으로 저장합니다. (블로그 썸네일·SNS 공유용)
        </p>
      </header>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="rounded-xl border bg-card p-3 grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">배율</label>
          <select value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
            <option value={1.0}>1.0× 표준</option>
            <option value={1.5}>1.5× 권장</option>
            <option value={2.0}>2.0× 고품질</option>
            <option value={3.0}>3.0× 인쇄</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">포맷</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as Format)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
            <option value="png">PNG (무손실)</option>
            <option value="jpeg">JPEG (작은 용량)</option>
          </select>
        </div>
        {format === 'jpeg' && (
          <div className="space-y-1">
            <label className="text-xs font-medium">품질</label>
            <input type="range" min={50} max={100} value={Math.round(quality * 100)} onChange={(e) => setQuality(Number(e.target.value) / 100)} className="w-full" aria-label="품질" />
            <p className="text-[10px] text-muted-foreground text-center">{Math.round(quality * 100)}%</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          전체 렌더 + ZIP
        </Button>
        {busy && (
          <>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="취소">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {thumbs.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {thumbs.map((t) => (
            <div key={t.page} className="rounded-md border bg-card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.url} alt={`page ${t.page}`} className="block w-full" />
              <p className="text-[10px] text-center text-muted-foreground p-1">p.{t.page}</p>
            </div>
          ))}
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
