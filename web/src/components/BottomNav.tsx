'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { MessageSquare, LayoutDashboard, LayoutGrid, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getOverallStatus,
  subscribeRealtimeStatus,
  type OverallState,
} from '@/lib/realtime-status';
import { useOutbox } from '@/lib/hooks/useOutbox';

const SUBSCRIBE = (fn: () => void) => subscribeRealtimeStatus(fn);
const GET_STATE = (): OverallState => getOverallStatus();
const GET_SERVER = (): OverallState => 'idle';

const TABS = [
  { href: '/chat', icon: MessageSquare, label: '채팅', match: /^\/chat/ },
  { href: '/dashboard', icon: LayoutDashboard, label: '현황', match: /^\/dashboard/ },
  { href: '/tools', icon: LayoutGrid, label: '도구', match: /^\/tools/ },
  { href: '/settings', icon: Settings2, label: '설정', match: /^\/(settings|harnesses)/ },
] as const;

const HIDDEN_PATHS = [/^\/login/, /^\/api\//];

export function BottomNav() {
  const pathname = usePathname() ?? '';
  const rtState = useSyncExternalStore(SUBSCRIBE, GET_STATE, GET_SERVER);
  const outbox = useOutbox();
  if (HIDDEN_PATHS.some((p) => p.test(pathname))) return null;

  const settingsNeedsAttention = rtState === 'reconnecting' || outbox.failedCount > 0;
  const chatNeedsAttention = outbox.pendingCount > 0;

  return (
    <>
      {/* 모바일: 하단 탭바 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="주요 내비게이션"
      >
        <ul className="flex h-14">
          {TABS.map(({ href, icon: Icon, label, match }) => {
            const active = match.test(pathname);
            const showDot =
              (href === '/settings' && settingsNeedsAttention) ||
              (href === '/chat' && chatNeedsAttention);
            const dotColor = href === '/chat' ? 'bg-sky-500' : 'bg-amber-500';
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-full w-full flex-col items-center justify-center gap-0.5 transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
                    {showDot && (
                      <span
                        className={cn(
                          'absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-background animate-pulse',
                          dotColor,
                        )}
                        aria-label={href === '/chat' ? '대기 중인 메시지' : '주의 필요'}
                      />
                    )}
                  </span>
                  <span className={cn('text-[11px]', active && 'font-semibold')}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 데스크탑: 좌측 아이콘 레일 */}
      <nav
        className="fixed left-0 top-0 bottom-0 z-40 hidden w-16 flex-col items-center border-r bg-background py-3 md:flex"
        aria-label="주요 내비게이션"
      >
        <ul className="flex flex-col gap-1">
          {TABS.map(({ href, icon: Icon, label, match }) => {
            const active = match.test(pathname);
            const showDot =
              (href === '/settings' && settingsNeedsAttention) ||
              (href === '/chat' && chatNeedsAttention);
            const dotColor = href === '/chat' ? 'bg-sky-500' : 'bg-amber-500';
            return (
              <li key={href}>
                <Link
                  href={href}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  title={label}
                  className={cn(
                    'flex h-12 w-12 flex-col items-center justify-center rounded-lg transition-colors relative',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
                  {showDot && (
                    <span
                      className={cn(
                        'absolute top-1.5 right-2 h-2 w-2 rounded-full ring-2 ring-background animate-pulse',
                        dotColor,
                      )}
                      aria-label={href === '/chat' ? '대기 중인 메시지' : '주의 필요'}
                    />
                  )}
                  <span
                    className={cn(
                      'mt-0.5 text-[10px]',
                      active && 'font-semibold',
                    )}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
