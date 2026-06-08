'use client';

import { useEffect, useState } from 'react';
import { AppWindow, Download, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';
import { buildZip } from '@/lib/tools/zip-builder';
import { packIco } from '@/lib/tools/favicon-ico';

/** PNG 으로 출력할 파비콘 변. ICO 에는 16·32·48 만 패킹한다. */
const PNG_SIZES = [16, 32, 48, 64, 180, 192, 512] as const;
const ICO_SIZES = [16, 32, 48] as const;

interface RenderedSize {
  size: number;
  blob: Blob;
  url: string;
}

async function renderSquarePng(bitmap: ImageBitmap, size: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 원본 비율을 유지하며 정사각 캔버스 가운데에 contain 배치.
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const drawW = bitmap.width * scale;
  const drawH = bitmap.height * scale;
  const dx = (size - drawW) / 2;
  const dy = (size - drawH) / 2;
  ctx.drawImage(bitmap, dx, dy, drawW, drawH);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('PNG 인코딩에 실패했습니다.');
  return blob;
}

export default function FaviconGenPage() {
  const [rendered, setRendered] = useState<RenderedSize[] | null>(null);
  const [icoBlob, setIcoBlob] = useState<Blob | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 언마운트 시 미리보기 PNG blob URL 들을 해제(누수 방지).
  // 교체는 clearResult 가 담당하므로, 여기서는 마지막 배열만 정리하면 된다.
  useEffect(() => {
    return () => {
      rendered?.forEach((r) => URL.revokeObjectURL(r.url));
    };
  }, [rendered]);

  function clearResult() {
    setRendered((prev) => {
      prev?.forEach((r) => URL.revokeObjectURL(r.url));
      return null;
    });
    setIcoBlob(null);
    setZipBlob(null);
  }

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('이미지 파일을 업로드해주세요.');
      return;
    }
    setError(null);
    clearResult();
    setProcessing(true);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const pngByteCache = new Map<number, Uint8Array>();
        const results: RenderedSize[] = [];
        for (const size of PNG_SIZES) {
          const blob = await renderSquarePng(bitmap, size);
          if (ICO_SIZES.includes(size as (typeof ICO_SIZES)[number])) {
            pngByteCache.set(size, new Uint8Array(await blob.arrayBuffer()));
          }
          results.push({ size, blob, url: URL.createObjectURL(blob) });
        }

        const ico = packIco(
          ICO_SIZES.map((size) => {
            const png = pngByteCache.get(size);
            if (!png) throw new Error(`${size}px PNG 생성에 실패했습니다.`);
            return { size, png };
          }),
        );

        const zip = await buildZip(
          [
            { relativePath: 'favicon.ico', blob: ico },
            ...results.map((r) => ({
              relativePath: `favicon-${r.size}x${r.size}.png`,
              blob: r.blob,
            })),
          ],
          { rootName: 'favicon' },
        );

        setRendered(results);
        setIcoBlob(ico);
        setZipBlob(zip);
      } finally {
        bitmap.close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '파비콘 생성에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <AppWindow className="h-5 w-5 text-primary" aria-hidden />
          파비콘 생성기
        </h1>
        <p className="text-sm text-muted-foreground">
          이미지 한 장에서 16·32·48·64·180·192·512px PNG 와 favicon.ico 를 한 번에 만들어 ZIP 으로 내려받습니다.
        </p>
      </header>

      <FileDropZone
        accept="image/*"
        onFiles={handleFiles}
        onError={setError}
        description="정사각형에 가까운 이미지일수록 결과가 깔끔합니다."
      />

      {processing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          파비콘을 생성하는 중...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {rendered && zipBlob && icoBlob && (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            미리보기
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            {rendered.map((r) => (
              <div key={r.size} className="flex flex-col items-center gap-1">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.url}
                    alt={`${r.size}px 파비콘`}
                    width={Math.min(r.size, 64)}
                    height={Math.min(r.size, 64)}
                    style={{
                      width: Math.min(r.size, 64),
                      height: Math.min(r.size, 64),
                      imageRendering: r.size <= 48 ? 'pixelated' : 'auto',
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {r.size}×{r.size}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => triggerDownload(zipBlob, 'favicon.zip')}>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              전체 ZIP 다운로드
            </Button>
            <Button
              variant="outline"
              onClick={() => triggerDownload(icoBlob, 'favicon.ico')}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden />
              favicon.ico 만 받기
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
