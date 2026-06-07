'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleUserRound, Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { triggerDownload, stripExtension } from '@/lib/tools/file-utils';

const SIZE_OPTIONS = [128, 256, 512, 1024] as const;
type AvatarSize = (typeof SIZE_OPTIONS)[number];

export default function AvatarCropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [size, setSize] = useState<AvatarSize>(256);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => () => bitmap?.close(), [bitmap]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFiles(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResultBlob(null);
    try {
      const bmp = await createImageBitmap(picked);
      bitmap?.close();
      setBitmap(bmp);
      setFile(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드에 실패했습니다.');
    }
  }

  async function render(target: AvatarSize) {
    if (!bitmap) return;
    setProcessing(true);
    setError(null);
    try {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvasRef.current = canvas;
      canvas.width = target;
      canvas.height = target;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

      ctx.clearRect(0, 0, target, target);

      // 원형 클립
      ctx.save();
      ctx.beginPath();
      ctx.arc(target / 2, target / 2, target / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // 중앙 정사각 크롭: 짧은 변 기준으로 소스 영역 선택
      const side = Math.min(bitmap.width, bitmap.height);
      const sx = (bitmap.width - side) / 2;
      const sy = (bitmap.height - side) / 2;
      ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target);
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다.'))),
          'image/png',
        );
      });
      setResultBlob(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : '아바타 생성 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function selectSize(target: AvatarSize) {
    setSize(target);
    void render(target);
  }

  function download() {
    if (!resultBlob || !file) return;
    triggerDownload(resultBlob, `${stripExtension(file.name)}-avatar-${size}.png`);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <CircleUserRound className="h-5 w-5 text-primary" aria-hidden />
          원형 아바타 크롭
        </h1>
        <p className="text-sm text-muted-foreground">이미지를 원형으로 잘라 프로필 사진용 투명 PNG로 저장합니다.</p>
      </header>

      {!file && <FileDropZone accept="image/*" onFiles={handleFiles} onError={setError} />}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {file && bitmap && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div>
            <span className="mb-1.5 block text-xs font-medium">출력 크기</span>
            <div className="grid grid-cols-4 gap-1.5">
              {SIZE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectSize(s)}
                  disabled={processing}
                  className={`h-10 rounded-md border text-xs transition-colors disabled:opacity-50 ${
                    size === s
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          {processing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              생성 중...
            </div>
          )}
        </div>
      )}

      {previewUrl && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-center rounded-lg border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="아바타 결과" className="max-h-[50vh] max-w-full object-contain" />
          </div>
          <Button className="w-full" onClick={download} disabled={!resultBlob}>
            <Download className="h-4 w-4" />
            투명 PNG 다운로드
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
