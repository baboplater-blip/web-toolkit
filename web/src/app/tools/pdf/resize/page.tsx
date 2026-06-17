'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import { loadPdfFromFile } from '@/lib/tools/pdf-common';

type PageSizeKey = 'A4' | 'A3' | 'Letter' | 'Legal';
type Orientation = 'portrait' | 'landscape';

// PDF 포인트(1/72인치) 기준 세로 방향 [너비, 높이].
const PAGE_SIZES: Record<PageSizeKey, [number, number]> = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  Letter: [612, 792],
  Legal: [612, 1008],
};

const SIZE_KEYS: PageSizeKey[] = ['A4', 'A3', 'Letter', 'Legal'];

export default function PdfResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [sizeKey, setSizeKey] = useState<PageSizeKey>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
    pages: number;
  } | null>(null);

  // 결과 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
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
      // 공용 로더 — 암호화 PDF 는 한국어 메시지로 정규화된 에러를 던진다.
      const src = await loadPdfFromFile(file);
      const out = await PDFDocument.create();

      const [baseW, baseH] = PAGE_SIZES[sizeKey];
      const targetW = orientation === 'landscape' ? baseH : baseW;
      const targetH = orientation === 'landscape' ? baseW : baseH;

      const total = src.getPageCount();
      const embedded = await out.embedPdf(src);

      for (let i = 0; i < total; i++) {
        const emb = embedded[i];
        const page = out.addPage([targetW, targetH]);
        // 원본 비율 유지: 목표 페이지에 맞춰 축소/확대하되 잘리지 않게 한 변 기준 스케일.
        const scale = Math.min(targetW / emb.width, targetH / emb.height);
        const drawW = emb.width * scale;
        const drawH = emb.height * scale;
        // 중앙 배치.
        const x = (targetW - drawW) / 2;
        const y = (targetH - drawH) / 2;
        page.drawPage(emb, { x, y, width: drawW, height: drawH });
      }

      const bytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      const orientLabel = orientation === 'landscape' ? 'landscape' : 'portrait';
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-${sizeKey}-${orientLabel}.pdf`,
        originalSize: file.size,
        compressedSize: blob.size,
        pages: total,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 크기 변경에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(picked: File | null) {
    setFile(picked);
    setResult(null);
    setError(null);
    setPageCount(null);
    if (!picked) return;
    // 페이지 수 미리 표시 (가벼운 메타데이터 로드).
    try {
      const doc = await loadPdfFromFile(picked);
      setPageCount(doc.getPageCount());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 를 읽지 못했습니다.');
    }
  }

  function handleReset() {
    setFile(null);
    setSizeKey('A4');
    setOrientation('portrait');
    setResult(null);
    setError(null);
    setPageCount(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 페이지 크기 변경" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          PDF 페이지를 A4·A3·Letter·Legal 표준 크기로 맞춥니다. 원본 비율을 유지하며 중앙에 배치합니다.
        </p>

        <FileDropZone
          accept="application/pdf,.pdf"
          maxBytes={100 * 1024 * 1024}
          onFiles={(files) => void handleFile(files[0] ?? null)}
          onError={setError}
          title="PDF 파일을 끌어다 놓거나 클릭"
        />

        {pageCount !== null && (
          <p className="text-xs text-muted-foreground">총 {pageCount}페이지</p>
        )}

        {file && (
          <div className="rounded-xl border bg-card p-3 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium">목표 페이지 크기</p>
              <div className="flex flex-wrap gap-2">
                {SIZE_KEYS.map((key) => (
                  <Button
                    key={key}
                    variant={sizeKey === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSizeKey(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">방향</p>
              <div className="flex flex-wrap gap-2">
                <Button variant={orientation === 'portrait' ? 'default' : 'outline'} size="sm" onClick={() => setOrientation('portrait')}>
                  세로
                </Button>
                <Button variant={orientation === 'landscape' ? 'default' : 'outline'} size="sm" onClick={() => setOrientation('landscape')}>
                  가로
                </Button>
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          크기 변경
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
            metaText={`${result.pages}페이지 · ${sizeKey} ${orientation === 'landscape' ? '가로' : '세로'}`}
          />
        )}
      </main>
    </div>
  );
}
