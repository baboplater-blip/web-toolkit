'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToolHeader } from '@/components/tools/ToolHeader';

const DEFAULT_OPTS: Options = {
  length: 20,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
};
const DEFAULT_COUNT = 5;

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?';
const AMBIGUOUS = 'Il1O0o`\'"|';

interface Options {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

function generate(opts: Options): string {
  let pool = '';
  if (opts.lower) pool += LOWER;
  if (opts.upper) pool += UPPER;
  if (opts.digits) pool += DIGITS;
  if (opts.symbols) pool += SYMBOLS;
  if (opts.excludeAmbiguous) {
    pool = pool
      .split('')
      .filter((c) => !AMBIGUOUS.includes(c))
      .join('');
  }
  if (pool.length === 0) return '';
  const bytes = new Uint32Array(opts.length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < opts.length; i++) {
    out += pool[bytes[i] % pool.length];
  }
  return out;
}

function strength(pw: string): { score: number; label: string; entropy: number } {
  if (!pw) return { score: 0, label: '—', entropy: 0 };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 30;
  const entropy = pool > 0 ? Math.log2(pool) * pw.length : 0;
  let label = '약함';
  let score = 1;
  if (entropy >= 90) {
    label = '매우 강함';
    score = 5;
  } else if (entropy >= 70) {
    label = '강함';
    score = 4;
  } else if (entropy >= 50) {
    label = '보통';
    score = 3;
  } else if (entropy >= 30) {
    label = '약함';
    score = 2;
  } else {
    label = '매우 약함';
    score = 1;
  }
  return { score, label, entropy };
}

export default function PasswordPage() {
  const [opts, setOpts] = useState<Options>({ ...DEFAULT_OPTS });
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [list, setList] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    setList(Array.from({ length: count }, () => generate(opts)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const regenerate = () => {
    setList(Array.from({ length: count }, () => generate(opts)));
  };

  const copyOne = async (i: number) => {
    try {
      await navigator.clipboard.writeText(list[i]);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setOpts({ ...DEFAULT_OPTS });
    setCount(DEFAULT_COUNT);
    setList(Array.from({ length: DEFAULT_COUNT }, () => generate(DEFAULT_OPTS)));
    setCopiedIdx(null);
  };

  const analyses = useMemo(() => list.map((p) => strength(p)), [list]);

  const setOpt = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOpts((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="비밀번호 생성" onReset={handleReset} />

      <main className="p-4 max-w-3xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium">길이</label>
              <span className="text-xs text-muted-foreground">{opts.length}자</span>
            </div>
            <input
              type="range"
              min={6}
              max={64}
              step={1}
              value={opts.length}
              onChange={(e) => setOpt('length', Number(e.target.value))}
              className="w-full accent-primary" aria-label="길이" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                ['lower', 'a-z'],
                ['upper', 'A-Z'],
                ['digits', '0-9'],
                ['symbols', '기호'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted text-xs"
              >
                <input
                  type="checkbox"
                  checked={opts[key]}
                  onChange={(e) => setOpt(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted text-xs">
            <input
              type="checkbox"
              checked={opts.excludeAmbiguous}
              onChange={(e) => setOpt('excludeAmbiguous', e.target.checked)}
            />
            혼동하기 쉬운 문자 제외 (I l 1 O 0 등)
          </label>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-medium mb-1 block">생성 개수</label>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="w-full h-9 rounded-md border bg-background px-2.5 text-sm" aria-label="생성 개수" />
            </div>
            <Button onClick={regenerate}>
              <RefreshCw className="h-4 w-4" />
              생성
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            생성 결과
          </h2>
          <Separator />
          <div className="space-y-1.5">
            {list.map((pw, i) => {
              const a = analyses[i];
              const barColor =
                a.score >= 4
                  ? 'bg-green-500'
                  : a.score === 3
                    ? 'bg-yellow-500'
                    : 'bg-destructive';
              return (
                <div
                  key={i}
                  className="rounded-md border bg-background p-2 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-mono text-sm break-all">{pw}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyOne(i)}
                      aria-label="비밀번호 복사"
                    >
                      {copiedIdx === i ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${barColor}`}
                        style={{ width: `${(a.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-28 text-right">
                      {a.label} · {a.entropy.toFixed(0)} bits
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          crypto.getRandomValues 기반 암호학적 난수. 16자 이상·기호 포함 시 강도 &ldquo;강함&rdquo; 이상 권장.
        </p>
      </main>
    </div>
  );
}
