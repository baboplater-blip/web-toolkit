'use client';

import { useEffect, useState } from 'react';
import { ArrowDownUp, Download, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import { isPdfFile, loadPdfFromFile, saveAsBlob, stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

const MAX_BYTES = 100 * 1024 * 1024;

interface ReverseResult {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  pageCount: number;
}

export default function PdfReversePage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReverseResult | null>(null);

  // 결과 교체·언마운트 시 ObjectURL 회수 (메모리 누수 방지)
  useEffect(() => () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); }, [result?.blobUrl]);

  function acceptFile(picked: File | undefined) {
    if (!picked) return;
    if (!isPdfFile(picked)) {
      setError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError('파일이 너무 큽니다. 100MB 이하의 PDF만 처리할 수 있습니다.');
      return;
    }
    setError(null);
    setResult(null);
    setFile(picked);
  }

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
      // 공용 로더 — 암호화 PDF 는 한국어 메시지로 정규화된 에러를 던진다.
      const src = await loadPdfFromFile(file);
      const totalPages = src.getPageCount();
      if (totalPages === 0) {
        throw new Error('페이지가 없는 PDF입니다.');
      }

      const out = await PDFDocument.create();
      out.setProducer('');
      out.setCreator('');

      // 원본 페이지를 역순(마지막 → 처음)으로 복사·추가.
      const reversedIndices = Array.from({ length: totalPages }, (_, i) => totalPages - 1 - i);
      const copied = await out.copyPages(src, reversedIndices);
      copied.forEach((page) => out.addPage(page));

      const blob = await saveAsBlob(out);
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        blobUrl: URL.createObjectURL(blob),
        fileName: `${baseName}-reversed.pdf`,
        pageCount: totalPages,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 페이지 역순 처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 페이지 역순" widthClass="max-w-2xl" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowDownUp className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          PDF 페이지 순서를 거꾸로 뒤집어 새 PDF 로 저장합니다.
        </p>

        <FileDropZone
          accept="application/pdf,.pdf"
          maxBytes={MAX_BYTES}
          onFiles={(picked) => acceptFile(picked[0])}
          title="PDF 파일을 끌어다 놓거나 클릭"
        />

        {file && (
          <p className="text-sm text-muted-foreground">
            선택한 파일: <span className="font-medium text-foreground">{file.name}</span> · {formatBytes(file.size)}
          </p>
        )}

        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          페이지 역순으로 만들기
        </Button>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              {result.pageCount}페이지를 역순으로 재배치했습니다 · {formatBytes(result.blob.size)}
            </p>
            <Button className="w-full" onClick={() => triggerDownload(result.blob, result.fileName)}>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
