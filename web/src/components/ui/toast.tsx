'use client';

import { useEffect, useState } from 'react';

/**
 * 의존성 없이 동작하는 최소 토스트.
 * - 모듈 상단의 pub/sub 로 어디서든 `toast(...)` 호출 가능
 * - <ToastHost /> 를 레이아웃에 한 번 마운트
 */

type Variant = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: string;
  message: string;
  variant: Variant;
  duration: number;
}

type Listener = (items: ToastItem[]) => void;

let queue: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(queue);
}

export function toast(
  message: string,
  opts: { variant?: Variant; duration?: number; id?: string } = {},
) {
  const id = opts.id ?? `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const duration = opts.duration ?? 4000;
  const variant = opts.variant ?? 'info';

  // 같은 id 가 이미 있으면 교체 (예: 같은 채널 재연결 실패 연속 알림 억제)
  queue = [...queue.filter((t) => t.id !== id), { id, message, variant, duration }];
  emit();

  if (duration > 0) {
    setTimeout(() => {
      queue = queue.filter((t) => t.id !== id);
      emit();
    }, duration);
  }
  return id;
}

export function dismissToast(id: string) {
  queue = queue.filter((t) => t.id !== id);
  emit();
}

const variantClasses: Record<Variant, string> = {
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
};

export function ToastHost() {
  // SSR/CSR 일치를 위해 항상 빈 배열로 시작한다. 모듈 싱글톤 queue 를 초기값으로
  // 쓰면 mount 전에 toast() 가 호출됐을 때 서버(빈)와 클라이언트(채워짐) 마크업이
  // 어긋나 hydration mismatch 가 난다. 실제 큐는 mount 이펙트에서 seed.
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const l: Listener = (next) => setItems(next);
    listeners.add(l);
    // 마운트 시점에 이미 쌓여 있던 토스트를 즉시 반영.
    setItems(queue);
    return () => {
      listeners.delete(l);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed z-[100] left-1/2 -translate-x-1/2 top-3 md:top-auto md:bottom-6 flex flex-col gap-2 max-w-[92vw] w-[360px]"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg border backdrop-blur px-3 py-2 text-xs shadow-lg ${variantClasses[t.variant]}`}
          role={t.variant === 'error' ? 'alert' : 'status'}
          aria-atomic="true"
        >
          <div className="flex items-start gap-2">
            <span className="flex-1 leading-snug break-words">{t.message}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-[11px] opacity-70 hover:opacity-100"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
