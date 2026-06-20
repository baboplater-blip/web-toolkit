'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

const MAX_BYTES = 50 * 1024 * 1024;
const RENDER_DEBOUNCE_MS = 200;

type Mode = 'quad' | 'horizontal' | 'vertical';

const MODE_LABEL: Record<Mode, string> = {
  quad: '4분면 (상하·좌우 대칭)',
  horizontal: '좌우 대칭',
  vertical: '상하 대칭',
};

/**
 * 한 타일을 캔버스에 그린다. flipX/flipY 면 해당 축으로 반사한다.
 * 반사는 translate + scale(-1) 로 구현하며, 그린 뒤 변환을 복원한다.
 */
function drawTile(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  ox: number,
  oy: number,
  w: number,
  h: number,
  flipX: boolean,
  flipY: boolean,
): void {
  ctx.save();
  ctx.translate(ox + (flipX ? w : 0), oy + (flipY ? h : 0));
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.drawImage(bitmap, 0, 0, w, h);
  ctx.restore();
}

export default function ImageMirrorTilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('quad');
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 파일·모드 변경 시 디바운스 후 재처리. 이미지는 로드 이후에만 처리(하이드레이션 안전).
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => {
      void render(file);
    }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, mode]);

  async function render(source: File): Promise<void> {
    setBusy(true);
    setError(null);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(source);
      const w = bitmap.width;
      const h = bitmap.height;
      // 모드별 출력 크기: quad 는 2×2, 가로 대칭은 가로 2배, 세로 대칭은 세로 2배.
      const cols = mode === 'vertical' ? 1 : 2;
      const rows = mode === 'horizontal' ? 1 : 2;
      const outW = w * cols;
      const outH = h * rows;
      assertCanvasSize(outW, outH);

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');

      if (mode === 'horizontal') {
        // 원본 | 좌우반사
        drawTile(ctx, bitmap, 0, 0, w, h, false, false);
        drawTile(ctx, bitmap, w, 0, w, h, true, false);
      } else if (mode === 'vertical') {
        // 원본 / 상하반사
        drawTile(ctx, bitmap, 0, 0, w, h, false, false);
        drawTile(ctx, bitmap, 0, h, w, h, false, true);
      } else {
        // 만화경식 4분면: 원본 | 좌우 / 상하 | 양반사
        drawTile(ctx, bitmap, 0, 0, w, h, false, false);
        drawTile(ctx, bitmap, w, 0, w, h, true, false);
        drawTile(ctx, bitmap, 0, h, w, h, false, true);
        drawTile(ctx, bitmap, w, h, w, h, true, true);
      }

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))),
          'image/png',
        ),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '거울 타일 생성에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset(): void {
    setFile(null);
    setMode('quad');
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="거울 타일 만들기" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지를 좌우·상하로 반사 미러링해 만화경 같은 대칭 타일을 만듭니다.
          모든 처리는 브라우저 안에서 이루어집니다.
        </p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          title="이미지 1장을 끌어다 놓거나 클릭"
          maxBytes={MAX_BYTES}
        />

        {file && (
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <span className="text-xs font-medium text-muted-foreground">대칭 방향</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`h-10 rounded-lg border text-xs font-medium transition ${
                    mode === m
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {busy && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> 처리 중…
          </p>
        )}

        {previewUrl && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="거울 타일 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="mirror-tile.png"
              className={buttonVariants({ variant: 'default', className: 'w-full' })}
            >
              <Download className="h-4 w-4" aria-hidden /> PNG 다운로드
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
