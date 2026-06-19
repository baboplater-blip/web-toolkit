'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Direction = 'encode' | 'decode';
type Strength = 'basic' | 'advanced';

// 기본 치환: 가장 흔하고 가독성 높은 리트 매핑.
const BASIC_MAP: Record<string, string> = {
  a: '4',
  e: '3',
  i: '1',
  o: '0',
  t: '7',
  s: '5',
};

// 고급 치환: 기본에 더해 더 많은 글자를 변형.
const ADVANCED_MAP: Record<string, string> = {
  ...BASIC_MAP,
  l: '1',
  g: '9',
  b: '8',
  z: '2',
  c: '(',
  d: ')',
  h: '#',
  k: '|<',
  m: '/\\/\\',
  n: '|\\|',
  r: '|2',
  u: '|_|',
  v: '\\/',
  w: '\\/\\/',
  x: '><',
  y: '`/',
};

/**
 * 일반 텍스트를 리트스피크로 인코딩한다.
 * 대문자는 동일 매핑을 적용하되 원래 알파벳이 아닌 경우 그대로 둔다.
 */
function encodeLeet(input: string, strength: Strength): string {
  const map = strength === 'advanced' ? ADVANCED_MAP : BASIC_MAP;
  let result = '';
  for (const char of input) {
    const lower = char.toLowerCase();
    result += Object.prototype.hasOwnProperty.call(map, lower) ? map[lower] : char;
  }
  return result;
}

// 디코딩용 역매핑: 긴 토큰을 먼저 치환해야 부분 매칭 오류를 막는다.
const DECODE_PAIRS: ReadonlyArray<readonly [string, string]> = (() => {
  const reverse: Record<string, string> = {};
  // 고급 맵 기준으로 역매핑하되, 단일 숫자 등 모호한 키는 가장 흔한 글자로 고정.
  const preferred: Record<string, string> = {
    '4': 'a',
    '3': 'e',
    '1': 'i',
    '0': 'o',
    '7': 't',
    '5': 's',
    '9': 'g',
    '8': 'b',
    '2': 'z',
    '(': 'c',
    ')': 'd',
    '#': 'h',
    '|<': 'k',
    '/\\/\\': 'm',
    '|\\|': 'n',
    '|2': 'r',
    '|_|': 'u',
    '\\/\\/': 'w',
    '\\/': 'v',
    '><': 'x',
    '`/': 'y',
  };
  Object.assign(reverse, preferred);
  // 길이 내림차순 정렬로 멀티문자 토큰을 우선 매칭.
  return Object.entries(reverse).sort((a, b) => b[0].length - a[0].length);
})();

/**
 * 리트스피크를 최선 추정으로 디코딩한다.
 * 멀티문자 토큰을 먼저 매칭한 뒤 단일문자를 처리한다.
 */
function decodeLeet(input: string): string {
  let result = '';
  let index = 0;
  outer: while (index < input.length) {
    for (const [token, letter] of DECODE_PAIRS) {
      if (input.startsWith(token, index)) {
        result += letter;
        index += token.length;
        continue outer;
      }
    }
    result += input[index];
    index += 1;
  }
  return result;
}

export default function LeetspeakPage() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('encode');
  const [strength, setStrength] = useState<Strength>('basic');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    return direction === 'encode' ? encodeLeet(input, strength) : decodeLeet(input);
  }, [input, direction, strength]);

  function reset() {
    setInput('');
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
    a.download = 'leetspeak.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="리트(1337) 변환기" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          일반 텍스트를 리트스피크로 바꾸거나 리트를 일반 텍스트로 되돌립니다.
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            방향
            <select
              className="rounded-lg border bg-background px-2 py-1 text-sm"
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
              aria-label="변환 방향"
            >
              <option value="encode">리트로</option>
              <option value="decode">일반으로</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            강도
            <select
              className="rounded-lg border bg-background px-2 py-1 text-sm disabled:opacity-50"
              value={strength}
              onChange={(e) => setStrength(e.target.value as Strength)}
              disabled={direction === 'decode'}
              aria-label="치환 강도"
            >
              <option value="basic">기본</option>
              <option value="advanced">고급</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="여기에 입력하세요"
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
