'use client';

import { useMemo, useState } from 'react';
import { BarChart3, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TOOLS, CATEGORY_LABELS } from '@/lib/tools/registry';
import { clearRecent, clearUsageStats } from '@/lib/tools/usage';
import { useUsageStats } from '@/lib/hooks/useUsage';

const TOP_N = 10;

export default function SettingsPage() {
  const stats = useUsageStats();
  const [confirmClear, setConfirmClear] = useState(false);

  const topTools = useMemo(() => {
    const toolMap = new Map(TOOLS.map((t) => [t.id, t]));
    return Object.entries(stats)
      .map(([id, count]) => ({ tool: toolMap.get(id), count }))
      .filter((e): e is { tool: (typeof TOOLS)[number]; count: number } => !!e.tool)
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_N);
  }, [stats]);

  const totalUsage = Object.values(stats).reduce((s, n) => s + n, 0);
  const maxCount = topTools[0]?.count ?? 0;

  const handleClear = () => {
    clearUsageStats();
    clearRecent();
    setConfirmClear(false);
  };

  return (
    <div className="min-h-dvh bg-background pb-14 md:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <Settings2 className="h-5 w-5" />
          <h1 className="text-base font-semibold">설정</h1>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl space-y-4 p-4">
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            앱 설정
          </h2>
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">테마</p>
                <p className="text-[11px] text-muted-foreground">
                  인터페이스 색상
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        <section className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              내 사용 통계
            </h2>
            {totalUsage > 0 && (
              <span className="text-[11px] text-muted-foreground">총 {totalUsage}회</span>
            )}
          </div>

          {topTools.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center text-xs text-muted-foreground">
              아직 사용 기록이 없습니다.{' '}
              <a href="/tools" className="text-primary hover:underline">
                도구 둘러보기
              </a>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                자주 사용한 도구 Top {topTools.length}
              </p>
              <ul className="space-y-1.5">
                {topTools.map(({ tool, count }) => {
                  const Icon = tool.icon;
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <li key={tool.id}>
                      <a
                        href={tool.href}
                        className="flex items-center gap-2 rounded-lg border bg-background p-2 transition-colors hover:bg-muted"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{tool.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {CATEGORY_LABELS[tool.category]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold tabular-nums w-10 text-right">
                            {count}회
                          </span>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>

              {totalUsage > 0 && (
                <div className="pt-1">
                  {!confirmClear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      사용 기록 초기화
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground">정말 비울까요?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={handleClear}
                      >
                        예
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setConfirmClear(false)}
                      >
                        아니오
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-2 pt-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            정보
          </h2>
          <div className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Web Toolkit</strong> 은 브라우저
              안에서 완결되는 도구 모음입니다. 사용자가 올린 파일은 서버로
              전송되지 않으며, 모든 처리(압축·변환·OCR·AI)는 사용자의 기기에서
              수행됩니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
