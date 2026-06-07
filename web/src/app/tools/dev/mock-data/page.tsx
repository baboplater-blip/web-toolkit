'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Database, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  type FieldDef,
  type FieldType,
  generateRows,
  rowsToCsv,
} from '@/lib/tools/mock-data-gen';

type OutputFormat = 'json' | 'csv';

interface FieldOption {
  type: FieldType;
  label: string;
  defaultKey: string;
}

const FIELD_OPTIONS: readonly FieldOption[] = [
  { type: 'name', label: '이름', defaultKey: 'name' },
  { type: 'email', label: '이메일', defaultKey: 'email' },
  { type: 'phone', label: '전화', defaultKey: 'phone' },
  { type: 'address', label: '주소', defaultKey: 'address' },
  { type: 'date', label: '날짜', defaultKey: 'date' },
  { type: 'uuid', label: 'UUID', defaultKey: 'id' },
  { type: 'number', label: '숫자', defaultKey: 'value' },
];

const MAX_ROWS = 1000;

export default function MockDataPage() {
  const [selected, setSelected] = useState<FieldType[]>(['name', 'email', 'phone']);
  const [rowCount, setRowCount] = useState(10);
  const [format, setFormat] = useState<OutputFormat>('json');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const fields = useMemo<FieldDef[]>(() => {
    // 같은 타입이 중복돼도 키가 충돌하지 않도록 일련번호를 붙인다.
    const seen = new Map<FieldType, number>();
    return selected.map((type) => {
      const option = FIELD_OPTIONS.find((o) => o.type === type);
      const baseKey = option ? option.defaultKey : type;
      const used = seen.get(type) ?? 0;
      seen.set(type, used + 1);
      const key = used === 0 ? baseKey : `${baseKey}${used + 1}`;
      return { type, key };
    });
  }, [selected]);

  const toggleField = (type: FieldType) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const generate = () => {
    if (fields.length === 0) {
      setOutput('');
      return;
    }
    const rows = generateRows(fields, rowCount);
    setOutput(format === 'json' ? JSON.stringify(rows, null, 2) : rowsToCsv(rows, fields));
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  };

  const download = () => {
    if (!output) return;
    const mime = format === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([output], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mock-data.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const canGenerate = fields.length > 0 && rowCount > 0;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Database className="h-5 w-5 text-primary" aria-hidden />
          더미 데이터 생성기
        </h1>
        <p className="text-sm text-muted-foreground">이름·이메일·주소 등 가짜 데이터를 JSON·CSV로 대량 생성합니다.</p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <span className="text-sm font-medium">필드 선택</span>
        <div className="flex flex-wrap gap-1.5">
          {FIELD_OPTIONS.map((option) => {
            const active = selected.includes(option.type);
            return (
              <Button
                key={option.type}
                type="button"
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleField(option.type)}
                aria-pressed={active}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">행 수 (최대 {MAX_ROWS})</span>
          <Input
            type="number"
            min={1}
            max={MAX_ROWS}
            value={rowCount}
            onChange={(e) =>
              setRowCount(Math.min(MAX_ROWS, Math.max(1, Number(e.target.value) || 1)))
            }
            className="w-32 font-mono"
            aria-label="생성할 행 수"
          />
        </label>

        <div className="space-y-1">
          <span className="block text-sm font-medium">출력 형식</span>
          <div className="flex gap-1.5">
            {(['json', 'csv'] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={format === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat(value)}
                aria-pressed={format === value}
              >
                {value.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <Button type="button" onClick={generate} disabled={!canGenerate}>
          생성
        </Button>
      </div>

      {fields.length === 0 && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          최소 한 개 이상의 필드를 선택하세요.
        </p>
      )}

      <div className="grid gap-3">
        <textarea
          className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="생성 버튼을 누르면 결과가 여기에 표시됩니다."
          aria-label="생성 결과"
        />
        <div className="flex gap-2">
          <Button type="button" onClick={copy} disabled={!output}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button type="button" variant="outline" onClick={download} disabled={!output}>
            <Download className="h-3.5 w-3.5" aria-hidden />
            다운로드
          </Button>
        </div>
      </div>
    </main>
  );
}
