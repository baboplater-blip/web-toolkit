'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Layers, Search, Settings2, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getStoredTheme,
  setTheme,
  subscribeTheme,
  type ThemeMode,
} from '@/lib/theme';

const TABS = [
  { href: '/tools', icon: LayoutGrid, label: '도구', match: /^\/tools/ },
  { href: '/settings', icon: Settings2, label: '설정', match: /^\/settings/ },
] as const;

const HIDDEN_PATHS = [/^\/api\//];

function openPalette() {
  window.dispatchEvent(new CustomEvent('webtoolkit:open-palette'));
}

function openCategoryDrawer() {
  window.dispatchEvent(new CustomEvent('webtoolkit:open-category-drawer'));
}

/**
 * 데스크탑 레일용 테마 토글 버튼 — `lib/theme.ts` 의 공식 API(setTheme /
 * getStoredTheme, 키 `acp:theme`, `<html>.dark` 클래스)를 그대로 사용해
 * THEME_BOOT_SCRIPT · ThemeWatcher 와 100% 일치한다. 'system' 모드는
 * 현재 해상도(dark/light)를 뒤집어 명시적 모드로 전환한다.
 */
function RailThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(getStoredTheme());
    const unsubscribe = subscribeTheme(setMode);
    return unsubscribe;
  }, []);

  const isDark =
    mode === 'dark' ||
    (mode === 'system' &&
      typeof window !== 'undefined' &&
      document.documentElement.classList.contains('dark'));

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="테마 전환"
      aria-label="테마 전환"
      className="flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {isDark ? (
        <Sun className="h-5 w-5" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}

export function BottomNav() {
  const pathname = usePathname() ?? '';
  if (HIDDEN_PATHS.some((p) => p.test(pathname))) return null;

  const toolsActive = /^\/tools/.test(pathname);
  const settingsActive = /^\/settings/.test(pathname);

  return (
    <>
      {/* 모바일: 하단 탭바 — 도구 / 카테고리 / 검색 / 설정 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="주요 내비게이션"
      >
        <ul className="flex h-14">
          <li className="flex-1">
            <a
              href="/tools"
              aria-current={toolsActive ? 'page' : undefined}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-0.5 transition-colors',
                toolsActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid
                className="h-5 w-5"
                strokeWidth={toolsActive ? 2.25 : 2}
              />
              <span className={cn('text-[11px]', toolsActive && 'font-semibold')}>
                도구
              </span>
            </a>
          </li>
          <li className="flex-1">
            <button
              type="button"
              onClick={openCategoryDrawer}
              aria-label="카테고리 둘러보기 열기"
              className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Layers className="h-5 w-5" strokeWidth={2} />
              <span className="text-[11px]">카테고리</span>
            </button>
          </li>
          <li className="flex-1">
            <button
              type="button"
              onClick={openPalette}
              aria-label="도구 검색 열기"
              className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="h-5 w-5" strokeWidth={2} />
              <span className="text-[11px]">검색</span>
            </button>
          </li>
          <li className="flex-1">
            <a
              href="/settings"
              aria-current={settingsActive ? 'page' : undefined}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-0.5 transition-colors',
                settingsActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Settings2
                className="h-5 w-5"
                strokeWidth={settingsActive ? 2.25 : 2}
              />
              <span
                className={cn('text-[11px]', settingsActive && 'font-semibold')}
              >
                설정
              </span>
            </a>
          </li>
        </ul>
      </nav>

      {/* 데스크탑: 좌측 아이콘 레일 — 도구 / 검색 / 카테고리 / 설정 / 테마 */}
      <nav
        className="fixed left-0 top-0 bottom-0 z-40 hidden w-16 flex-col items-center border-r bg-background py-3 md:flex"
        aria-label="주요 내비게이션"
      >
        <ul className="flex flex-1 flex-col gap-1">
          {TABS.slice(0, 1).map(({ href, icon: Icon, label, match }) => {
            const active = match.test(pathname);
            return (
              <li key={href}>
                <a
                  href={href}
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
                  <span
                    className={cn('mt-0.5 text-[10px]', active && 'font-semibold')}
                  >
                    {label}
                  </span>
                </a>
              </li>
            );
          })}

          {/* 검색 버튼 */}
          <li>
            <button
              type="button"
              onClick={openPalette}
              title="도구 검색 (Ctrl+K)"
              aria-label="도구 검색 열기 (Ctrl+K)"
              className="flex h-12 w-12 flex-col items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="h-5 w-5" strokeWidth={2} />
              <span className="mt-0.5 text-[10px]">검색</span>
            </button>
          </li>

          {/* 카테고리 버튼 */}
          <li>
            <button
              type="button"
              onClick={openCategoryDrawer}
              title="카테고리 둘러보기"
              aria-label="카테고리 둘러보기 열기"
              className="flex h-12 w-12 flex-col items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Layers className="h-5 w-5" strokeWidth={2} />
              <span className="mt-0.5 text-[10px]">카테고리</span>
            </button>
          </li>

          {TABS.slice(1).map(({ href, icon: Icon, label, match }) => {
            const active = match.test(pathname);
            return (
              <li key={href}>
                <a
                  href={href}
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
                  <span
                    className={cn('mt-0.5 text-[10px]', active && 'font-semibold')}
                  >
                    {label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* 레일 하단: 테마 토글 */}
        <RailThemeToggle />
      </nav>
    </>
  );
}
