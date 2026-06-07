'use client';

import { useEffect, useRef, useState } from 'react';
import { Scaling, Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerDownload, stripExtension } from '@/lib/tools/file-utils';

type OutputFormat = 'jpeg' | 'webp';

const MAX_ITERATIONS = 10;

function encode(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))),
      `image/${format}`,
      quality,
    );
  });
}

/**
 * 목표 바이트 이하가 되도록 품질을 이분 탐색한다.
 * 최저 품질에서도 목표를 못 맞추면 그 결과(가장 작은 것)를 반환한다.
 */
async function searchQuality(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  targetBytes: number,
): Promise<{ blob: Blob; quality: number }> {
  let low = 0.05;
  let high = 1;
  let best: { blob: Blob; quality: number } | null = null;
  let smallest: { blob: Blob; quality: number } | null = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const blob = await encode(canvas, format, mid);

    if (!smallest || blob.size < smallest.blob.size) {
      smallest = { blob, quality: mid };
    }

    if (blob.size <= targetBytes) {
      // 목표 이하 — 더 높은 품질을 시도해 목표에 최대한 근접
      best = { blob, quality: mid };
      low = mid;
    } else {
      high = mid;
    }
  }

  return best ?? smallest ?? { blob: await encode(canvas, format, low), quality: low };
}

export default function ImageTargetSizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [targetKb, setTargetKb] = useState('200');
  const [format, setFormat] = useState<OutputFormat>('jpeg');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; quality: number } | null>(null);
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
    setResult(null);
    try {
      const bmp = await createImageBitmap(picked);
      bitmap?.close();
      setBitmap(bmp);
      setFile(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드에 실패했습니다.');
    }
  }

  async function run() {
    if (!bitmap) return;
    const kb = Number(targetKb);
    if (!Number.isFinite(kb) || kb <= 0) {
      setError('목표 용량을 1KB 이상으로 입력하세요.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvasRef.current = canvas;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
      // JPEG/WebP 모두 흰 배경으로 플랫(JPEG 는 알파 미지원)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);

      const found = await searchQuality(canvas, format, kb * 1024);
      setResult(found);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(found.blob));

      if (found.blob.size > kb * 1024) {
        setError('최저 품질에서도 목표 용량보다 큽니다. 가능한 가장 작은 결과를 표시합니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const ext = format === 'jpeg' ? 'jpg' : 'webp';
    triggerDownload(result.blob, `${stripExtension(file.name)}-${targetKb}kb.${ext}`);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Scaling className="h-5 w-5 text-primary" aria-hidden />
          목표 용량 리사이즈
        </h1>
        <p className="text-sm text-muted-foreground">원하는 파일 크기(예: 200KB)에 맞춰 이미지 품질을 자동 조정합니다.</p>
      </header>

      {!file && <FileDropZone accept="image/*" onFiles={handleFiles} onError={setError} />}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {file && bitmap && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium">목표 용량 (KB)</span>
            <Input
              type="number"
              min={1}
              value={targetKb}
              onChange={(e) => setTargetKb(e.target.value)}
              placeholder="200"
              aria-label="목표 용량 KB"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium">출력 포맷</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['jpeg', 'webp'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  disabled={processing}
                  className={`h-9 rounded-md border text-xs transition-colors disabled:opacity-50 ${
                    format === f
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={run} disabled={processing}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Scaling className="h-4 w-4" />}
            목표 용량 맞추기
          </Button>
        </div>
      )}

      {result && previewUrl && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="결과" className="max-h-[50vh] max-w-full object-contain" />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            최종 용량: {(result.blob.size / 1024).toFixed(1)} KB · 품질 {Math.round(result.quality * 100)}%
          </p>
          <Button className="w-full" onClick={download}>
            <Download className="h-4 w-4" />
            다운로드
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
