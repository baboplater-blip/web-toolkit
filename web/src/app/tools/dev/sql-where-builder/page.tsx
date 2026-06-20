'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Database, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Operator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'IN';
type Combinator = 'AND' | 'OR';

const OPERATORS: readonly Operator[] = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN'];

interface Condition {
  id: number;
  column: string;
  operator: Operator;
  value: string;
}

interface BuildResult {
  clause: string;
  error: string | null;
}

/** 컬럼/테이블 식별자 형식(영문·숫자·밑줄, 점 표기 허용). */
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;

/** 작은따옴표를 SQL 표준(`''`)으로 이스케이프하고 양끝을 감싼다. */
function quoteString(raw: string): string {
  return `'${raw.replace(/'/g, "''")}'`;
}

/** 순수 숫자(정수·소수·부호·지수) 여부. */
function isNumericLiteral(raw: string): boolean {
  return /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(raw.trim());
}

/** 단일 값 리터럴을 SQL 표현으로 변환(숫자는 그대로, 그 외는 따옴표). */
function formatScalar(raw: string): string {
  const trimmed = raw.trim();
  return isNumericLiteral(trimmed) ? trimmed : quoteString(trimmed);
}

/** IN 목록(콤마 구분)을 `(a, b, c)` 로 변환. */
function formatInList(raw: string): { sql: string; error: string | null } {
  const items = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  if (items.length === 0) return { sql: '', error: 'IN 연산자에는 값이 하나 이상 필요합니다.' };
  return { sql: `(${items.map(formatScalar).join(', ')})`, error: null };
}

function buildCondition(condition: Condition): { sql: string; error: string | null } {
  const column = condition.column.trim();
  if (!column) return { sql: '', error: '컬럼명을 입력하세요.' };
  if (!IDENTIFIER_RE.test(column)) {
    return { sql: '', error: `컬럼명 형식이 올바르지 않습니다: ${column}` };
  }

  const value = condition.value;
  if (value.trim() === '') {
    return { sql: '', error: `값을 입력하세요: ${column}` };
  }

  if (condition.operator === 'IN') {
    const { sql, error } = formatInList(value);
    if (error) return { sql: '', error };
    return { sql: `${column} IN ${sql}`, error: null };
  }

  if (condition.operator === 'LIKE') {
    // LIKE 값은 항상 문자열로 취급한다(% 패턴 보존).
    return { sql: `${column} LIKE ${quoteString(value.trim())}`, error: null };
  }

  return { sql: `${column} ${condition.operator} ${formatScalar(value)}`, error: null };
}

function buildWhere(conditions: Condition[], combinator: Combinator): BuildResult {
  const active = conditions.filter((c) => c.column.trim() !== '' || c.value.trim() !== '');
  if (active.length === 0) return { clause: '', error: null };

  const parts: string[] = [];
  for (const condition of active) {
    const { sql, error } = buildCondition(condition);
    if (error) return { clause: '', error };
    parts.push(sql);
  }

  return { clause: `WHERE ${parts.join(`\n  ${combinator} `)}`, error: null };
}

let nextId = 1;
function createCondition(): Condition {
  return { id: nextId++, column: '', operator: '=', value: '' };
}

export default function SqlWhereBuilderPage() {
  const [conditions, setConditions] = useState<Condition[]>(() => [createCondition()]);
  const [combinator, setCombinator] = useState<Combinator>('AND');
  const [copied, setCopied] = useState(false);

  const { clause, error } = useMemo(() => buildWhere(conditions, combinator), [conditions, combinator]);

  const updateCondition = (id: number, patch: Partial<Condition>) => {
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addCondition = () => setConditions((prev) => [...prev, createCondition()]);

  const removeCondition = (id: number) => {
    setConditions((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  };

  const copy = async () => {
    if (!clause) return;
    try {
      await navigator.clipboard.writeText(clause);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setConditions([createCondition()]);
    setCombinator('AND');
    setCopied(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="SQL WHERE 조건 빌더" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4 text-primary" aria-hidden />
          컬럼·연산자·값을 입력하면 이스케이프된 WHERE 절을 만듭니다. 문자열은 자동으로 따옴표 처리됩니다.
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">조건 결합</span>
          <div className="inline-flex rounded-lg border bg-card p-1">
            {(['AND', 'OR'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCombinator(value)}
                className={`h-8 rounded-md px-4 text-sm font-medium ${
                  combinator === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {conditions.map((condition) => (
            <div
              key={condition.id}
              className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-xl border bg-card p-3"
            >
              <Input
                value={condition.column}
                onChange={(e) => updateCondition(condition.id, { column: e.target.value })}
                placeholder="컬럼명"
                className="font-mono"
                spellCheck={false}
                autoComplete="off"
                aria-label="컬럼명"
              />
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(condition.id, { operator: e.target.value as Operator })}
                className="h-9 rounded-md border bg-background px-2 font-mono text-sm"
                aria-label="연산자"
              >
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <Input
                value={condition.value}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                placeholder={condition.operator === 'IN' ? '값1, 값2, 값3' : condition.operator === 'LIKE' ? '%패턴%' : '값'}
                className="font-mono"
                spellCheck={false}
                autoComplete="off"
                aria-label="값"
              />
              <button
                type="button"
                onClick={() => removeCondition(condition.id)}
                disabled={conditions.length <= 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted disabled:opacity-40"
                aria-label="조건 삭제"
                title="조건 삭제"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addCondition}>
          <Plus className="h-4 w-4" aria-hidden />
          조건 추가
        </Button>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {!error && clause && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">결과</span>
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-lg border bg-background p-3 font-mono text-sm">{clause}</pre>
          </div>
        )}
      </main>
    </div>
  );
}
