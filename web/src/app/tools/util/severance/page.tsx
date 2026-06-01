'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { calcSeverance } from '@/lib/office/payroll';

function parseNum(s: string): number {
  const n = Number(s.replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

export default function SeveranceCalcPage() {
  const [joinDate, setJoinDate] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [pay3m, setPay3m] = useState('');
  const [bonus, setBonus] = useState('');
  const [leaveAllowance, setLeaveAllowance] = useState('');

  const result = useMemo(() => {
    if (!joinDate || !leaveDate || parseNum(pay3m) <= 0) return null;
    return calcSeverance({
      joinDate,
      leaveDate,
      last3MonthsPay: parseNum(pay3m),
      annualBonus: parseNum(bonus),
      annualLeaveAllowance: parseNum(leaveAllowance),
    });
  }, [joinDate, leaveDate, pay3m, bonus, leaveAllowance]);

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
          <Coins className="h-5 w-5" />
          <h1 className="font-semibold text-base">퇴직금 계산기</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="join">입사일</label>
              <Input id="join" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} aria-label="입사일" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="leave">퇴사일</label>
              <Input id="leave" type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} aria-label="퇴사일" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" htmlFor="pay3m">
              퇴직 전 3개월 임금총액 (기본급+수당, 원)
            </label>
            <Input
              id="pay3m"
              type="text"
              inputMode="numeric"
              value={pay3m}
              onChange={(e) => setPay3m(e.target.value)}
              placeholder="예: 11,250,000 (3개월 합계)"
              aria-label="3개월 임금총액"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="bonus">
                연간 상여금 (선택, 원)
              </label>
              <Input id="bonus" type="text" inputMode="numeric" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="0" aria-label="연간 상여금" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="leaveallow">
                연차수당 (선택, 원)
              </label>
              <Input id="leaveallow" type="text" inputMode="numeric" value={leaveAllowance} onChange={(e) => setLeaveAllowance(e.target.value)} placeholder="0" aria-label="연차수당" />
            </div>
          </div>
        </div>

        {result && (
          <>
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <p className="text-[11px] text-muted-foreground">예상 퇴직금</p>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-1">{won(result.severance)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                재직 {result.daysWorked.toLocaleString('ko-KR')}일 ({result.years.toFixed(2)}년)
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <ul className="divide-y text-sm">
                <li className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">평균임금 (1일)</span>
                  <span className="tabular-nums">{won(result.avgDailyWage)}</span>
                </li>
                <li className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">재직일수</span>
                  <span className="tabular-nums">{result.daysWorked.toLocaleString('ko-KR')}일</span>
                </li>
                <li className="flex items-center justify-between py-2 text-[12px] text-muted-foreground">
                  <span>계산식</span>
                  <span className="tabular-nums">평균임금 × 30 × (재직일수 ÷ 365)</span>
                </li>
              </ul>
            </div>
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
          <p>
            근로기준법상 퇴직금 = <strong>1일 평균임금 × 30 × (재직일수 ÷ 365)</strong>.
            평균임금은 퇴직 전 3개월 임금총액을 그 기간 일수(약 91.25일)로 나눠 산정하며,
            연간 상여·연차수당은 3개월분으로 안분해 가산합니다.
          </p>
          <p>
            1년(365일) 이상 근속 + 주 15시간 이상 근로자가 대상입니다. 실제 금액은 회사
            규정·통상임금 산정에 따라 달라질 수 있습니다. 계산은 브라우저에서만 처리됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
