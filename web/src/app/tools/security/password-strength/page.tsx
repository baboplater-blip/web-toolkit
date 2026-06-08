'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** 공격자가 초당 시도할 수 있는 추측 횟수 (오프라인 GPU 공격 가정) */
const GUESSES_PER_SECOND = 1e10;

interface StrengthResult {
  length: number;
  charsetSize: number;
  entropyBits: number;
  /** 0=매우약함 … 3=매우강함 */
  level: number;
  levelLabel: string;
  crackTimeLabel: string;
}

const LEVEL_LABELS = ['약함', '보통', '강함', '매우 강함'] as const;
const LEVEL_COLORS = ['bg-destructive', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'] as const;

/**
 * 비밀번호에 등장하는 문자 종류로 charset 크기를 추정한다.
 * 소문자(26)·대문자(26)·숫자(10)·기호(33) 를 더한다.
 */
function estimateCharsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  // ASCII 출력 가능한 기호 (공백 포함 약 33종)
  if (/[^a-zA-Z0-9]/.test(password)) size += 33;
  return size;
}

/** 초 단위 시간을 사람이 읽을 수 있는 한국어 문자열로 변환한다. */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '사실상 무한';
  if (seconds < 1) return '즉시';

  const units: ReadonlyArray<[number, string]> = [
    [60, '초'],
    [60, '분'],
    [24, '시간'],
    [365, '일'],
    [100, '년'],
    [10, '세기'],
  ];

  let value = seconds;
  let label = '초';
  for (const [factor, name] of units) {
    if (value < factor) {
      label = name;
      break;
    }
    value /= factor;
    label = name;
  }

  if (value >= 1e6) return `${value.toExponential(1)} ${label}`;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `약 ${rounded.toLocaleString('ko-KR')} ${label}`;
}

function analyze(password: string): StrengthResult | null {
  if (!password) return null;

  const length = password.length;
  const charsetSize = estimateCharsetSize(password);
  // 엔트로피(bits) = length × log2(charset)
  const entropyBits = charsetSize > 0 ? length * Math.log2(charsetSize) : 0;

  let level: number;
  if (entropyBits < 40) level = 0;
  else if (entropyBits < 60) level = 1;
  else if (entropyBits < 80) level = 2;
  else level = 3;

  // 평균 크래킹 시간 = (전체 경우의 수 / 2) / 초당 시도 횟수
  // 2^entropy 가 Number 범위를 넘을 수 있으므로 지수 영역에서 계산한다.
  const log2Guesses = entropyBits - 1; // 평균이므로 절반 (÷2 = −1 bit)
  const secondsExponent = log2Guesses * Math.LN2 - Math.log(GUESSES_PER_SECOND);
  const crackSeconds = Math.exp(secondsExponent);

  return {
    length,
    charsetSize,
    entropyBits,
    level,
    levelLabel: LEVEL_LABELS[level],
    crackTimeLabel: formatDuration(crackSeconds),
  };
}

export default function PasswordStrengthPage() {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const result = useMemo(() => analyze(password), [password]);
  const barWidth = result ? Math.min(100, (result.entropyBits / 100) * 100) : 0;

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          비밀번호 강도 검사
        </h1>
        <p className="text-sm text-muted-foreground">
          비밀번호의 엔트로피와 예상 크래킹 시간을 추정해 강도를 보여줍니다.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">비밀번호</span>
          <div className="relative">
            <Input
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="검사할 비밀번호를 입력하세요"
              autoComplete="new-password"
              className="pr-10 font-mono"
              aria-label="비밀번호"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setVisible((prev) => !prev)}
              className="absolute right-1 top-1/2 -translate-y-1/2"
              aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </label>

        {result && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{result.levelLabel}</span>
                <span className="text-muted-foreground">
                  {result.entropyBits.toFixed(1)} bits 엔트로피
                </span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(result.entropyBits)}
                aria-label="비밀번호 강도"
              >
                <div
                  className={`h-full rounded-full transition-all ${LEVEL_COLORS[result.level]}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <dt className="text-xs text-muted-foreground">길이</dt>
                <dd className="font-mono font-medium">{result.length}자</dd>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <dt className="text-xs text-muted-foreground">문자 집합 크기</dt>
                <dd className="font-mono font-medium">{result.charsetSize}</dd>
              </div>
              <div className="col-span-2 rounded-lg bg-muted/50 p-2.5">
                <dt className="text-xs text-muted-foreground">
                  추정 크래킹 시간 (초당 {GUESSES_PER_SECOND.toExponential(0)}회 가정)
                </dt>
                <dd className="font-mono font-medium">{result.crackTimeLabel}</dd>
              </div>
            </dl>

            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-muted-foreground leading-relaxed">
              ⚠️ 이 추정은 길이·문자종류 기반이며 사전어·키보드 패턴·반복은 반영하지 않습니다. 실제
              강도는 더 낮을 수 있습니다.
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        입력한 비밀번호는 브라우저 메모리에만 존재하며 서버로 전송되거나 저장되지 않습니다. 추정치는 참고용이며 사전·패턴
        기반 공격은 고려하지 않습니다.
      </p>
    </main>
  );
}
