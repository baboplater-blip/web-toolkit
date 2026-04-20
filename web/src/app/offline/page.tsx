'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw, Inbox, Archive } from 'lucide-react';

/**
 * 완전 오프라인 상태에서 Service Worker 가 네비게이션 요청에 실패했을 때 fallback 으로 보여주는 페이지.
 * 이미 캐시된 대화는 채팅 탭이 IDB 스냅샷으로 그대로 노출되므로, 여기서는 "무엇을 할 수 있는지" 안내.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
          <WifiOff className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">오프라인 상태입니다</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            네트워크 연결이 끊어진 것 같아요. 연결이 돌아오면 이 화면은 자동으로 사라집니다.
          </p>
        </div>

        <div className="space-y-2 text-left">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            지금 할 수 있는 것
          </p>
          <Link
            href="/chat"
            className="flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted"
          >
            <Archive className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">최근 대화 열람</p>
              <p className="text-[11px] text-muted-foreground">
                캐시된 대화는 오프라인에서도 읽을 수 있습니다.
              </p>
            </div>
          </Link>
          <Link
            href="/settings?tab=outbox"
            className="flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted"
          >
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">대기 중인 메시지 확인</p>
              <p className="text-[11px] text-muted-foreground">
                복귀 시 자동 전송되는 오프라인 큐를 살펴보세요.
              </p>
            </div>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </button>
      </div>
    </div>
  );
}
