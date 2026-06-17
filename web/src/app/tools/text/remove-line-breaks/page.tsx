'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

type Mode = 'join' | 'space' | 'blank-only';

const MODES: { value: Mode; label: string }[] = [
  { value: 'join', label: '모든 줄바꿈 제거 (한 줄)' },
  { value: 'space', label: '줄바꿈을 공백으로' },
  { value: 'blank-only', label: '빈 줄만 제거' },
];

/** 연속 공백(탭 포함)을 단일 공백으로 정리하고 양끝 공백을 제거한다. */
function collapseSpaces(value: string): string {
  return value.replace(/[ \t]{2,}/g, ' ').trim();
}

export default function RemoveLineBreaksPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('join');
  const [collapse, setCollapse] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    let result: string;
    switch (mode) {
      case 'join':
        result = input.replace(/\r?\n/g, '');
        break;
      case 'space':
        result = input.replace(/\r?\n/g, ' ');
        break;
      case 'blank-only':
        result = input.replace(/(\r?\n)[ \t]*(\r?\n)+/g, '$1');
        break;
      default:
        result = input;
    }
    return collapse ? collapseSpaces(result) : result;
  }, [input, mode, collapse]);

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    setInput('');
    setMode('join');
    setCollapse(false);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="줄바꿈 제거" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          줄바꿈을 제거해 한 줄로 합치거나 공백으로 바꿉니다.
        </p>

        <fieldset className="space-y-2 rounded-xl border bg-card p-4">
          <legend className="px-1 text-sm font-medium">변환 모드</legend>
          {MODES.map((m) => (
            <label key={m.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
              />
              {m.label}
            </label>
          ))}
          <label className="mt-2 flex items-center gap-2 border-t pt-2 text-sm">
            <input
              type="checkbox"
              checked={collapse}
              onChange={(e) => setCollapse(e.target.checked)}
            />
            연속 공백 정리
          </label>
        </fieldset>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-40 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />

        <Button onClick={copy} disabled={!output}>
          {copied ? '복사됨' : '복사'}
        </Button>
      </main>
    </div>
  );
}
