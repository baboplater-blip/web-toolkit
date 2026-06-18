'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

type ScriptMode = 'super' | 'sub';

// 위첨자 유니코드 매핑. 매핑이 없는 글자는 원본을 그대로 유지한다.
const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ',
  k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ',
  v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  A: 'ᴬ', B: 'ᴮ', D: 'ᴰ', E: 'ᴱ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ', K: 'ᴷ', L: 'ᴸ',
  M: 'ᴹ', N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', R: 'ᴿ', T: 'ᵀ', U: 'ᵁ', V: 'ⱽ', W: 'ᵂ',
};

// 아래첨자 유니코드 매핑. 매핑이 없는 글자는 원본을 그대로 유지한다.
const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ',
  p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
};

/** 모드별 매핑으로 글자를 변환한다. 매핑이 없으면 원본 글자를 유지한다. */
function convert(text: string, mode: ScriptMode): string {
  const table = mode === 'super' ? SUPERSCRIPT : SUBSCRIPT;
  let result = '';
  for (const ch of text) {
    result += table[ch] ?? ch;
  }
  return result;
}

export default function SuperscriptTextPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ScriptMode>('super');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => (input ? convert(input, mode) : ''), [input, mode]);

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
    setMode('super');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="위·아래 첨자 텍스트" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          유니코드 위첨자·아래첨자로 변환합니다. 변환 가능한 글자만 바뀌고 나머지는 원본을 유지합니다.
        </p>

        <div className="inline-flex gap-0.5 rounded-lg border p-0.5">
          <button
            type="button"
            onClick={() => setMode('super')}
            className={`rounded-md px-3 py-1.5 text-sm ${mode === 'super' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            aria-pressed={mode === 'super'}
          >
            위첨자 (x²)
          </button>
          <button
            type="button"
            onClick={() => setMode('sub')}
            className={`rounded-md px-3 py-1.5 text-sm ${mode === 'sub' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            aria-pressed={mode === 'sub'}
          >
            아래첨자 (H₂O)
          </button>
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
