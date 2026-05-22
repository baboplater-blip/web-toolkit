'use client';

import { useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

export default function DocxToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('DOCX 파일을 선택해주세요.');
      return;
    }
    setError(null);
    setResult(null);
    setBusy(true);
    setProgressText('Word 문서 분석');
    try {
      const mammothMod = (await import('mammoth')) as unknown as {
        convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
      };
      const buf = await file.arrayBuffer();
      const r = await mammothMod.convertToHtml({ arrayBuffer: buf });

      setProgressText('PDF 조립 중 — 이미지가 많으면 시간이 걸립니다');
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '595px';
      container.style.padding = '36pt 40pt';
      container.style.color = '#111';
      container.style.background = '#fff';
      container.style.fontFamily =
        '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
      container.style.fontSize = '11pt';
      container.style.lineHeight = '1.6';
      container.innerHTML = r.value;
      document.body.appendChild(container);

      try {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });

        await pdf.html(container, {
          x: 0,
          y: 0,
          width: 595,
          windowWidth: 595,
          margin: 0,
          autoPaging: 'text',
          html2canvas: {
            scale: 0.96,
            useCORS: false,
            allowTaint: true,
            backgroundColor: '#ffffff',
          },
          callback: () => {},
        });

        const blob = pdf.output('blob');
        const baseName = file.name.replace(/\.docx$/i, '');
        setResult({
          blobUrl: URL.createObjectURL(blob),
          filename: `${baseName}.pdf`,
          originalSize: file.size,
          compressedSize: blob.size,
        });
      } finally {
        container.remove();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
      setProgressText('');
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-xl font-semibold">DOCX → PDF</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Word 문서를 PDF 로 변환합니다. 10 MB 이하 권장.
        </p>
      </header>

      <FileDropZone
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="DOCX 파일을 끌어다 놓거나 클릭하여 선택"
        hint=".docx (구버전 .doc 은 지원 안 함)"
      />

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        PDF 로 변환
      </Button>

      {busy && progressText && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {progressText}
        </p>
      )}

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

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">알아두실 점</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>변환은 모두 브라우저 안에서 수행됩니다.</li>
          <li>복잡한 레이아웃(표·헤더·푸터·도형)은 단순화될 수 있습니다.</li>
          <li>PDF 내 텍스트는 이미지로 변환되어 검색이 어려울 수 있습니다.</li>
        </ul>
      </div>
    </main>
  );
}
