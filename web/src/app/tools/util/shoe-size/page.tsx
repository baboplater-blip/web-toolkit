'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type ShoeSystem = 'us-men' | 'us-women' | 'uk' | 'eu' | 'cm';

interface SystemOption {
  id: ShoeSystem;
  label: string;
  placeholder: string;
}

const SYSTEM_OPTIONS: SystemOption[] = [
  { id: 'us-men', label: 'US 남성', placeholder: '예: 9' },
  { id: 'us-women', label: 'US 여성', placeholder: '예: 7.5' },
  { id: 'uk', label: 'UK', placeholder: '예: 8.5' },
  { id: 'eu', label: 'EU', placeholder: '예: 42' },
  { id: 'cm', label: 'cm (발 길이)', placeholder: '예: 27' },
];

/*
 * 모든 시스템을 "발 길이(cm)" 하나의 기준값으로 환산한 뒤 다시 펼친다.
 * 표준 관계식:
 *   US 남성 = UK + 0.5
 *   US 여성 = US 남성 + 1.5
 *   EU(파리 포인트) ≈ (발 길이 cm + 1.5) × 1.5   (여유분 포함)
 *   UK ≈ 발 길이 cm × 1.5 − 23                    (브래녹 근사)
 */

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

function ukToCm(uk: number): number {
  return (uk + 23) / 1.5;
}

function cmToUk(cm: number): number {
  return cm * 1.5 - 23;
}

function cmToEu(cm: number): number {
  return (cm + 1.5) * 1.5;
}

function euToCm(eu: number): number {
  return eu / 1.5 - 1.5;
}

/** 입력값을 시스템에 맞춰 기준 발 길이(cm)로 환산. */
function toFootCm(system: ShoeSystem, value: number): number {
  switch (system) {
    case 'cm':
      return value;
    case 'eu':
      return euToCm(value);
    case 'uk':
      return ukToCm(value);
    case 'us-men':
      // US 남성 = UK + 0.5 → UK = US 남성 − 0.5
      return ukToCm(value - 0.5);
    case 'us-women':
      // US 여성 = US 남성 + 1.5 → US 남성 = US 여성 − 1.5
      return ukToCm(value - 1.5 - 0.5);
    default:
      return value;
  }
}

interface ConvertedRow {
  id: ShoeSystem;
  label: string;
  value: number;
  /** 정수 표기 시스템(EU)은 소수점 없이, 나머지는 0.5 단위로 보여준다. */
  decimals: 0 | 1;
}

/** 기준 발 길이(cm)에서 모든 시스템 값을 도출. */
function expand(footCm: number): ConvertedRow[] {
  const uk = cmToUk(footCm);
  const usMen = uk + 0.5;
  const usWomen = usMen + 1.5;
  const eu = cmToEu(footCm);

  return [
    { id: 'us-men', label: 'US 남성', value: usMen, decimals: 1 },
    { id: 'us-women', label: 'US 여성', value: usWomen, decimals: 1 },
    { id: 'uk', label: 'UK', value: uk, decimals: 1 },
    { id: 'eu', label: 'EU', value: eu, decimals: 0 },
    { id: 'cm', label: 'cm (발 길이)', value: footCm, decimals: 1 },
  ];
}

/** 신발 사이즈는 보통 0.5 단위로 반올림(EU 는 정수). */
function formatSize(value: number, decimals: 0 | 1): string {
  if (decimals === 0) return String(Math.round(value));
  return (Math.round(value * 2) / 2).toFixed(1);
}

function parseSize(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function ShoeSizeConverterPage() {
  const [system, setSystem] = useState<ShoeSystem>('us-men');
  const [size, setSize] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const rows = useMemo<ConvertedRow[] | null>(() => {
    const value = parseSize(size);
    if (value === null) return null;

    const footCm = toFootCm(system, value);
    if (!Number.isFinite(footCm) || footCm <= 0) return null;

    return expand(footCm);
  }, [system, size]);

  const placeholder =
    SYSTEM_OPTIONS.find((o) => o.id === system)?.placeholder ?? '예: 9';

  async function copy() {
    if (!rows) return;
    try {
      const text = rows
        .map((row) => `${row.label}: ${formatSize(row.value, row.decimals)}`)
        .join('\n');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function handleReset() {
    setSystem('us-men');
    setSize('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="신발 사이즈 변환"
        widthClass="max-w-xl"
        onReset={size ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          한 시스템의 신발 사이즈를 입력하면 US·UK·EU·cm 의 대응 사이즈를 한눈에
          보여줍니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">입력 기준</span>
            <select
              value={system}
              onChange={(e) => setSystem(e.target.value as ShoeSystem)}
              className={selectClass}
              aria-label="입력 기준 시스템"
            >
              {SYSTEM_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">사이즈</span>
            <Input
              inputMode="decimal"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder={placeholder}
              aria-label="사이즈"
            />
          </label>
        </div>

        {rows && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">변환 결과</p>
              <Button variant="outline" size="sm" onClick={copy}>
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
            <table className="w-full text-sm">
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.id === system
                        ? 'border-b font-semibold last:border-0'
                        : 'border-b text-muted-foreground last:border-0'
                    }
                  >
                    <td className="py-2">{row.label}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatSize(row.value, row.decimals)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          브랜드·국가별로 실측이 다를 수 있는 근사 환산표입니다. 가능하면 발 길이(cm)
          를 기준으로 구매하는 것을 권장합니다.
        </p>
      </main>
    </div>
  );
}
