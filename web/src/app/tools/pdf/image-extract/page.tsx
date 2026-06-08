'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import JSZip from 'jszip';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { extractImagesFromPdf, openPdfDoc } from '@/lib/tools/pdf-text';

export default function PdfImageExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
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
    setProgress(0);
    setResult(null);
    setCount(0);
    const token = { aborted: false };
    abortRef.current = token;

    try {
      const pdf = await openPdfDoc(file);
      const imgs = await extractImagesFromPdf(pdf, {
        signal: token,
        onProgress: (p) => setProgress(Math.round(p * 90)),
      });
      pdf.destroy();
      if (imgs.length === 0) {
        setError('PDF 안에서 추출 가능한 이미지를 찾지 못했습니다. (스캔 페이지/벡터 이미지일 수 있음)');
        return;
      }
      setCount(imgs.length);

      const zip = new JSZip();
      for (const im of imgs) {
        const fname = `p${String(im.page).padStart(3, '0')}-img${String(im.index).padStart(2, '0')}.png`;
        zip.file(fname, im.png);
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      // 새 URL 생성 전 직전 결과 URL 회수 (재실행 시 누수 방지)
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-images.zip`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : '추출에 실패했습니다.');
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
    setCount(0);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 이미지 추출" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        PDF 페이지에 삽입된 이미지를 PNG 로 추출해 ZIP 으로 저장합니다.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          이미지 추출
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

      {count > 0 && (
        <div className="rounded-lg border bg-card p-3 text-sm">
          {count.toLocaleString()} 장 이미지 추출됨
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
        <p>벡터 그래픽이나 마스킹된 이미지는 추출되지 않거나 형태가 다를 수 있습니다. 페이지 전체를 이미지화하려면 &quot;PDF → JPG&quot; 도구를 사용하세요.</p>
      </div>
      </main>
    </div>
  );
}
