'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  getStoredTheme,
  setTheme as applyTheme,
  subscribeTheme,
  type ThemeMode,
} from '@/lib/theme';
import { cn } from '@/lib/utils';

const MODES: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: '라이트', icon: Sun },
  { mode: 'dark', label: '다크', icon: Moon },
  { mode: 'system', label: '시스템', icon: Monitor },
];

/**
 * 테마 선택기(라이트/다크/시스템) — 부팅 스크립트와 같은 저장소(`theme.ts`,
 * 키 `acp:theme`)를 사용해 새로고침 후에도 일관되게 유지된다. `subscribeTheme`
 * 으로 레일 토글 등 다른 곳의 변경도 즉시 반영한다.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(getStoredTheme());
    return subscribeTheme((m) => setMode(m));
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="테마 선택"
      className="inline-flex items-center gap-0.5 rounded-lg border bg-background p-0.5"
    >
      {MODES.map(({ mode: m, label, icon: Icon }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} 테마`}
            title={`${label} 테마`}
            onClick={() => applyTheme(m)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
