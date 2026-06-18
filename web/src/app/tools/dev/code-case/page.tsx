'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { convertAll } from '@/lib/tools/code-case';

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
