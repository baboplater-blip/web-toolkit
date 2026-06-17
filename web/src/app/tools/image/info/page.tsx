'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { loadBitmap } from '@/lib/tools/image-common';

interface ImageInfo {
  name: string;
  width: number;
  height: number;
  ratio: string;
  mime: string;
  sizeText: string;
  megapixels: string;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** 너비:높이의 기약 비율 문자열. 0 이하면 '-'. */
function aspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return '-';
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/** 바이트를 KB/MB 단위 사람이 읽는 문자열로. */
function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function ImageInfoPage() {
  const [items, setItems] = useState<ImageInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 언마운트 후 비동기 처리 결과의 setState 를 막는 가드.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  async function handleFiles(files: File[]) {
    setError(null);
    setBusy(true);
    setItems([]);
    try {
      const results: ImageInfo[] = [];
      for (const file of files) {
        let bitmap: ImageBitmap | null = null;
        try {
          bitmap = await loadBitmap(file);
          const { width, height } = bitmap;
          results.push({
            name: file.name,
            width,
            height,
            ratio: aspectRatio(width, height),
            mime: file.type || '알 수 없음',
            sizeText: formatSize(file.size),
            megapixels: ((width * height) / 1_000_000).toFixed(2),
          });
        } catch {
          results.push({
            name: file.name,
            width: 0,
            height: 0,
            ratio: '-',
            mime: file.type || '알 수 없음',
            sizeText: formatSize(file.size),
            megapixels: '-',
          });
        } finally {
          if (bitmap) bitmap.close();
        }
      }
      if (mountedRef.current) setItems(results);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : '이미지 정보를 읽지 못했습니다.');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  function handleReset() {
    setItems([]);
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 정보 보기" widthClass="max-w-2xl" onReset={items.length > 0 ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지의 크기·비율·포맷·용량·메가픽셀을 빠르게 확인합니다. 여러 장을 한 번에 볼 수 있습니다.
        </p>

        <FileDropZone
          accept="image/*"
          multiple
          onFiles={handleFiles}
          onError={setError}
          title="이미지를 끌어다 놓거나 클릭(여러 장 가능)"
          maxBytes={50 * 1024 * 1024}
        />

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {busy && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> 읽는 중…
          </p>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="rounded-xl border bg-card p-4 space-y-2">
                <p className="truncate text-sm font-medium" title={item.name}>{item.name}</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                  <InfoRow label="너비" value={item.width > 0 ? `${item.width}px` : '-'} />
                  <InfoRow label="높이" value={item.height > 0 ? `${item.height}px` : '-'} />
                  <InfoRow label="비율" value={item.ratio} />
                  <InfoRow label="포맷" value={item.mime} />
                  <InfoRow label="용량" value={item.sizeText} />
                  <InfoRow label="메가픽셀" value={item.megapixels === '-' ? '-' : `${item.megapixels} MP`} />
                </dl>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  );
}
