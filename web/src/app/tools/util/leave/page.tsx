'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';

function parseNum(s: string): number {
  const n = Number(s.replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

/** 입사일~기준일 근속으로 연차 일수 산정. */
function annualLeave(joinISO: string, refISO: string) {
  const join = new Date(joinISO);
  const ref = new Date(refISO);
  if (Number.isNaN(join.getTime()) || Number.isNaN(ref.getTime()) || ref < join)
    return null;

  // 만 근속 연수
  let years = ref.getFullYear() - join.getFullYear();
  const anniv = new Date(join);
  anniv.setFullYear(join.getFullYear() + years);
  if (ref < anniv) years -= 1;

  if (years < 1) {
    // 1년 미만: 개근 1개월당 1일, 최대 11일
    let months = (ref.getFullYear() - join.getFullYear()) * 12 + (ref.getMonth() - join.getMonth());
    if (ref.getDate() < join.getDate()) months -= 1;
    months = Math.max(0, months);
    return { days: Math.min(11, months), basis: '1년 미만 — 개근 1개월당 1일 (최대 11일)', years };
  }
  // 1년 이상: 15일 + 2년마다 1일 가산 (최대 25일)
  const extra = Math.min(10, Math.floor((years - 1) / 2));
  return { days: Math.min(25, 15 + extra), basis: `${years}년차 — 기본 15일 + 가산 ${extra}일`, years };
}

export default function LeaveCalcPage() {
  const [tab, setTab] = useState<'annual' | 'weekly'>('annual');

  // 연차
  const [joinDate, setJoinDate] = useState('');
  const [refDate, setRefDate] = useState('');

  // 주휴수당
  const [weeklyHours, setWeeklyHours] = useState('40');
  const [hourlyWage, setHourlyWage] = useState('10030');

  const leave = useMemo(
    () => (joinDate && refDate ? annualLeave(joinDate, refDate) : null),
    [joinDate, refDate],
  );

  const weekly = useMemo(() => {
    const h = parseNum(weeklyHours);
    const wage = parseNum(hourlyWage);
    if (h <= 0 || wage <= 0) return null;
    const eligible = h >= 15;
    const paidHours = Math.min(8, (h / 40) * 8);
    const pay = eligible ? paidHours * wage : 0;
    return { eligible, paidHours, pay, monthly: pay * 4.345 };
  }, [weeklyHours, hourlyWage]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <CalendarCheck className="h-5 w-5" />
          <h1 className="font-semibold text-base">연차·주휴수당 계산기</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-1.5">
          {(['annual', 'weekly'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`h-10 text-sm rounded-md border font-medium ${
                tab === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }`}
            >
              {t === 'annual' ? '연차 일수' : '주휴수당'}
            </button>
          ))}
        </div>

        {tab === 'annual' ? (
          <>
            <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" htmlFor="join">입사일</label>
                <Input id="join" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} aria-label="입사일" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" htmlFor="ref">기준일 (산정 시점)</label>
                <Input id="ref" type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} aria-label="기준일" />
              </div>
            </div>
            {leave && (
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                <p className="text-[11px] text-muted-foreground">발생 연차</p>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-1">{leave.days}일</p>
                <p className="text-xs text-muted-foreground mt-2">{leave.basis}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" htmlFor="wh">주 소정근로시간</label>
                <Input id="wh" type="text" inputMode="decimal" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} placeholder="40" aria-label="주 소정근로시간" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" htmlFor="wage">시급 (원)</label>
                <Input id="wage" type="text" inputMode="numeric" value={hourlyWage} onChange={(e) => setHourlyWage(e.target.value)} placeholder="10,030" aria-label="시급" />
              </div>
            </div>
            {weekly && (
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                {weekly.eligible ? (
                  <>
                    <p className="text-[11px] text-muted-foreground">주휴수당 (1주)</p>
                    <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-1">{won(weekly.pay)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      유급 {weekly.paidHours.toFixed(1)}시간 × 시급 · 월 환산 약 {won(weekly.monthly)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm">
                    주 소정근로시간이 <strong>15시간 미만</strong>이면 주휴수당 지급 대상이 아닙니다.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>연차</strong>: 1년 미만은 개근 1개월당 1일(최대 11일), 1년 이상은 15일에
            3년차부터 2년마다 1일씩 가산(최대 25일). 전년도 80% 이상 출근을 가정합니다.
          </p>
          <p>
            <strong>주휴수당</strong>: 주 15시간 이상 + 소정근로일 개근 시 1주에 1일분 유급.
            (주 소정근로시간 ÷ 40 × 8시간) × 시급, 최대 8시간. 실제는 근로계약·결근에 따라
            달라집니다. 계산은 브라우저에서만 처리됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
