'use client';

import { useRef, useState } from 'react';
import { Loader2, FileText, Copy, Check, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { extractMarkdown, openPdfDoc } from '@/lib/tools/pdf-text';

export default function PdfToMdPage() {
  const [file, setFile] = useState<File | null>(null);
  const [md, setMd] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    setMd('');
    setResult(null);
    setProgress(0);
    const token = { aborted: false };
    abortRef.current = token;

    try {
      const pdf = await openPdfDoc(file);
      const text = await extractMarkdown(pdf, {
        signal: token,
        onProgress: (p) => setProgress(Math.round(p * 100)),
      });
      pdf.destroy();
      setMd(text);
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.md`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-xl font-semibold">PDF → Markdown</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          폰트 크기로 헤딩을 추정해 # / ## / ### 구조로 변환합니다.
        </p>
      </header>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Markdown 으로 변환
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

      {md && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">미리보기</h2>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <textarea readOnly value={md} className="h-72 w-full rounded-md border bg-card p-3 text-xs font-mono leading-relaxed" />
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

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>휴리스틱 헤딩 검출입니다. 모든 PDF 에서 완벽하지 않을 수 있습니다.</p>
      </div>
    </main>
  );
}
