'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Download, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import { isPdfFile, loadPdfFromFile, stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

const MAX_BYTES = 100 * 1024 * 1024;

// A4 가로(landscape) 한 장 — pt. 좌우 절반에 원본 페이지를 한 장씩 배치한다.
const SHEET_W = 842;
const SHEET_H = 595;
const MARGIN = 18;
const GUTTER = 12; // 좌우 페이지 사이(접지선) 간격

interface BookletResult {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  inputPages: number;
  outputSheets: number;
}

/**
 * saddle-stitch(중철) 접지 순서로 1-based 페이지 번호 배열을 만든다.
 * 입력은 4의 배수(`padded`)이며, 0 은 빈(공백) 페이지를 의미한다.
 *
 * 한 물리 시트는 [전면-좌, 전면-우, 후면-좌, 후면-우] 2장의 종이면을 만든다:
 * 가장 바깥 시트 = [마지막, 첫째 | 둘째, 끝에서 둘째], 안쪽으로 진행.
 * 결과 배열의 2개씩이 출력 PDF 한 면(landscape 시트)을 이룬다.
 */
function buildBookletOrder(padded: number): number[] {
  const order: number[] = [];
  let left = padded;
  let right = 1;
  while (right < left) {
    // 전면: 좌 = 바깥 마지막, 우 = 바깥 첫째
    order.push(left, right);
    // 후면: 좌 = 안쪽 첫째, 우 = 안쪽 마지막
    order.push(right + 1, left - 1);
    right += 2;
    left -= 2;
  }
  return order;
}

export default function PdfBookletPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookletResult | null>(null);

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
      const inputPages = src.getPageCount();
      if (inputPages === 0) {
        throw new Error('페이지가 없는 PDF입니다.');
      }

      const out = await PDFDocument.create();
      out.setProducer('');
      out.setCreator('');

      // 4의 배수로 빈 페이지 패딩 → 중철 접지 순서 산출.
      const padded = Math.ceil(inputPages / 4) * 4;
      const order = buildBookletOrder(padded); // 1-based, 0 은 빈 페이지

      // 실제 임베드가 필요한 원본 페이지(1..inputPages)만 한 번씩 임베드.
      const embedded = await out.embedPdf(src);

      // 한 면(landscape 시트)당 좌·우 절반에 1페이지씩.
      const halfW = (SHEET_W - MARGIN * 2 - GUTTER) / 2;
      const slotH = SHEET_H - MARGIN * 2;
      const leftSlotX = MARGIN;
      const rightSlotX = MARGIN + halfW + GUTTER;

      for (let i = 0; i < order.length; i += 2) {
        const page = out.addPage([SHEET_W, SHEET_H]);
        const pair = [order[i], order[i + 1]];
        pair.forEach((pageNo, half) => {
          if (pageNo < 1 || pageNo > inputPages) return; // 빈(패딩) 페이지는 공백으로 남김
          const emb = embedded[pageNo - 1];
          const scale = Math.min(halfW / emb.width, slotH / emb.height);
          const drawW = emb.width * scale;
          const drawH = emb.height * scale;
          const slotX = half === 0 ? leftSlotX : rightSlotX;
          // 슬롯 중앙 정렬 (PDF 좌표계: 좌하단 원점)
          const x = slotX + (halfW - drawW) / 2;
          const y = MARGIN + (slotH - drawH) / 2;
          page.drawPage(emb, { x, y, width: drawW, height: drawH });
        });
      }

      const bytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        blobUrl: URL.createObjectURL(blob),
        fileName: `${baseName}-booklet.pdf`,
        inputPages,
        outputSheets: order.length / 2,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 소책자 만들기에 실패했습니다.');
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
      <ToolHeader title="PDF 소책자 만들기" widthClass="max-w-2xl" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          중철 제본용으로 페이지를 접지 순서대로 재배치합니다. A4 가로 한 장에 2페이지씩 배치되며, 가운데를 접어 책자로 만들 수 있습니다.
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
          소책자로 만들기
        </Button>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              원본 {result.inputPages}페이지 → 가로 시트 {result.outputSheets}면 · 양면 인쇄 후 가운데를 접으세요 · {formatBytes(result.blob.size)}
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
