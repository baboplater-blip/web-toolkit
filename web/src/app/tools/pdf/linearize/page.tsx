'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';

export default function PdfLinearizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useObjectStreams, setUseObjectStreams] = useState(true);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

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
    try {
      const { PDFDocument } = await loadPdfLib();
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { updateMetadata: false, ignoreEncryption: false });
      // 새 PDF 를 처음부터 재저장 — 구조 단순화·중복 객체 제거
      doc.setProducer(doc.getProducer() ?? 'Web Toolkit');
      doc.setModificationDate(new Date());
      const bytes = await doc.save({ useObjectStreams, objectsPerTick: 50 });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      // 새 URL 생성 전 직전 결과 URL 회수 (재실행 시 누수 방지)
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-optimized.pdf`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '최적화에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 웹 최적화 (Linearize)" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        중복 객체 제거·압축 스트림 재구성으로 PDF 파일을 정리합니다. 빠른 다운로드·웹 로딩에 유리.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4" checked={useObjectStreams} onChange={(e) => setUseObjectStreams(e.target.checked)} />
        Object Streams 사용 (대부분 더 작음 — 일부 구형 뷰어 호환성 ↓)
      </label>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        최적화 실행
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
          extraInfo="pdf-lib 재저장 — 구조 정리. 진정한 Linearize (Fast Web View) 는 일부 변환만 됩니다."
        />
      )}

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>주의: 브라우저 라이브러리(pdf-lib) 는 PDF 1.4+ 의 Object Streams 까지 지원합니다. 정식 Linearize (Fast Web View) 는 PDF 서버 라이브러리에서만 가능하며, 본 도구는 재구성 + 압축 효과를 제공합니다.</p>
      </div>
      </main>
    </div>
  );
}
