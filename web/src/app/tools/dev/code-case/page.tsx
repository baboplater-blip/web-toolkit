'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 식별자를 케이스 경계(대문자·_·-·공백·숫자 경계) 기준으로 토큰 분리. */
function tokenize(identifier: string): string[] {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);
}

const CASES: ReadonlyArray<{ label: string; convert: (tokens: string[]) => string }> = [
  {
    label: 'camelCase',
    convert: (tokens) => tokens.map((token, index) => (index === 0 ? token : capitalize(token))).join(''),
  },
  { label: 'PascalCase', convert: (tokens) => tokens.map(capitalize).join('') },
  { label: 'snake_case', convert: (tokens) => tokens.join('_') },
  { label: 'kebab-case', convert: (tokens) => tokens.join('-') },
  { label: 'CONSTANT_CASE', convert: (tokens) => tokens.map((token) => token.toUpperCase()).join('_') },
  { label: 'Title Case', convert: (tokens) => tokens.map(capitalize).join(' ') },
];

function capitalize(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1);
}

/** 각 케이스에 대해 입력 줄별 변환 결과를 줄바꿈으로 합친다. */
function convertAll(input: string): Array<{ label: string; value: string }> {
  const lines = input.split('\n');
  return CASES.map(({ label, convert }) => ({
    label,
    value: lines
      .map((line) => {
        const tokens = tokenize(line);
        return tokens.length === 0 ? '' : convert(tokens);
      })
      .join('\n'),
  }));
}

export default function CodeCasePage() {
  const [input, setInput] = useState('');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const results = useMemo(() => (input.trim() ? convertAll(input) : []), [input]);

  async function copy(label: string, value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel((current) => (current === label ? null : current)), 2000);
    } catch (e) {
      console.error('clipboard write failed', e);
    }
  }

  function reset() {
    setInput('');
    setCopiedLabel(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="코드 식별자 케이스 변환" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          식별자를 camelCase·PascalCase·snake_case·kebab-case·CONSTANT_CASE·Title Case 로 변환합니다. 여러 줄 입력 시 줄별로 변환됩니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">식별자</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="userProfileId 또는 user-profile-id"
            className="font-mono"
          />
        </label>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm">{value}</pre>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(label, value)} className="shrink-0">
                  {copiedLabel === label ? '복사됨' : '복사'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
