'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface Sign {
  ko: string;
  symbol: string;
  /** 시작 (월, 일) — 이 날짜 이상이면 해당 별자리 시작. */
  fromMonth: number;
  fromDay: number;
  note: string;
}

/**
 * 서양 12별자리. 각 별자리는 fromMonth/fromDay 부터 다음 별자리 시작 전날까지.
 * 염소자리(12/22~1/19)는 해를 넘기므로 별도 처리한다.
 */
const SIGNS: Sign[] = [
  { ko: '염소자리', symbol: '♑', fromMonth: 12, fromDay: 22, note: '성실하고 책임감이 강합니다.' },
  { ko: '물병자리', symbol: '♒', fromMonth: 1, fromDay: 20, note: '독창적이고 자유로운 사고를 즐깁니다.' },
  { ko: '물고기자리', symbol: '♓', fromMonth: 2, fromDay: 19, note: '감수성이 풍부하고 공감 능력이 뛰어납니다.' },
  { ko: '양자리', symbol: '♈', fromMonth: 3, fromDay: 21, note: '열정적이고 도전을 두려워하지 않습니다.' },
  { ko: '황소자리', symbol: '♉', fromMonth: 4, fromDay: 20, note: '끈기 있고 안정감을 중시합니다.' },
  { ko: '쌍둥이자리', symbol: '♊', fromMonth: 5, fromDay: 21, note: '호기심이 많고 소통에 능합니다.' },
  { ko: '게자리', symbol: '♋', fromMonth: 6, fromDay: 22, note: '정이 깊고 가족과 안정을 소중히 합니다.' },
  { ko: '사자자리', symbol: '♌', fromMonth: 7, fromDay: 23, note: '자신감 넘치고 리더십이 있습니다.' },
  { ko: '처녀자리', symbol: '♍', fromMonth: 8, fromDay: 23, note: '꼼꼼하고 분석적입니다.' },
  { ko: '천칭자리', symbol: '♎', fromMonth: 9, fromDay: 23, note: '균형과 조화를 추구합니다.' },
  { ko: '전갈자리', symbol: '♏', fromMonth: 10, fromDay: 23, note: '집중력이 강하고 통찰력이 깊습니다.' },
  { ko: '사수자리', symbol: '♐', fromMonth: 11, fromDay: 22, note: '낙천적이고 모험을 즐깁니다.' },
];

/** (월, 일) 로부터 서양 별자리를 정확한 경계로 판정. */
function findSign(month: number, day: number): Sign {
  // 염소자리: 12/22~12/31 또는 1/1~1/19.
  const capricorn = SIGNS[0];
  if (
    (month === 12 && day >= capricorn.fromDay) ||
    (month === 1 && day <= 19)
  ) {
    return capricorn;
  }
  // 나머지: 시작 경계(fromMonth/fromDay) 이상이고 다음 별자리 시작 전인 구간.
  for (let i = 1; i < SIGNS.length; i += 1) {
    const sign = SIGNS[i];
    const next = SIGNS[(i + 1) % SIGNS.length];
    const afterStart = month > sign.fromMonth || (month === sign.fromMonth && day >= sign.fromDay);
    const beforeNext =
      month < next.fromMonth || (month === next.fromMonth && day < next.fromDay);
    if (afterStart && beforeNext) {
      return sign;
    }
  }
  // 도달하지 않지만 타입 안전을 위해 염소자리 반환.
  return capricorn;
}

/** "YYYY-MM-DD" 입력에서 월·일을 파싱. 유효하지 않으면 null. */
function parseMonthDay(value: string): { month: number; day: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // 실제 존재하는 날짜인지 검증 (예: 2월 30일 거부).
  const date = new Date(Number(match[1]), month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { month, day };
}

export default function ZodiacPage() {
  const [birth, setBirth] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // 입력 기반 결정적 — 실시간 useMemo 안전.
  const result = useMemo(() => {
    const parsed = parseMonthDay(birth);
    if (!parsed) return null;
    return findSign(parsed.month, parsed.day);
  }, [birth]);

  function handleReset() {
    setBirth('');
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`${result.symbol} ${result.ko} — ${result.note}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 비보안 컨텍스트·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="별자리 찾기"
        widthClass="max-w-xl"
        onReset={birth ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          생년월일로 서양 별자리를 날짜 경계까지 정확히 찾아 줍니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">생년월일</span>
            <input
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              aria-label="생년월일"
            />
          </label>
        </div>

        {birth && !result && (
          <p role="alert" className="text-sm text-destructive">
            유효한 날짜를 입력하세요.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4 text-center">
            <div className="text-5xl" aria-hidden>
              {result.symbol}
            </div>
            <p className="text-2xl font-bold text-primary">{result.ko}</p>
            <p className="text-sm text-muted-foreground">{result.note}</p>
            <div className="flex justify-center border-t pt-3">
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
