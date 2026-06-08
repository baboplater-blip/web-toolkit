'use client';

import { useEffect, type ReactNode } from 'react';
import { Download } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { compressionRatio, formatBytes } from '@/lib/compress/format';

export interface ResultCardProps {
  fileName: string;
  /** 원본 크기(바이트). 압축류 도구는 처리 후 크기와 함께 감소율 비교에 사용 */
  originalSize: number;
  /** 처리(압축·변환·생성) 후 결과 크기(바이트) */
  compressedSize: number;
  blobUrl: string;
  /** 결과 카드 하단 보조 안내 한 줄(감소율과 별개) */
  extraInfo?: string;
  /**
   * 감소율 대신 보여줄 한 줄 설명(변환·생성류 도구용).
   * 지정 시 원본/처리후/감소율 비교 블록을 숨기고 결과 크기 + 이 문구만 표시한다.
   */
  metaText?: string;
  /** 다운로드 버튼 아래에 붙일 추가 액션 슬롯("이어가기" 등) */
  actions?: ReactNode;
}

/** 비교 표시가 의미 있으려면 양쪽 크기가 유효하고 실제로 줄어들어야 한다 */
function hasMeaningfulReduction(originalSize: number, compressedSize: number): boolean {
  return originalSize > 0 && compressedSize > 0 && compressedSize < originalSize;
}

export function ResultCard({
  fileName,
  originalSize,
  compressedSize,
  blobUrl,
  extraInfo,
  metaText,
  actions,
}: ResultCardProps) {
  // metaText 가 주어지면(변환·생성류) 비교를 숨긴다.
  // 아니면 실제 크기 감소가 있을 때만 원본/처리후/감소율 비교를 보여준다.
  const showComparison = metaText === undefined && hasMeaningfulReduction(originalSize, compressedSize);
  const ratio = showComparison ? compressionRatio(originalSize, compressedSize) : 0;

  // metaText 없이 양쪽 크기를 넘겼는데(=압축 의도) 줄지 않은 경우에만 안내.
  // 변환·생성류(metaText 지정)는 이 경고를 띄우지 않는다.
  const showNoReductionHint =
    metaText === undefined &&
    originalSize > 0 &&
    compressedSize > 0 &&
    !showComparison;

  // blobUrl 은 이 카드의 다운로드 대상이다. 카드가 언마운트되거나 새 결과로
  // blobUrl 이 바뀌면 직전 URL 을 폐기해 ObjectURL 누수를 막는다.
  // (다운로드 타깃이므로 언마운트 시 폐기해도 안전 — 소비자가 별도로 보관하지 않는다)
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        결과
      </h2>

      {showComparison ? (
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
            <p className="text-sm font-semibold mt-0.5 text-green-500">-{ratio}%</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">결과 크기</p>
          <p className="text-sm font-semibold mt-0.5">{formatBytes(compressedSize)}</p>
          {metaText && (
            <p className="text-[10px] text-muted-foreground mt-1">{metaText}</p>
          )}
        </div>
      )}

      {showNoReductionHint && (
        <p className="text-[10px] text-yellow-500/90 text-center">
          용량이 줄어들지 않았습니다. 다른 옵션을 시도해보세요.
        </p>
      )}

      {extraInfo && (
        <p className="text-[10px] text-muted-foreground text-center">{extraInfo}</p>
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

      {actions}
    </div>
  );
}
