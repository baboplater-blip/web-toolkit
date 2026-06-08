'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import { loadPdfFromFile } from '@/lib/tools/pdf-common';

/** 360 으로 정규화한 페이지 회전각 (0/90/180/270). */
function normalizeAngle(deg: number): 0 | 90 | 180 | 270 {
  const a = ((Math.round(deg / 90) * 90) % 360 + 360) % 360;
  return a as 0 | 90 | 180 | 270;
}

type NupMode = 2 | 4 | 6 | 9;
type Orientation = 'auto' | 'portrait' | 'landscape';

const NUP_LAYOUTS: Record<NupMode, { cols: number; rows: number; preferredLandscape: boolean }> = {
  2: { cols: 2, rows: 1, preferredLandscape: true },
  4: { cols: 2, rows: 2, preferredLandscape: false },
  6: { cols: 3, rows: 2, preferredLandscape: true },
  9: { cols: 3, rows: 3, preferredLandscape: false },
};

export default function PdfNupPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<NupMode>(2);
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState(20);
  const [gap, setGap] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const { PDFDocument, PageSizes, degrees } = await loadPdfLib();
      // 공용 로더 사용 — 암호화 PDF 는 한국어 메시지로 정규화된 에러를 던진다.
      const src = await loadPdfFromFile(file);
      const out = await PDFDocument.create();
      const { cols, rows, preferredLandscape } = NUP_LAYOUTS[mode];

      const useLandscape = orientation === 'landscape' || (orientation === 'auto' && preferredLandscape);
      const a4 = PageSizes.A4;
      const pageW = useLandscape ? a4[1] : a4[0];
      const pageH = useLandscape ? a4[0] : a4[1];

      const embedded = await out.embedPdf(src);
      // 원본 페이지의 /Rotate 메타데이터 — embedPdf 는 회전을 굽지 않으므로 직접 보정.
      const srcRotations = src.getPages().map((pg) => normalizeAngle(pg.getRotation().angle));

      const totalCells = cols * rows;
      const totalIn = src.getPageCount();
      const totalOut = Math.ceil(totalIn / totalCells);

      const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
      const cellH = (pageH - margin * 2 - gap * (rows - 1)) / rows;

      for (let p = 0; p < totalOut; p++) {
        const page = out.addPage([pageW, pageH]);
        for (let c = 0; c < totalCells; c++) {
          const srcIdx = p * totalCells + c;
          if (srcIdx >= totalIn) break;
          const emb = embedded[srcIdx];
          // 폼 자체 크기(회전 미반영)
          const ew = emb.width;
          const eh = emb.height;
          const angle = srcRotations[srcIdx] ?? 0;
          const rotated = angle === 90 || angle === 270;
          // 화면에 보이는(회전 반영) 크기로 셀 맞춤 비율 계산
          const visW = rotated ? eh : ew;
          const visH = rotated ? ew : eh;
          const scale = Math.min(cellW / visW, cellH / visH);
          // 회전 반영 후 셀 안에서 차지하는 박스 크기
          const drawW = visW * scale;
          const drawH = visH * scale;
          // 폼 자체에 적용할 스케일 크기 (회전 전 기준)
          const sW = ew * scale;
          const sH = eh * scale;

          const col = c % cols;
          const row = Math.floor(c / cols);
          const cellX = margin + col * (cellW + gap);
          // y 좌표는 PDF 좌표계 (아래에서 위), 위에서부터 행을 채우려면 위→아래로 계산
          const cellY = pageH - margin - (row + 1) * cellH - row * gap;

          // 회전 박스의 좌하단 위치 (셀 중앙 정렬)
          const boxX = cellX + (cellW - drawW) / 2;
          const boxY = cellY + (cellH - drawH) / 2;

          // drawPage 의 rotate 는 (x,y) 앵커 기준 반시계 회전. 각도별 앵커 보정.
          let drawX = boxX;
          let drawY = boxY;
          if (angle === 90) {
            drawX = boxX + sH;
          } else if (angle === 180) {
            drawX = boxX + sW;
            drawY = boxY + sH;
          } else if (angle === 270) {
            drawY = boxY + sW;
          }

          page.drawPage(emb, {
            x: drawX,
            y: drawY,
            width: sW,
            height: sH,
            rotate: degrees(angle),
          });
        }
      }

      const bytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      // 새 URL 생성 전 직전 결과 URL 회수 (재실행 시 누수 방지)
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-${mode}up.pdf`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'N-up 합성에 실패했습니다.');
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
      <ToolHeader title="PDF N-up 배치" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        한 장에 2/4/6/9 페이지를 모아 인쇄·검토용 시안을 만듭니다.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        maxBytes={100 * 1024 * 1024}
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium">한 장에 넣을 페이지 수</p>
          <div className="flex flex-wrap gap-2">
            {([2, 4, 6, 9] as NupMode[]).map((n) => (
              <Button key={n} variant={mode === n ? 'default' : 'outline'} size="sm" onClick={() => setMode(n)}>{n}-up</Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium">출력 페이지 방향</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={orientation === 'auto' ? 'default' : 'outline'} size="sm" onClick={() => setOrientation('auto')}>자동</Button>
            <Button variant={orientation === 'portrait' ? 'default' : 'outline'} size="sm" onClick={() => setOrientation('portrait')}>세로</Button>
            <Button variant={orientation === 'landscape' ? 'default' : 'outline'} size="sm" onClick={() => setOrientation('landscape')}>가로</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">여백 (pt)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={margin}
              onChange={(e) => setMargin(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="여백 (pt)" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">셀 간격 (pt)</label>
            <input
              type="number"
              min={0}
              max={50}
              value={gap}
              onChange={(e) => setGap(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="셀 간격 (pt)" />
          </div>
        </div>
      </div>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        N-up 합성
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
        />
      )}
      </main>
    </div>
  );
}
