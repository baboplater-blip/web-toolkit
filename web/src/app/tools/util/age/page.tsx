'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, Check, Copy } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface AgeResult {
  /** 만 나이 (생일 지났는지 따짐) */
  full: number;
  /** 연 나이 (한국 병역·교육법 기준 = 현재 연도 − 출생 연도) */
  year: number;
  /** 세는 나이 (한국 전통 = 만 + 1 또는 만 + 2, 해 바뀔 때마다 +1) */
  korean: number;
  /** 총 살아온 일수 */
  totalDays: number;
  /** 다음 생일까지 남은 일수 */
  daysToNextBirthday: number;
  /** 100일·1000일·10000일 단위 다음 마일스톤 */
  milestones: Array<{ label: string; date: Date; daysAway: number }>;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const yi = Number(y);
  const moi = Number(mo);
  const di = Number(d);
  if (moi < 1 || moi > 12 || di < 1 || di > 31) return null;
  const date = new Date(yi, moi - 1, di);
  if (
    date.getFullYear() !== yi ||
    date.getMonth() !== moi - 1 ||
    date.getDate() !== di
  ) {
    return null;
  }
  return date;
}

function todayDate(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86_400_000);
}

function computeAge(birth: Date, ref: Date): AgeResult {
  let full = ref.getFullYear() - birth.getFullYear();
  const birthdayThisYear = new Date(
    ref.getFullYear(),
    birth.getMonth(),
    birth.getDate(),
  );
  if (ref < birthdayThisYear) full -= 1;

  const year = ref.getFullYear() - birth.getFullYear();
  const korean = year + 1;

  const totalDays = daysBetween(birth, ref);

  let nextBirthday = birthdayThisYear;
  if (ref >= birthdayThisYear) {
    nextBirthday = new Date(
      ref.getFullYear() + 1,
      birth.getMonth(),
      birth.getDate(),
    );
  }
  const daysToNextBirthday = daysBetween(ref, nextBirthday);

  const milestoneSteps = [100, 1000, 10_000, 20_000, 30_000];
  const milestones: AgeResult['milestones'] = [];
  for (const step of milestoneSteps) {
    const next = Math.ceil((totalDays + 1) / step) * step;
    if (next === totalDays) continue;
    const date = new Date(birth);
    date.setDate(date.getDate() + next);
    milestones.push({
      label: `${next.toLocaleString()}일`,
      date,
      daysAway: next - totalDays,
    });
  }

  return {
    full,
    year,
    korean,
    totalDays,
    daysToNextBirthday,
    milestones,
  };
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatKoreanDate(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function AgeCalculatorPage() {
  const [birthInput, setBirthInput] = useState('');
  const [refInput, setRefInput] = useState(formatYmd(todayDate()));
  const [copied, setCopied] = useState(false);

  const birth = useMemo(() => parseDate(birthInput), [birthInput]);
  const ref = useMemo(() => parseDate(refInput), [refInput]);

  const result = useMemo(() => {
    if (!birth || !ref) return null;
    if (ref < birth) return null;
    return computeAge(birth, ref);
  }, [birth, ref]);

  const copyAll = async () => {
    if (!result || !birth || !ref) return;
    const txt = [
      `생일: ${formatKoreanDate(birth)}`,
      `기준일: ${formatKoreanDate(ref)}`,
      `만 나이: ${result.full}세`,
      `연 나이: ${result.year}세 (한국 법정 일부 적용)`,
      `세는 나이: ${result.korean}세 (한국 전통)`,
      `총 살아온 일: ${result.totalDays.toLocaleString()}일`,
      `다음 생일까지: ${result.daysToNextBirthday.toLocaleString()}일`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'h-8 w-8',
              })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <CalendarClock className="h-5 w-5" />
            <h1 className="font-semibold text-base">나이 계산기</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium block" htmlFor="birth-date">
                생년월일
              </label>
              <Input
                id="birth-date"
                type="date"
                value={birthInput}
                onChange={(e) => setBirthInput(e.target.value)}
                aria-label="생년월일"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium block" htmlFor="ref-date">
                기준일 (오늘이 기본)
              </label>
              <Input
                id="ref-date"
                type="date"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                aria-label="기준일"
              />
            </div>
          </div>

          {birthInput && !birth && (
            <p className="text-xs text-destructive">
              생년월일 형식이 잘못됐습니다 (예: 1990-03-15)
            </p>
          )}
          {birth && ref && ref < birth && (
            <p className="text-xs text-destructive">
              기준일은 생년월일보다 같거나 늦어야 합니다.
            </p>
          )}
        </div>

        {result && birth && ref && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  결과
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={copyAll}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      복사
                    </>
                  )}
                </Button>
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="만 나이" value={`${result.full}세`} hint="국제 표준 · 한국 법정 기본" />
                <Stat label="연 나이" value={`${result.year}세`} hint="현재 연도 − 출생 연도" />
                <Stat label="세는 나이" value={`${result.korean}세`} hint="한국 전통" />
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat
                  label="총 살아온 날"
                  value={`${result.totalDays.toLocaleString()}일`}
                />
                <Stat
                  label="다음 생일까지"
                  value={`${result.daysToNextBirthday.toLocaleString()}일`}
                />
              </div>
            </div>

            {result.milestones.length > 0 && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  다음 마일스톤
                </h2>
                <ul className="space-y-1.5">
                  {result.milestones.map((m) => (
                    <li
                      key={m.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatKoreanDate(m.date)} · {m.daysAway.toLocaleString()}일 남음
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1.5">
          <p>
            <strong className="text-foreground">만 나이</strong>: 2023년 6월 28일부터 한국 법령상 기본 기준.
            생일 지났으면 +1, 안 지났으면 그대로.
          </p>
          <p>
            <strong className="text-foreground">연 나이</strong>: 현재 연도에서 출생 연도를 뺀 값.
            병역법·청소년보호법 등 일부 법령이 사용.
          </p>
          <p>
            <strong className="text-foreground">세는 나이</strong>: 한국 전통. 태어난 해를 1세로 치고
            새해마다 +1. 일상 대화에서 쓰이지만 공식 법령에선 폐지됨.
          </p>
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
