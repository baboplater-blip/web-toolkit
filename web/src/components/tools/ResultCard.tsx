'use client';

import { Download } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { compressionRatio, formatBytes } from '@/lib/compress/format';

export interface ResultCardProps {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  blobUrl: string;
  extraInfo?: string;
}

export function ResultCard({
  fileName,
  originalSize,
  compressedSize,
  blobUrl,
  extraInfo,
}: ResultCardProps) {
  const ratio = compressionRatio(originalSize, compressedSize);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        결과
      </h2>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground">원본</p>
          <p className="text-sm font-semibold mt-0.5">{formatBytes(originalSize)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">처리 후</p>
          <p className="text-sm font-semibold mt-0.5">{formatBytes(compressedSize)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">감소율</p>
          <p
            className={`text-sm font-semibold mt-0.5 ${
              ratio > 0 ? 'text-green-500' : 'text-yellow-500'
            }`}
          >
            {ratio > 0 ? `-${ratio}%` : '0%'}
          </p>
        </div>
      </div>

      {extraInfo && (
        <p className="text-[10px] text-muted-foreground text-center">{extraInfo}</p>
      )}

      {ratio === 0 && (
        <p className="text-[10px] text-yellow-500/90 text-center">
          용량이 줄어들지 않았습니다. 다른 옵션을 시도해보세요.
        </p>
      )}

      <a
        href={blobUrl}
        download={fileName}
        aria-label={`${fileName} 다운로드`}
        className={buttonVariants({ variant: 'default', className: 'w-full' })}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {fileName} 다운로드
      </a>
    </div>
  );
}
