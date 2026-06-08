'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Copy, Check, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { extractPlainText, openPdfDoc } from '@/lib/tools/pdf-text';

export default function PdfToTxtPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [joinHyphen, setJoinHyphen] = useState(true);
  const [pageBreaks, setPageBreaks] = useState(false);
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

  // 언마운트 시 마지막 결과 ObjectURL 회수 (merge 의 생명주기와 동일)
  useEffect(() => () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); }, [result?.blobUrl]);

  async function handleProcess() {
    if (!file) {
      setError('PDF 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setText('');
    setResult(null);
    setProgress(0);
    const token = { aborted: false };
    abortRef.current = token;

    try {
      const pdf = await openPdfDoc(file);
      const pages = await extractPlainText(pdf, {
        joinHyphenated: joinHyphen,
        signal: token,
        onProgress: (p) => setProgress(Math.round(p * 100)),
      });
      pdf.destroy();
      const separator = pageBreaks ? '\n\n--- 페이지 구분 ---\n\n' : '\n\n';
      const joined = pages.join(separator).trim();
      setText(joined);
      const blob = new Blob([joined], { type: 'text/plain;charset=utf-8' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      // 새 URL 생성 전 직전 결과 URL 회수 (재실행 시 누수 방지)
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.txt`,
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
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  function handleReset() {
    setFile(null);
    setText('');
    setResult(null);
    setError(null);
    setCopied(false);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF → TXT" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        PDF 의 텍스트를 그대로 추출해 일반 텍스트 파일로 저장합니다. 스캔 PDF 는 OCR 도구를 사용하세요.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭하여 선택"
      />

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" checked={joinHyphen} onChange={(e) => setJoinHyphen(e.target.checked)} />
          줄 끝 하이픈 연결 (re-<br/>turn → return)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" checked={pageBreaks} onChange={(e) => setPageBreaks(e.target.checked)} />
          페이지 구분자 삽입
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          텍스트 추출
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

      {text && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">미리보기</h2>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <textarea readOnly value={text} className="h-72 w-full rounded-md border bg-card p-3 text-xs leading-relaxed" aria-label="미리보기" />
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
