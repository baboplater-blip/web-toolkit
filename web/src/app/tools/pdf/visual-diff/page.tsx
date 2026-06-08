'use client';

import { useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { openPdfDoc } from '@/lib/tools/pdf-text';

interface PageDiff {
  page: number;
  identical: boolean;
  diffPercent: number;
  imageDataUrl: string;
}

/** 한 번에 비교할 최대 페이지 수 — 초과분은 처리하지 않고 경고. */
const MAX_DIFF_PAGES = 100;

/** 이벤트 루프에 양보해 UI 가 멈추지 않게 한다. */
function yieldToUi(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

export default function PdfVisualDiffPage() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<PageDiff[] | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const abortRef = useRef<{ aborted: boolean } | null>(null);

  // 결과 이미지는 canvas.toDataURL 로 만든 data: URL 이라 objectURL 해제가 필요 없다.

  async function handleProcess() {
    if (!a || !b) {
      setError('비교할 PDF 두 개를 모두 선택해주세요.');
      return;
    }
    setError(null);
    setWarning(null);
    setBusy(true);
    setDiffs(null);
    setProgress(0);
    const token = { aborted: false };
    abortRef.current = token;

    let pdfA: Awaited<ReturnType<typeof openPdfDoc>> | null = null;
    let pdfB: Awaited<ReturnType<typeof openPdfDoc>> | null = null;
    try {
      [pdfA, pdfB] = await Promise.all([openPdfDoc(a), openPdfDoc(b)]);
      const fullCount = Math.max(pdfA.numPages, pdfB.numPages);
      // 페이지 수 상한 — 초과분은 잘라내고 경고 (메모리·시간 폭주 방지)
      const pageCount = Math.min(fullCount, MAX_DIFF_PAGES);
      if (fullCount > MAX_DIFF_PAGES) {
        setWarning(`페이지가 많아 처음 ${MAX_DIFF_PAGES}페이지까지만 비교합니다(전체 ${fullCount}페이지).`);
      }
      const out: PageDiff[] = [];

      for (let i = 1; i <= pageCount; i++) {
        if (token.aborted) throw new Error('취소되었습니다.');
        const imgA = i <= pdfA.numPages ? await renderPage(pdfA, i, scale) : null;
        const imgB = i <= pdfB.numPages ? await renderPage(pdfB, i, scale) : null;
        const { dataUrl, identical, diffPercent } = diffPages(imgA, imgB, token);
        out.push({ page: i, identical, diffPercent, imageDataUrl: dataUrl });
        setProgress(Math.round((i / pageCount) * 100));
        setDiffs([...out]);
        // 페이지마다 UI 에 양보 — 큰 PDF 에서 화면이 얼지 않도록
        await yieldToUi();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '비교에 실패했습니다.');
    } finally {
      pdfA?.destroy();
      pdfB?.destroy();
      setBusy(false);
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  function handleReset() {
    if (abortRef.current) abortRef.current.aborted = true;
    setA(null);
    setB(null);
    setDiffs(null);
    setError(null);
    setWarning(null);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 시각 비교" widthClass="max-w-3xl" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        두 PDF 의 같은 페이지를 픽셀 단위로 비교해 차이를 빨강·초록으로 표시합니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold">기준 PDF (A)</p>
          <FileDropZone accept="application/pdf,.pdf" maxBytes={100 * 1024 * 1024} onFiles={(files) => setA(files[0] ?? null)} title="A" />
          {a && <p className="text-xs text-muted-foreground truncate">{a.name}</p>}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">비교 PDF (B)</p>
          <FileDropZone accept="application/pdf,.pdf" maxBytes={100 * 1024 * 1024} onFiles={(files) => setB(files[0] ?? null)} title="B" />
          {b && <p className="text-xs text-muted-foreground truncate">{b.name}</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 flex items-center gap-2 text-xs">
        <label>렌더 배율</label>
        <select value={scale} onChange={(e) => setScale(Number(e.target.value))} className="rounded-md border bg-background px-2 py-1">
          <option value={0.7}>0.7× (빠름)</option>
          <option value={1.0}>1.0× (표준)</option>
          <option value={1.5}>1.5× (정밀)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !a || !b}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          비교
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

      {warning && (
        <div role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          {warning}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {diffs && (
        <div className="space-y-3">
          {diffs.map((d) => (
            <div key={d.page} className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <p className="text-xs font-medium">페이지 {d.page}</p>
                <p className={`text-xs ${d.identical ? 'text-emerald-600' : d.diffPercent > 5 ? 'text-destructive' : 'text-amber-600'}`}>
                  {d.identical ? '동일' : `차이 ${d.diffPercent.toFixed(1)}%`}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.imageDataUrl} alt={`page ${d.page} diff`} className="block w-full" />
            </div>
          ))}
        </div>
      )}
      </main>
    </div>
  );
}

async function renderPage(pdf: unknown, n: number, scale: number): Promise<ImageData> {
  // pdfjs page render to ImageData
  const doc = pdf as { getPage: (n: number) => Promise<unknown> };
  const page = (await doc.getPage(n)) as {
    getViewport: (o: { scale: number }) => { width: number; height: number };
    render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown; canvas: HTMLCanvasElement }) => { promise: Promise<void> };
    cleanup: () => void;
  };
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas ctx');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  page.cleanup();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function diffPages(
  a: ImageData | null,
  b: ImageData | null,
  token?: { aborted: boolean },
): { dataUrl: string; identical: boolean; diffPercent: number } {
  const w = Math.max(a?.width ?? 0, b?.width ?? 0);
  const h = Math.max(a?.height ?? 0, b?.height ?? 0);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas ctx');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  const out = ctx.createImageData(w, h);
  let diffPixels = 0;
  let total = 0;

  for (let y = 0; y < h; y++) {
    // 행 단위로 취소 확인 (픽셀 루프 폭주 차단)
    if (token?.aborted) throw new Error('취소되었습니다.');
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const pa = pixelAt(a, x, y);
      const pb = pixelAt(b, x, y);
      if (!pa && !pb) {
        out.data[idx] = 255;
        out.data[idx + 1] = 255;
        out.data[idx + 2] = 255;
        out.data[idx + 3] = 255;
        continue;
      }
      total++;
      if (!pa) {
        // 추가 (B 만)
        out.data[idx] = 80;
        out.data[idx + 1] = 200;
        out.data[idx + 2] = 80;
        out.data[idx + 3] = 255;
        diffPixels++;
      } else if (!pb) {
        // 삭제 (A 만)
        out.data[idx] = 220;
        out.data[idx + 1] = 60;
        out.data[idx + 2] = 60;
        out.data[idx + 3] = 255;
        diffPixels++;
      } else {
        const dr = Math.abs(pa[0] - pb[0]);
        const dg = Math.abs(pa[1] - pb[1]);
        const db = Math.abs(pa[2] - pb[2]);
        const delta = (dr + dg + db) / 3;
        if (delta > 25) {
          out.data[idx] = 220;
          out.data[idx + 1] = 60;
          out.data[idx + 2] = 60;
          out.data[idx + 3] = 255;
          // 변경 그린 위에 살짝 깔기
          diffPixels++;
        } else {
          // 동일 - 회색으로 반투명
          out.data[idx] = Math.round((pa[0] + pb[0]) / 2 * 0.5 + 127);
          out.data[idx + 1] = Math.round((pa[1] + pb[1]) / 2 * 0.5 + 127);
          out.data[idx + 2] = Math.round((pa[2] + pb[2]) / 2 * 0.5 + 127);
          out.data[idx + 3] = 200;
        }
      }
    }
  }

  ctx.putImageData(out, 0, 0);
  const diffPercent = total > 0 ? (diffPixels / total) * 100 : 0;
  const identical = diffPixels === 0;
  return { dataUrl: canvas.toDataURL('image/png'), identical, diffPercent };
}

function pixelAt(img: ImageData | null, x: number, y: number): [number, number, number, number] | null {
  if (!img) return null;
  if (x >= img.width || y >= img.height) return null;
  const idx = (y * img.width + x) * 4;
  return [img.data[idx], img.data[idx + 1], img.data[idx + 2], img.data[idx + 3]];
}
