import { cn } from '@/lib/utils';

export type AdSlotSize = 'top' | 'sidebar';

interface AdSlotProps {
  size: AdSlotSize;
  /** 외부 컨테이너에 추가 클래스 */
  className?: string;
  /** AdSense 데이터 슬롯 id (미설정 시 placeholder) */
  slotId?: string;
}

/**
 * 광고 슬롯 자리.
 *
 * 현재는 placeholder. 운영 단계에서 AdSense 등 광고 네트워크 코드를
 * 이 컴포넌트 내부에서 dangerouslySetInnerHTML 또는 <ins> 태그로 삽입한다.
 *
 *   size='top'      : 가로 배너 (모든 화면, ~728×90 / 970×90)
 *   size='sidebar'  : 세로 배너 (xl 화면만, 160×600 / 300×600)
 *
 * 미션 1원칙(사용자 파일 서버 미전송) 과는 무관 — 광고 스크립트는 외부 호출이
 * 허용되는 영역이므로 운영 시 명시적으로 추가.
 */
export function AdSlot({ size, className, slotId }: AdSlotProps) {
  const isTop = size === 'top';
  const dims = isTop ? '728 × 90' : '160 × 600';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground',
        isTop
          ? 'mx-auto w-full max-w-[970px] h-[90px] min-h-[60px]'
          : 'w-[160px] h-[600px]',
        className,
      )}
      data-ad-slot={slotId ?? 'placeholder'}
      aria-label="광고 영역"
    >
      <div className="text-center text-[10px] leading-tight select-none">
        <p className="font-medium">광고 영역</p>
        <p className="opacity-60">{dims}</p>
      </div>
    </div>
  );
}
