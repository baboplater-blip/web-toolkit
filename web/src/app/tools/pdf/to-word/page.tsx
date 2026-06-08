'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { extractMarkdown, openPdfDoc } from '@/lib/tools/pdf-text';

/**
 * PDF → Word (.doc).
 *
 * Word 호환 HTML(MIME multipart 없이) 을 .doc 확장자로 저장하면 Word/한컴이 열 수 있습니다.
 * 진짜 docx (Office Open XML) 가 아닌 "HTML 기반 Word 문서" 입니다.
 * 텍스트 위주 PDF 에서 최적이며, 복잡한 레이아웃은 보존되지 않습니다.
 */
export default function PdfToWordPage() {
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

  // 언마운트 시 마지막 결과 ObjectURL 회수 (merge 의 생명주기와 동일)
  useEffect(() => () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); }, [result?.blobUrl]);

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
        onProgress: (p) => setProgress(Math.round(p * 85)),
      });
      pdf.destroy();
      // 스캔본 등 텍스트가 전혀 없는 PDF 는 빈 결과 대신 안내한다.
      if (md.trim().length === 0) {
        setError('추출할 텍스트가 없습니다(스캔본일 수 있음). OCR 도구를 먼저 사용하세요.');
        return;
      }
      setProgress(90);

      const markedMod = await import('marked');
      const body = String(await Promise.resolve(markedMod.marked.parse(md)));

      const title = file.name.replace(/\.pdf$/i, '');
      const docHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument>
</xml><![endif]-->
<style>
@page WordSection1 { size: 595.3pt 841.9pt; margin: 1in; }
div.WordSection1 { page: WordSection1; }
body { font-family: '맑은 고딕', 'Malgun Gothic', '나눔고딕', sans-serif; font-size: 11pt; line-height: 1.6; }
h1 { font-size: 18pt; }
h2 { font-size: 15pt; }
h3 { font-size: 12pt; }
</style>
</head>
<body>
<div class="WordSection1">
${body}
</div>
</body>
</html>`;
      const blob = new Blob([docHtml], { type: 'application/msword' });
      // 새 URL 생성 전 직전 결과 URL 회수 (재실행 시 누수 방지)
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${title}.doc`,
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
      <ToolHeader title="PDF → Word (.doc)" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        PDF 의 텍스트를 추출해 Word 에서 열 수 있는 .doc 파일로 변환합니다.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        maxBytes={100 * 1024 * 1024}
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Word 로 변환
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
          extraInfo="텍스트 기반 변환 — 복잡한 레이아웃은 보존되지 않습니다."
        />
      )}

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">알아두실 점</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>Microsoft Word, Google Docs, 한컴오피스, LibreOffice 에서 열 수 있습니다.</li>
          <li>스캔된 이미지 PDF 는 OCR 도구로 먼저 텍스트화하세요.</li>
        </ul>
      </div>
      </main>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
