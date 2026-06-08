'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface DDayItem {
  id: string;
  label: string;
  date: string;
}

const STORAGE_KEY = 'webtoolkit:dday:items';

function parseDate(s: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayDate(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysFromToday(target: Date): number {
  const t = todayDate();
  return Math.round((target.getTime() - t.getTime()) / 86_400_000);
}

function formatDDay(days: number): { label: string; color: string } {
  if (days === 0) return { label: 'D-DAY', color: 'text-primary' };
  if (days > 0) return { label: `D-${days}`, color: 'text-foreground' };
  return { label: `D+${-days}`, color: 'text-muted-foreground' };
}

function formatKoreanDate(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function weekdayLabel(d: Date): string {
  return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + '요일';
}

export default function DDayPage() {
  const [items, setItems] = useState<DDayItem[]>([]);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* noop */
    }
  }, [items]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = parseDate(a.date);
      const db = parseDate(b.date);
      if (!da || !db) return 0;
      const ta = daysFromToday(da);
      const tb = daysFromToday(db);
      const aPast = ta < 0;
      const bPast = tb < 0;
      if (aPast !== bPast) return aPast ? 1 : -1;
      return ta - tb;
    });
  }, [items]);

  const previewDays = useMemo(() => {
    const d = parseDate(date);
    if (!d) return null;
    return daysFromToday(d);
  }, [date]);

  const add = () => {
    const d = parseDate(date);
    if (!label.trim() || !d) return;
    const item: DDayItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: label.trim(),
      date,
    };
    setItems((prev) => [...prev, item]);
    setLabel('');
    setDate('');
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // 입력 중인 이벤트 이름·날짜만 초기화 (저장된 목록은 유지).
  const resetInput = () => {
    setLabel('');
    setDate('');
  };

  const copyItem = async (item: DDayItem) => {
    const d = parseDate(item.date);
    if (!d) return;
    const days = daysFromToday(d);
    const { label: ddLabel } = formatDDay(days);
    const txt = `${item.label} — ${ddLabel} (${formatKoreanDate(d)} ${weekdayLabel(d)})`;
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(item.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  };

  const presets = [
    { label: '내년 신정', value: `${new Date().getFullYear() + 1}-01-01` },
    { label: '크리스마스', value: `${new Date().getFullYear()}-12-25` },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="D-day 계산기"
        onReset={label || date ? resetInput : undefined}
      />

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            새 D-day 추가
          </h2>
          <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
            <Input
              placeholder="이벤트 이름 (예: 시험일, 결혼식)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              aria-label="이벤트 이름"
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="이벤트 날짜"
            />
            <Button
              onClick={add}
              disabled={!label.trim() || !parseDate(date)}
              className="sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </div>
          {previewDays !== null && (
            <div className="rounded-lg border bg-background p-3 text-sm">
              <span className="text-muted-foreground mr-2">미리보기:</span>
              <strong className={formatDDay(previewDays).color}>
                {formatDDay(previewDays).label}
              </strong>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDate(p.value)}
                className="text-[11px] rounded-full border px-2 py-0.5 hover:bg-muted"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {sortedItems.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              저장된 D-day ({sortedItems.length}개)
            </h2>
            <Separator />
            <ul className="space-y-1.5">
              {sortedItems.map((item) => {
                const d = parseDate(item.date);
                if (!d) return null;
                const days = daysFromToday(d);
                const { label: dd, color } = formatDDay(days);
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-background p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatKoreanDate(d)} · {weekdayLabel(d)}
                      </p>
                    </div>
                    <span className={`text-lg font-bold tabular-nums ${color}`}>
                      {dd}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyItem(item)}
                        aria-label="복사"
                        title="복사"
                      >
                        {copied === item.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => remove(item.id)}
                        aria-label="삭제"
                        title="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">D-N</strong>: N일 후 도래 ·{' '}
            <strong className="text-foreground">D-DAY</strong>: 오늘 ·{' '}
            <strong className="text-foreground">D+N</strong>: N일 지남.
          </p>
          <p className="mt-1.5">데이터는 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
        </div>
      </main>
    </div>
  );
}
