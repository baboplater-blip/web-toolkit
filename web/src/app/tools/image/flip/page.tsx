'use client';

import { useEffect, useState } from 'react';
import { FlipHorizontal2, FlipVertical2, Download, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';

type FlipAxis = 'horizontal' | 'vertical';

async function flipImage(bitmap: ImageBitmap, axis: FlipAxis): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

  if (axis === 'horizontal') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(bitmap, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('PNG 인코딩에 실패했습니다.');
  return blob;
}

export default function ImageFlipPage() {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [fileName, setFileName] = useState('image');
  const [axis, setAxis] = useState<FlipAxis>('horizontal');
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => bitmap?.close(), [bitmap]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function clearResult() {
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('이미지 파일을 업로드해주세요.');
      return;
    }
    setError(null);
    clearResult();
    try {
      const next = await createImageBitmap(file);
      setBitmap((prev) => {
        prev?.close();
        return next;
      });
      const dot = file.name.lastIndexOf('.');
      setFileName(dot > 0 ? file.name.slice(0, dot) : file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 로드에 실패했습니다.');
    }
  }

  async function handleFlip() {
    if (!bitmap) return;
    setError(null);
    setProcessing(true);
    clearResult();
    try {
      const blob = await flipImage(bitmap, axis);
      setResult({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      setError(e instanceof Error ? e.message : '반전 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <FlipHorizontal2 className="h-5 w-5 text-primary" aria-hidden />
          이미지 반전
        </h1>
        <p className="text-sm text-muted-foreground">이미지를 좌우 또는 상하로 뒤집어 저장합니다.</p>
      </header>

      {!bitmap && (
        <FileDropZone
          accept="image/*"
          onFiles={handleFiles}
          onError={setError}
          description="반전할 이미지를 올려주세요."
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
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium">반전 방향</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['horizontal', '좌우 반전', FlipHorizontal2],
                  ['vertical', '상하 반전', FlipVertical2],
                ] as const
              ).map(([value, label, Icon]) => (
                <label
                  key={value}
                  className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border text-sm transition-colors ${
                    axis === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="flip-axis"
                    value={value}
                    checked={axis === value}
                    onChange={() => {
                      setAxis(value);
                      clearResult();
                    }}
                    className="sr-only"
                  />
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <Button onClick={handleFlip} disabled={processing}>
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            반전 적용
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            결과
          </h2>
          <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt="반전 결과"
              className="max-h-[50vh] max-w-full object-contain"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => triggerDownload(result.blob, `${fileName}-flipped.png`)}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            PNG 다운로드
          </Button>
        </div>
      )}
    </main>
  );
}
