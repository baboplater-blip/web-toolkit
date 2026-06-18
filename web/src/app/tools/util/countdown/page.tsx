'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

interface Remaining {
  /** 목표가 이미 지났으면 true. */
  passed: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** 목표 시각(ms)과 현재 시각(ms)으로 남은 일·시·분·초를 계산. */
function computeRemaining(targetMillis: number, nowMillis: number): Remaining {
  const diff = targetMillis - nowMillis;
  if (diff <= 0) {
    return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    passed: false,
    days: Math.floor(diff / MS_PER_DAY),
    hours: Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND),
  };
}

export default function CountdownPage() {
  // 사용자 입력은 결정적이므로 SSR/CSR 동일 — 그대로 상태로 둔다.
  const [target, setTarget] = useState('');
  // 하이드레이션 안전: 현재 시각은 서버/클라이언트가 다르므로 초기 렌더에서 읽지 않는다.
  // null 로 시작하고 마운트 후 setInterval 로만 주입한다.
  const [nowMillis, setNowMillis] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    // 마운트 직후 1회 채우고 이후 1초마다 갱신 (의도된 set-state-in-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowMillis(Date.now());
    const id = window.setInterval(() => setNowMillis(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // datetime-local 값은 로컬 타임존으로 해석된다 (Date 생성자가 처리).
  const targetMillis = useMemo(() => {
    if (!target) return null;
    const ms = new Date(target).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [target]);

  const remaining = useMemo(() => {
    if (targetMillis === null || nowMillis === null) return null;
    return computeRemaining(targetMillis, nowMillis);
  }, [targetMillis, nowMillis]);

  function handleReset() {
    setTarget('');
  }

  async function copyResult() {
    if (!remaining) return;
    const text = remaining.passed
      ? '목표 시각이 지났습니다.'
      : `${remaining.days}일 ${remaining.hours}시간 ${remaining.minutes}분 ${remaining.seconds}초 남음`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 비보안 컨텍스트·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  const units: Array<{ label: string; value: number }> = remaining
    ? [
        { label: '일', value: remaining.days },
        { label: '시간', value: remaining.hours },
        { label: '분', value: remaining.minutes },
        { label: '초', value: remaining.seconds },
      ]
    : [];

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="카운트다운 타이머"
        widthClass="max-w-xl"
        onReset={target ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          목표 날짜·시각까지 남은 시간을 실시간으로 셉니다. 모든 계산은 브라우저에서 처리됩니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">목표 날짜·시각</span>
            <input
              type="datetime-local"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              aria-label="목표 날짜·시각"
            />
          </label>
        </div>

        {target && targetMillis === null && (
          <p role="alert" className="text-sm text-destructive">
            유효한 날짜·시각을 입력하세요.
          </p>
        )}

        {remaining && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            {remaining.passed ? (
              <p className="text-center text-xl font-bold text-primary">
                목표 시각이 지났습니다.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center">
                {units.map((unit) => (
                  <div key={unit.label}>
                    <p className="text-3xl font-bold tabular-nums">{unit.value}</p>
                    <p className="text-xs text-muted-foreground">{unit.label}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end border-t pt-3">
              <Button variant="outline" size="sm" onClick={copyResult}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="ml-1">
                  {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
                </span>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
