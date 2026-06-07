'use client';

import { useEffect, useState } from 'react';
import { Grid2x2, Download, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerDownload } from '@/lib/tools/file-utils';
import { buildZip } from '@/lib/tools/zip-builder';
import type { BatchOutput } from '@/lib/tools/folder-batch';

const MAX_DIVISIONS = 20;

function clampDivision(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_DIVISIONS, Math.max(1, Math.floor(value)));
}

async function renderTile(
  bitmap: ImageBitmap,
  sx: number,
  sy: number,
  tileW: number,
  tileH: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = tileW;
  canvas.height = tileH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
  ctx.drawImage(bitmap, sx, sy, tileW, tileH, 0, 0, tileW, tileH);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('PNG 인코딩에 실패했습니다.');
  return blob;
}

export default function ImageSplitPage() {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [fileName, setFileName] = useState('split');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => bitmap?.close(), [bitmap]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('이미지 파일을 업로드해주세요.');
      return;
    }
    setError(null);
    try {
      const next = await createImageBitmap(file);
      setBitmap((prev) => {
        prev?.close();
        return next;
      });
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      const dot = file.name.lastIndexOf('.');
      setFileName(dot > 0 ? file.name.slice(0, dot) : file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 로드에 실패했습니다.');
    }
  }

  async function handleSplit() {
    if (!bitmap) return;
    setError(null);
    setProcessing(true);
    try {
      // 나머지 픽셀은 마지막 행·열에 흡수시켜 손실 없이 분할.
      const baseW = Math.floor(bitmap.width / cols);
      const baseH = Math.floor(bitmap.height / rows);
      if (baseW < 1 || baseH < 1) {
        throw new Error('타일 크기가 1px 미만입니다. 행·열 수를 줄여주세요.');
      }

      const outputs: BatchOutput[] = [];
      const digits = String(rows * cols).length;
      let index = 0;
      for (let r = 0; r < rows; r++) {
        const sy = r * baseH;
        const tileH = r === rows - 1 ? bitmap.height - sy : baseH;
        for (let c = 0; c < cols; c++) {
          const sx = c * baseW;
          const tileW = c === cols - 1 ? bitmap.width - sx : baseW;
          index++;
          const blob = await renderTile(bitmap, sx, sy, tileW, tileH);
          const seq = String(index).padStart(digits, '0');
          outputs.push({
            relativePath: `${fileName}-r${r + 1}c${c + 1}-${seq}.png`,
            blob,
          });
        }
      }

      const zip = await buildZip(outputs, { rootName: `${fileName}-split` });
      triggerDownload(zip, `${fileName}-split.zip`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '분할 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  const tileCount = rows * cols;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Grid2x2 className="h-5 w-5 text-primary" aria-hidden />
          이미지 그리드 분할
        </h1>
        <p className="text-sm text-muted-foreground">
          이미지를 행·열 격자로 잘라 SNS 업로드용 조각으로 만들고 ZIP 으로 내려받습니다.
        </p>
      </header>

      {!bitmap && (
        <FileDropZone
          accept="image/*"
          onFiles={handleFiles}
          onError={setError}
          description="분할할 이미지를 올려주세요."
        />
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {bitmap && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            원본 크기: {bitmap.width}×{bitmap.height}px
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="split-rows" className="text-xs font-medium">
                행 수 (세로 분할)
              </label>
              <Input
                id="split-rows"
                type="number"
                min={1}
                max={MAX_DIVISIONS}
                value={rows}
                onChange={(e) => setRows(clampDivision(Number(e.target.value)))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="split-cols" className="text-xs font-medium">
                열 수 (가로 분할)
              </label>
              <Input
                id="split-cols"
                type="number"
                min={1}
                max={MAX_DIVISIONS}
                value={cols}
                onChange={(e) => setCols(clampDivision(Number(e.target.value)))}
              />
            </div>
          </div>

          <p className="text-sm">
            총 <span className="font-semibold">{tileCount}</span>개 조각 (약{' '}
            {Math.floor(bitmap.width / cols)}×{Math.floor(bitmap.height / rows)}px)
          </p>

          {previewUrl && (
            <div className="relative inline-block overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="분할 미리보기"
                className="block max-h-[50vh] max-w-full object-contain"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
              >
                {Array.from({ length: tileCount }).map((_, i) => (
                  <div key={i} className="border border-primary/60" />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSplit} disabled={processing}>
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="mr-2 h-4 w-4" aria-hidden />
              )}
              {tileCount}개 조각 ZIP 다운로드
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                bitmap.close();
                setBitmap(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
            >
              다른 이미지
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
