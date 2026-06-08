'use client';

import { useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { extractMarkdown, openPdfDoc } from '@/lib/tools/pdf-text';

export default function PdfToHtmlPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
    setProgress(0);
    const token = { aborted: false };
    abortRef.current = token;

    try {
      const pdf = await openPdfDoc(file);
      const md = await extractMarkdown(pdf, {
        signal: token,
        onProgress: (p) => setProgress(Math.round(p * 80)),
      });
      pdf.destroy();
      setProgress(85);

      const markedMod = await import('marked');
      const html = String(await Promise.resolve(markedMod.marked.parse(md)));
      setProgress(95);

      const title = file.name.replace(/\.pdf$/i, '');
      const full = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',serif; max-width: 720px; margin: 2em auto; padding: 0 1.5em; line-height: 1.7; color: #222; }
  h1, h2, h3 { line-height: 1.3; margin-top: 1.5em; }
  p { margin: 0.8em 0; }
  code { background: #f4f4f4; padding: 0.1em 0.3em; border-radius: 3px; }
  pre { background: #f4f4f4; padding: 0.8em; overflow-x: auto; }
</style>
</head>
<body>
${html}
</body>
</html>`;
      const blob = new Blob([full], { type: 'text/html;charset=utf-8' });
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${title}.html`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF → HTML" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        PDF 텍스트를 헤딩·단락 구조의 HTML 페이지로 변환합니다.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          HTML 로 변환
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
