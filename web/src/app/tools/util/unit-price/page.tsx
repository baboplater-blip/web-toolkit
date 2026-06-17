'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface ProductRow {
  id: number;
  name: string;
  amount: string;
  price: string;
}

interface RankedRow {
  id: number;
  name: string;
  unitPrice: number;
  isCheapest: boolean;
}

function createRow(id: number): ProductRow {
  return { id, name: '', amount: '', price: '' };
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

function formatUnitPrice(value: number): string {
  // 단위당 가격은 소수가 흔하므로 둘째 자리까지 표시.
  return `${Number(value.toFixed(2)).toLocaleString('ko-KR')}원`;
}

export default function UnitPricePage() {
  const [rows, setRows] = useState<ProductRow[]>([createRow(1), createRow(2)]);
  const [nextId, setNextId] = useState(3);
  const [copied, setCopied] = useState(false);

  const ranked = useMemo<RankedRow[]>(() => {
    const computed = rows
      .map((row) => {
        const amount = parseNumber(row.amount);
        const price = parseNumber(row.price);
        if (amount === null || price === null || amount <= 0 || price < 0) return null;
        return {
          id: row.id,
          name: row.name.trim() === '' ? '이름 없음' : row.name.trim(),
          unitPrice: price / amount,
        };
      })
      .filter((row): row is { id: number; name: string; unitPrice: number } => row !== null)
      .sort((left, right) => left.unitPrice - right.unitPrice);

    if (computed.length === 0) return [];
    const cheapest = computed[0].unitPrice;
    return computed.map((row) => ({ ...row, isCheapest: row.unitPrice === cheapest }));
  }, [rows]);

  function addRow() {
    setRows((current) => [...current, createRow(nextId)]);
    setNextId((id) => id + 1);
  }

  function removeRow(id: number) {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  }

  function updateRow(id: number, field: keyof Omit<ProductRow, 'id'>, value: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function reset() {
    setRows([createRow(1), createRow(2)]);
    setNextId(3);
    setCopied(false);
  }

  async function copy() {
    if (ranked.length === 0) return;
    const lines = ranked.map(
      (row, index) =>
        `${index + 1}. ${row.name}: ${formatUnitPrice(row.unitPrice)} /단위${row.isCheapest ? ' (가장 저렴)' : ''}`,
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 사용 불가 — 무시
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="단위당 가격 비교" onReset={reset} widthClass="max-w-xl" />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          용량·가격이 다른 상품을 입력하면 단위당 가격을 계산해 가장 저렴한 상품을 알려줍니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          {rows.map((row, index) => (
            <div key={row.id} className="space-y-2 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">상품 {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`상품 ${index + 1} 삭제`}
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={row.name}
                onChange={(event) => updateRow(row.id, 'name', event.target.value)}
                placeholder="이름 (예: A 브랜드 우유)"
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">용량 (ml·g·개 등)</span>
                  <Input
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(event) => updateRow(row.id, 'amount', event.target.value)}
                    placeholder="예: 900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">가격 (원)</span>
                  <Input
                    inputMode="decimal"
                    value={row.price}
                    onChange={(event) => updateRow(row.id, 'price', event.target.value)}
                    placeholder="예: 2500"
                  />
                </label>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1 h-4 w-4" />
            상품 추가
          </Button>
        </div>

        {ranked.length > 0 && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">단위당 가격 (낮은 순)</p>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <ul className="space-y-2">
              {ranked.map((row) => (
                <li
                  key={row.id}
                  className={
                    row.isCheapest
                      ? 'flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 px-3 py-2'
                      : 'flex items-center justify-between rounded-lg border bg-background px-3 py-2'
                  }
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
                  <span className="ml-2 text-right">
                    <span
                      className={
                        row.isCheapest
                          ? 'block text-xl font-bold tabular-nums text-primary'
                          : 'block text-lg font-semibold tabular-nums'
                      }
                    >
                      {formatUnitPrice(row.unitPrice)}
                    </span>
                    {row.isCheapest && <span className="block text-xs font-medium text-primary">가장 저렴</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">단위당 가격 = 가격 ÷ 용량 (같은 단위끼리 비교하세요).</p>
          </div>
        )}
      </main>
    </div>
  );
}
