'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * 단어 하나(영문 알파벳만 포함된 토큰)를 피그 라틴으로 변환한다.
 * - 모음으로 시작: 끝에 vowelSuffix("way"/"yay") 부착
 * - 자음으로 시작: 첫 모음 전까지의 자음 덩어리를 끝으로 옮기고 "ay" 부착
 * 원래 단어의 첫 글자 대문자 여부를 결과에도 보존한다.
 */
function convertWord(word: string, vowelSuffix: string): string {
  if (!word) return word;

  const isCapitalized = word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
  const lower = word.toLowerCase();

  let result: string;
  if (VOWELS.has(lower[0])) {
    result = lower + vowelSuffix;
  } else {
    let firstVowel = -1;
    for (let i = 0; i < lower.length; i += 1) {
      if (VOWELS.has(lower[i])) {
        firstVowel = i;
        break;
      }
    }
    // 모음이 전혀 없는 단어(예: "rhythm" 의 y 미포함 케이스, "tsk")는 그대로 + "ay"
    if (firstVowel <= 0) {
      result = lower + 'ay';
    } else {
      result = lower.slice(firstVowel) + lower.slice(0, firstVowel) + 'ay';
    }
  }

  if (isCapitalized) {
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}

/**
 * 영문 텍스트를 피그 라틴으로 변환한다.
 * 알파벳 토큰만 변환하고, 공백·구두점 등 비알파벳 문자는 위치 그대로 보존한다.
 */
function toPigLatin(input: string, vowelSuffix: string): string {
  return input.replace(/[A-Za-z]+/g, (word) => convertWord(word, vowelSuffix));
}

export default function PigLatinPage() {
  const [input, setInput] = useState('');
  const [vowelSuffix, setVowelSuffix] = useState<'way' | 'yay'>('way');
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => (input ? toPigLatin(input, vowelSuffix) : ''),
    [input, vowelSuffix],
  );

  function reset() {
    setInput('');
    setVowelSuffix('way');
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pig-latin.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="피그 라틴 변환" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          영어 텍스트를 단어별로 피그 라틴으로 변환합니다. 대소문자와 구두점은 보존됩니다.
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            모음 시작 접미사
            <select
              className="rounded-lg border bg-background px-2 py-1 text-sm"
              value={vowelSuffix}
              onChange={(e) => setVowelSuffix(e.target.value === 'yay' ? 'yay' : 'way')}
              aria-label="모음 시작 접미사"
            >
              <option value="way">way (apple → appleway)</option>
              <option value="yay">yay (apple → appleyay)</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type English text here"
            aria-label="입력"
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="결과"
            aria-label="결과"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!output}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
