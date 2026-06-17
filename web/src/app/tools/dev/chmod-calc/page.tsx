'use client';

import { useMemo, useState } from 'react';
import { Lock, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Scope = 'owner' | 'group' | 'other';
type Perm = 'r' | 'w' | 'x';

const SCOPES: ReadonlyArray<{ id: Scope; label: string }> = [
  { id: 'owner', label: '소유자 (owner)' },
  { id: 'group', label: '그룹 (group)' },
  { id: 'other', label: '기타 (other)' },
];
const PERMS: ReadonlyArray<{ id: Perm; label: string; bit: number }> = [
  { id: 'r', label: '읽기 (r)', bit: 4 },
  { id: 'w', label: '쓰기 (w)', bit: 2 },
  { id: 'x', label: '실행 (x)', bit: 1 },
];

type PermState = Record<Scope, Record<Perm, boolean>>;

const EMPTY_STATE: PermState = {
  owner: { r: false, w: false, x: false },
  group: { r: false, w: false, x: false },
  other: { r: false, w: false, x: false },
};

function scopeDigit(scope: Record<Perm, boolean>): number {
  return (scope.r ? 4 : 0) + (scope.w ? 2 : 0) + (scope.x ? 1 : 0);
}

function scopeSymbol(scope: Record<Perm, boolean>): string {
  return `${scope.r ? 'r' : '-'}${scope.w ? 'w' : '-'}${scope.x ? 'x' : '-'}`;
}

function toOctal(state: PermState): string {
  return `${scopeDigit(state.owner)}${scopeDigit(state.group)}${scopeDigit(state.other)}`;
}

function toSymbolic(state: PermState): string {
  return `${scopeSymbol(state.owner)}${scopeSymbol(state.group)}${scopeSymbol(state.other)}`;
}

function digitToScope(digit: number): Record<Perm, boolean> {
  return {
    r: (digit & 4) !== 0,
    w: (digit & 2) !== 0,
    x: (digit & 1) !== 0,
  };
}

/** "755" 형태 3자리 8진수 → PermState. 형식이 어긋나면 null. */
function parseOctal(text: string): PermState | null {
  const trimmed = text.trim();
  if (!/^[0-7]{3}$/.test(trimmed)) return null;
  return {
    owner: digitToScope(Number(trimmed[0])),
    group: digitToScope(Number(trimmed[1])),
    other: digitToScope(Number(trimmed[2])),
  };
}

export default function ChmodCalcPage() {
  const [state, setState] = useState<PermState>(EMPTY_STATE);
  const [octalInput, setOctalInput] = useState('000');
  const [copied, setCopied] = useState<'octal' | 'symbolic' | null>(null);

  const octal = useMemo(() => toOctal(state), [state]);
  const symbolic = useMemo(() => toSymbolic(state), [state]);

  function togglePerm(scope: Scope, perm: Perm) {
    setState((prev) => {
      const next: PermState = {
        owner: { ...prev.owner },
        group: { ...prev.group },
        other: { ...prev.other },
      };
      next[scope][perm] = !next[scope][perm];
      setOctalInput(toOctal(next));
      return next;
    });
  }

  function handleOctalChange(value: string) {
    setOctalInput(value);
    const parsed = parseOctal(value);
    if (parsed) setState(parsed);
  }

  const octalError = parseOctal(octalInput) === null ? '8진수는 0~7 사이 숫자 3자리여야 합니다 (예: 755).' : null;

  async function copyValue(kind: 'octal' | 'symbolic', text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied((current) => (current === kind ? null : current)), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setState(EMPTY_STATE);
    setOctalInput('000');
    setCopied(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="chmod 계산기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 text-primary" aria-hidden />
          Unix 파일 권한을 8진수·기호 표기로 상호 변환합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          {SCOPES.map((scope) => (
            <div key={scope.id} className="space-y-1.5">
              <p className="text-sm font-medium">{scope.label}</p>
              <div className="flex flex-wrap gap-4">
                {PERMS.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={state[scope.id][perm.id]}
                      onChange={() => togglePerm(scope.id, perm.id)}
                      className="h-4 w-4"
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">8진수 직접 입력</span>
          <Input
            inputMode="numeric"
            value={octalInput}
            onChange={(event) => handleOctalChange(event.target.value)}
            placeholder="예: 755"
            maxLength={3}
            aria-invalid={octalError !== null}
          />
        </label>

        {octalError && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {octalError}
          </div>
        )}

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">8진수</p>
              <p className="font-mono text-2xl font-bold tabular-nums">{octal}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => copyValue('octal', octal)} aria-label="8진수 복사">
              {copied === 'octal' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === 'octal' ? '복사됨' : '복사'}
            </Button>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <div>
              <p className="text-xs text-muted-foreground">기호 표기</p>
              <p className="font-mono text-2xl font-bold">{symbolic}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => copyValue('symbolic', symbolic)} aria-label="기호 표기 복사">
              {copied === 'symbolic' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === 'symbolic' ? '복사됨' : '복사'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
