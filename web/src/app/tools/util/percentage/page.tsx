'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { ShareLinkButton } from '@/components/tools/ShareLinkButton';
import { useToolUrlState } from '@/lib/use-tool-url-state';

type Mode =
  | 'of' // X% of N = ?
  | 'pct' // X is what % of N
  | 'change' // % change A → B
  | 'addsub' // N +/- X%
  | 'tip' // 금액에 팁/할인 %
  | 'ratio'; // A:B 를 백분율로

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'of', label: 'X%의 값', hint: '예: 200,000의 15% = ?' },
  { id: 'pct', label: '값의 비율', hint: '예: 35는 80의 몇 %?' },
  { id: 'change', label: '증감률', hint: '예: 100 → 130 (증가율 %)' },
  { id: 'addsub', label: '할증·할인', hint: '예: 50,000 + 10% / - 10%' },
  { id: 'tip', label: '팁·부가세', hint: '예: 18,000원 + 10%' },
  { id: 'ratio', label: '비율', hint: 'A:B 를 백분율로' },
];

function parseNum(s: string): number | null {
  const trimmed = s.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const fixed = abs >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n.toFixed(abs < 1 ? 4 : 2).replace(/\.?0+$/, '');
  return fixed;
}

const MODE_IDS = MODES.map((m) => m.id);
const isMode = (value: string): value is Mode => (MODE_IDS as string[]).includes(value);

export default function PercentagePage() {
  // 입력·모드를 URL 쿼리로 관리(공유·복원). 초기 렌더는 결정적 기본값.
  const [urlState, patchUrlState] = useToolUrlState({ mode: 'of', a: '', b: '' });
  // URL 에서 들어온 mode 는 임의 문자열일 수 있으므로 화이트리스트로 검증.
  const mode: Mode = isMode(urlState.mode) ? urlState.mode : 'of';
  const { a, b } = urlState;
  const setA = (value: string) => patchUrlState({ a: value });
  const setB = (value: string) => patchUrlState({ b: value });

  const [copied, setCopied] = useState<string | null>(null);

  const result = useMemo(() => {
    const na = parseNum(a);
    const nb = parseNum(b);
    if (na === null || nb === null) return null;
    switch (mode) {
      case 'of':
        return {
          label: `${fmt(na)} % 의 ${fmt(nb)} 는`,
          value: (na / 100) * nb,
          unit: '',
        };
      case 'pct':
        if (nb === 0) return { label: '0으로 나눌 수 없음', value: NaN, unit: '' };
        return {
          label: `${fmt(na)} 는 ${fmt(nb)} 의`,
          value: (na / nb) * 100,
          unit: '%',
        };
      case 'change':
        if (na === 0) return { label: '시작값이 0', value: NaN, unit: '' };
        return {
          label: `${fmt(na)} → ${fmt(nb)} 증감률`,
          value: ((nb - na) / Math.abs(na)) * 100,
          unit: '%',
        };
      case 'addsub':
        return {
          label: `${fmt(na)} 에 ${fmt(nb)}% 적용`,
          value: na * (1 + nb / 100),
          unit: '',
          extra: na * (1 - nb / 100),
          extraLabel: `${fmt(na)} 에서 ${fmt(nb)}% 빼면`,
        };
      case 'tip':
        return {
          label: `${fmt(na)} 의 ${fmt(nb)}% 추가`,
          value: na * (1 + nb / 100),
          unit: '',
          extra: na * (nb / 100),
          extraLabel: `추가분`,
        };
      case 'ratio':
        if (na + nb === 0) return { label: '합이 0', value: NaN, unit: '' };
        return {
          label: `${fmt(na)} : ${fmt(nb)} 중 첫 번째 비율`,
          value: (na / (na + nb)) * 100,
          unit: '%',
          extra: (nb / (na + nb)) * 100,
          extraLabel: '두 번째 비율',
        };
    }
  }, [mode, a, b]);

  const labelA = mode === 'of' ? '백분율 (%)' : mode === 'pct' ? '값' : mode === 'change' ? '시작값' : mode === 'addsub' ? '원래 값' : mode === 'tip' ? '금액' : 'A';
  const labelB = mode === 'of' ? '전체 값' : mode === 'pct' ? '전체 값' : mode === 'change' ? '끝값' : mode === 'addsub' ? '백분율 (%)' : mode === 'tip' ? '백분율 (%)' : 'B';

  // 결과 숫자를 클립보드에 복사한다. (NaN 등 비유효 값은 무시)
  const copyValue = async (key: string, value: number) => {
    if (!Number.isFinite(value)) return;
    try {
      await navigator.clipboard.writeText(fmt(value));
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  };

  const handleReset = () => {
    patchUrlState({ a: '', b: '' });
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="퍼센트 계산기" onReset={a || b ? handleReset : undefined}>
        <ShareLinkButton />
      </ToolHeader>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => patchUrlState({ mode: m.id, a: '', b: '' })}
                className={`h-12 text-xs rounded-md border text-left px-2 ${
                  mode === m.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
                aria-pressed={mode === m.id}
              >
                <div className="font-semibold">{m.label}</div>
                <div
                  className={`text-[10px] ${mode === m.id ? 'text-primary-foreground/80' : 'text-muted-foreground'} truncate`}
                >
                  {m.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="pct-a">
                {labelA}
              </label>
              <Input
                id="pct-a"
                type="text"
                inputMode="decimal"
                value={a}
                onChange={(e) => setA(e.target.value)}
                placeholder="숫자 (쉼표 허용)"
                aria-label={labelA}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="pct-b">
                {labelB}
              </label>
              <Input
                id="pct-b"
                type="text"
                inputMode="decimal"
                value={b}
                onChange={(e) => setB(e.target.value)}
                placeholder="숫자 (쉼표 허용)"
                aria-label={labelB}
              />
            </div>
          </div>
        </div>

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">{result.label}</p>
                {Number.isFinite(result.value) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mt-1 h-6 px-2 text-[11px]"
                    onClick={() => copyValue('main', result.value)}
                    aria-label="결과 복사"
                  >
                    {copied === 'main' ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        복사
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-1">
                {fmt(result.value)}
                {result.unit && (
                  <span className="text-xl ml-1 text-muted-foreground">
                    {result.unit}
                  </span>
                )}
              </p>
            </div>
            {result.extra !== undefined && (
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    {result.extraLabel}
                  </p>
                  {Number.isFinite(result.extra) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-mt-1 h-6 px-2 text-[11px]"
                      onClick={() => copyValue('extra', result.extra as number)}
                      aria-label={`${result.extraLabel} 복사`}
                    >
                      {copied === 'extra' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          복사
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-2xl font-bold tabular-nums mt-1 text-muted-foreground">
                  {fmt(result.extra)}
                  {result.unit && (
                    <span className="text-base ml-1">{result.unit}</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            6가지 모드 — 인상/할인 가격, 시험 점수 비율, 증감률, 팁 계산까지 한 도구에서.
            쉼표 포함 숫자 자동 인식. 모든 계산은 브라우저에서 즉시 처리됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
