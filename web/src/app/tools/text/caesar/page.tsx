'use client';

import { useMemo, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ALPHABET_SIZE = 26;
const UPPER_A = 'A'.charCodeAt(0);
const LOWER_A = 'a'.charCodeAt(0);

/**
 * 시저 암호로 텍스트를 시프트한다.
 * 영문 대소문자만 이동하고 그 외 문자는 보존한다.
 * shift 는 음수도 허용하며 26으로 정규화한다.
 */
function caesarShift(text: string, shift: number): string {
  const normalized = ((shift % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
  if (normalized === 0) return text;

  let result = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= UPPER_A && code < UPPER_A + ALPHABET_SIZE) {
      result += String.fromCharCode(((code - UPPER_A + normalized) % ALPHABET_SIZE) + UPPER_A);
    } else if (code >= LOWER_A && code < LOWER_A + ALPHABET_SIZE) {
      result += String.fromCharCode(((code - LOWER_A + normalized) % ALPHABET_SIZE) + LOWER_A);
    } else {
      result += char;
    }
  }
  return result;
}

export default function CaesarCipherPage() {
  const [input, setInput] = useState('');
  const [shift, setShift] = useState(3);
  const [decrypt, setDecrypt] = useState(false);

  // 복호화는 반대 방향 시프트
  const effectiveShift = decrypt ? -shift : shift;

  const output = useMemo(() => {
    if (!input) return '';
    return caesarShift(input, effectiveShift);
  }, [input, effectiveShift]);

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'caesar-cipher.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <LockKeyhole className="h-5 w-5 text-primary" aria-hidden />
          시저·ROT13 암호
        </h1>
        <p className="text-sm text-muted-foreground">
          텍스트를 시저 암호(자리 이동)·ROT13으로 암·복호화합니다. 영문 대소문자만 이동하며 나머지는
          보존합니다.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="flex items-center justify-between text-sm font-medium">
            <span>시프트</span>
            <span className="font-mono text-muted-foreground">{shift}</span>
          </span>
          <input
            type="range"
            min={0}
            max={25}
            value={shift}
            onChange={(e) => setShift(Number(e.target.value))}
            className="w-full"
            aria-label="시프트 값"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShift(13)}>
            ROT13
          </Button>
          <Button variant={decrypt ? 'default' : 'outline'} onClick={() => setDecrypt((v) => !v)}>
            {decrypt ? '복호화 모드' : '암호화 모드'}
          </Button>
        </div>
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
          복사
        </Button>
        <Button variant="outline" onClick={download} disabled={!output}>
          다운로드
        </Button>
      </div>
    </main>
  );
}
