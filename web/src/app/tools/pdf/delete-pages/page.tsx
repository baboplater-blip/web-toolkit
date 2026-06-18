'use client';

import { useEffect, useState } from 'react';
import { Download, FileMinus, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import {
  isPdfFile,
  loadPdfFromFile,
  parsePageRanges,
  saveAsBlob,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

const MAX_BYTES = 100 * 1024 * 1024;

interface DeleteResult {
  blob: Blob;
  fileName: string;
  deletedCount: number;
  keptCount: number;
}

export default function PdfDeletePagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [spec, setSpec] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeleteResult | null>(null);

  // 결과 교체·언마운트 시 처리: triggerDownload 가 objectURL 수명을 직접 관리하므로
  // 여기서는 입력 상태만 정리한다. (별도 보존 URL 없음)
  useEffect(() => {
    return () => setResult(null);
  }, []);

  // 삭제 대상을 실시간 파싱해 실행 전에 결과를 가늠한다.
  const toDelete = pageCount > 0 ? parsePageRanges(spec, pageCount) : [];
  const keptCount = pageCount - toDelete.length;

  async function acceptFile(picked: File | undefined) {
    if (!picked) return;
    if (!isPdfFile(picked)) {
      setError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    setError(null);
    setResult(null);
    try {
      // 공용 로더 — 암호화 PDF 는 한국어 메시지로 정규화된 에러를 던진다.
      const doc = await loadPdfFromFile(picked);
      setFile(picked);
      setPageCount(doc.getPageCount());
      setSpec('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 로드에 실패했습니다.');
    }
  }

  async function handleProcess() {
    if (!file) {
      setError('PDF 파일을 먼저 선택해주세요.');
      return;
    }
    if (toDelete.length === 0) {
      setError('삭제할 페이지를 입력해주세요. (예: 1, 3, 5-7)');
      return;
    }
    if (keptCount <= 0) {
      setError('모든 페이지를 삭제할 수는 없습니다. 최소 한 페이지는 남겨주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const { PDFDocument } = await loadPdfLib();
      const src = await loadPdfFromFile(file);
      const total = src.getPageCount();

      // 삭제 대상을 제외한, 남길 페이지의 0-기반 인덱스 목록(원래 순서 유지).
      const deleteSet = new Set(toDelete);
      const keepIndices: number[] = [];
      for (let page = 1; page <= total; page++) {
        if (!deleteSet.has(page)) keepIndices.push(page - 1);
      }

      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, keepIndices);
      copied.forEach((page) => out.addPage(page));

      const blob = await saveAsBlob(out);
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        fileName: `${baseName}-deleted.pdf`,
        deletedCount: toDelete.length,
        keptCount: keepIndices.length,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 페이지 삭제에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setPageCount(0);
    setSpec('');
    setResult(null);
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 페이지 삭제" widthClass="max-w-2xl" onReset={file ? reset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileMinus className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          지정한 페이지를 빼고 나머지만 남겨 새 PDF 로 저장합니다.
        </p>

        {!file && (
          <FileDropZone
            accept="application/pdf,.pdf"
            maxBytes={MAX_BYTES}
            onFiles={(picked) => acceptFile(picked[0])}
            title="PDF 파일을 끌어다 놓거나 클릭"
          />
        )}

        {file && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              선택한 파일: <span className="font-medium text-foreground">{file.name}</span> ·{' '}
              {formatBytes(file.size)} · {pageCount}페이지
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="del-spec">
                삭제할 페이지 (예: 1, 3, 5-7)
              </label>
              <Input
                id="del-spec"
                type="text"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder={`예: 1, 3, 5-7 (전체 1~${pageCount})`}
                disabled={busy}
                className="h-9"
                aria-label="삭제할 페이지"
              />
              <p className="text-[10px] text-muted-foreground">
                콤마와 하이픈으로 여러 페이지·범위를 지정할 수 있습니다. 전체 페이지: 1~{pageCount}
              </p>
            </div>

            {spec.trim() !== '' && (
              <div className="rounded-lg border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                {toDelete.length > 0 ? (
                  <>
                    삭제 <span className="font-medium text-foreground">{toDelete.length}</span>페이지 ·
                    남김 <span className="font-medium text-foreground">{keptCount}</span>페이지
                  </>
                ) : (
                  <span className="text-destructive">유효한 페이지 번호가 없습니다.</span>
                )}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleProcess}
              disabled={busy || toDelete.length === 0 || keptCount <= 0}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileMinus className="h-4 w-4" aria-hidden />}
              페이지 삭제
            </Button>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              {result.deletedCount}페이지를 삭제하고 {result.keptCount}페이지를 남겼습니다 ·{' '}
              {formatBytes(result.blob.size)}
            </p>
            <Button className="w-full" onClick={() => triggerDownload(result.blob, result.fileName)}>
              <Download className="h-4 w-4" aria-hidden />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
