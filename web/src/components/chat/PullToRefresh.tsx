'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  /** 새로고침 실행 함수. Promise 완료까지 인디케이터 유지. */
  onRefresh: () => void | Promise<void>;
  /** true 일 때만 pull 제스처 활성 — 스크롤 영역 상단에 있을 때 */
  enabled?: boolean;
}

/**
 * 상단으로 드래그하면 새로고침되는 모바일 관용 제스처.
 *
 * `body { overscroll-behavior-y: contain }` 때문에 브라우저 기본 pull-to-refresh 는 꺼져 있다.
 * 이 컴포넌트는 fixed 포지션 인디케이터를 제공하고, pointer 이벤트로 임계점(80px) 초과 시 onRefresh 실행.
 *
 * 데스크탑(마우스)에선 활성화되지 않는다 — `(pointer: coarse)` 미디어 쿼리 기반.
 */
export function PullToRefresh({ onRefresh, enabled = true }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isCoarseRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    isCoarseRef.current = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  }, []);

  useEffect(() => {
    if (!enabled || !isCoarseRef.current) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      // 문서 상단이 아니면 pull 시작하지 않음.
      if (window.scrollY > 0) return;
      // 스크롤 가능한 요소 안에서 터치가 시작되면서 그 요소가 상단이 아니면 skip.
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest<HTMLElement>('[data-scrollable], .overflow-y-auto, [data-radix-scroll-area-viewport]');
      if (scrollable && scrollable.scrollTop > 0) return;
      startYRef.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || refreshing) return;
      const dy = (e.touches[0]?.clientY ?? 0) - startYRef.current;
      if (dy <= 0) {
        setPullY(0);
        return;
      }
      // 저항감 — 드래그할수록 느리게 따라오게.
      const damped = Math.min(120, dy * 0.5);
      setPullY(damped);
    };

    const onTouchEnd = async () => {
      if (startYRef.current === null) return;
      const final = pullY;
      startYRef.current = null;
      if (final >= 80) {
        setRefreshing(true);
        try {
          await Promise.resolve(onRefresh());
        } finally {
          setRefreshing(false);
          setPullY(0);
        }
      } else {
        setPullY(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, pullY, onRefresh, refreshing]);

  if (pullY === 0 && !refreshing) return null;

  const progress = Math.min(1, pullY / 80);
  return (
    <div
      className="fixed left-1/2 top-0 z-[100] -translate-x-1/2 pointer-events-none"
      style={{
        transform: `translate(-50%, ${Math.min(pullY - 40, 40)}px)`,
      }}
      aria-hidden="true"
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 shadow-lg',
          refreshing && 'text-primary',
          !refreshing && progress >= 1 && 'text-primary',
          !refreshing && progress < 1 && 'text-muted-foreground',
        )}
      >
        <RefreshCw
          className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')}
          style={{
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        />
        <span className="text-[11px] font-medium">
          {refreshing ? '새로고침 중...' : progress >= 1 ? '놓으면 새로고침' : '아래로 당겨 새로고침'}
        </span>
      </div>
    </div>
  );
}
