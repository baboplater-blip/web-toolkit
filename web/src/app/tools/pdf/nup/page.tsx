'use client';

import { useState } from 'react';
import { Loader2, LayoutGrid } from 'lucide-react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

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

  async function handleProcess() {
    if (!file) {
      setError('PDF 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
      const out = await PDFDocument.create();
      const { cols, rows, preferredLandscape } = NUP_LAYOUTS[mode];

      const useLandscape = orientation === 'landscape' || (orientation === 'auto' && preferredLandscape);
      const a4 = PageSizes.A4;
      const pageW = useLandscape ? a4[1] : a4[0];
      const pageH = useLandscape ? a4[0] : a4[1];

      const embedded = await out.embedPdf(src);

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
          const ew = emb.width;
          const eh = emb.height;
          const sx = cellW / ew;
          const sy = cellH / eh;
          const scale = Math.min(sx, sy);
          const drawW = ew * scale;
          const drawH = eh * scale;

          const col = c % cols;
          const row = Math.floor(c / cols);
          const cellX = margin + col * (cellW + gap);
          // y 좌표는 PDF 좌표계 (아래에서 위), 위에서부터 행을 채우려면 위→아래로 계산
          const cellY = pageH - margin - (row + 1) * cellH - row * gap;

          const drawX = cellX + (cellW - drawW) / 2;
          const drawY = cellY + (cellH - drawH) / 2;

          page.drawPage(emb, { x: drawX, y: drawY, width: drawW, height: drawH });
        }
      }

      const bytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
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

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          <h1 className="text-xl font-semibold">PDF N-up 배치</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          한 장에 2/4/6/9 페이지를 모아 인쇄·검토용 시안을 만듭니다.
        </p>
      </header>

      <FileDropZone
        accept="application/pdf,.pdf"
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
  );
}
