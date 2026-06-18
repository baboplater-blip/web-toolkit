'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

type CombiningMode = 'strike' | 'underline' | 'overline';

interface ModeOption {
  value: CombiningMode;
  label: string;
  /** 각 글자 뒤에 덧붙일 유니코드 결합 문자. */
  combining: string;
}

const MODES: ModeOption[] = [
  { value: 'strike', label: '취소선', combining: '̶' }, // U+0336 COMBINING LONG STROKE OVERLAY
  { value: 'underline', label: '밑줄', combining: '̲' }, // U+0332 COMBINING LOW LINE
  { value: 'overline', label: '윗줄', combining: '̅' }, // U+0305 COMBINING OVERLINE
];

/**
 * 각 글자(개행 제외) 뒤에 결합 문자를 삽입해 장식 텍스트를 만든다.
 * 개행은 결합 대상이 아니므로 그대로 보존한다. 코드 포인트 단위로 순회해 서로게이트 쌍을 보호한다.
 */
function applyCombining(text: string, combining: string): string {
  let result = '';
  for (const ch of text) {
    result += ch;
    if (ch !== '\n' && ch !== '\r') {
      result += combining;
    }
  }
  return result;
}

export default function StrikethroughTextPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CombiningMode>('strike');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    const option = MODES.find((m) => m.value === mode) ?? MODES[0];
    return applyCombining(input, option.combining);
  }, [input, mode]);

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
    setMode('strike');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="취소선 텍스트" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          유니코드 결합 문자로 취소선·밑줄·윗줄 텍스트를 만듭니다. SNS·프로필 등 서식이 없는 곳에 붙여 쓸 수 있습니다.
        </p>

        <div className="inline-flex flex-wrap gap-0.5 rounded-lg border p-0.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === m.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              aria-pressed={mode === m.value}
            >
              {m.label}
            </button>
          ))}
        </div>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-40 w-full rounded-xl border bg-muted/40 p-3 text-lg"
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
