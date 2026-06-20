'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { PASSPHRASE_WORDS } from '@/lib/tools/passphrase-words';

const MIN_WORDS = 3;
const MAX_WORDS = 8;

type Separator = '-' | '_' | ' ' | '.';

const SEPARATORS: ReadonlyArray<{ id: Separator; label: string }> = [
  { id: '-', label: '하이픈 ( - )' },
  { id: '_', label: '밑줄 ( _ )' },
  { id: ' ', label: '공백 (   )' },
  { id: '.', label: '마침표 ( . )' },
];

/** crypto 기반 균등 정수 [0, bound) (rejection sampling). bound 는 1 이상. */
function randomBelow(bound: number): number {
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - ((maxUint32 + 1) % bound);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value > limit);
  return value % bound;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function PassphraseGenPage() {
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState<Separator>('-');
  const [capitalizeWords, setCapitalizeWords] = useState(true);
  const [appendNumber, setAppendNumber] = useState(true);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 난수는 클릭 시에만 생성 → 초기 렌더는 결정적(하이드레이션 안전).
  function generate(): void {
    const words: string[] = [];
    for (let i = 0; i < wordCount; i += 1) {
      const word = PASSPHRASE_WORDS[randomBelow(PASSPHRASE_WORDS.length)];
      words.push(capitalizeWords ? capitalize(word) : word);
    }
    let result = words.join(separator);
    if (appendNumber) {
      // 끝에 두 자리 숫자(00~99)를 균등하게 덧붙임.
      result += String(randomBelow(100)).padStart(2, '0');
    }
    setPassphrase(result);
    setCopied(false);
  }

  async function copyPassphrase(): Promise<void> {
    if (!passphrase) return;
    try {
      await navigator.clipboard.writeText(passphrase);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[passphrase-gen] clipboard write failed', err);
      setCopied(false);
    }
  }

  function reset(): void {
    setWordCount(4);
    setSeparator('-');
    setCapitalizeWords(true);
    setAppendNumber(true);
    setPassphrase(null);
    setCopied(false);
  }

  // 엔트로피(비트) ≈ 단어수 × log2(목록 크기) + (숫자 추가 시 log2(100)).
  const bitsPerWord = Math.log2(PASSPHRASE_WORDS.length);
  const entropyBits = Math.round(wordCount * bitsPerWord + (appendNumber ? Math.log2(100) : 0));
  const strengthLabel = entropyBits >= 80 ? '매우 강함' : entropyBits >= 60 ? '강함' : '보통';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="단어 조합 암호 생성기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          외우기 쉬운 다단어 패스프레이즈를 안전 난수로 생성합니다. 단어 목록 {PASSPHRASE_WORDS.length}개.
        </p>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">단어 수: {wordCount}</span>
            <input
              type="range"
              min={MIN_WORDS}
              max={MAX_WORDS}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="단어 수"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">구분자</span>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={separator}
              onChange={(e) => setSeparator(e.target.value as Separator)}
              aria-label="구분자"
            >
              {SEPARATORS.map((sep) => (
                <option key={sep.id} value={sep.id}>
                  {sep.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={capitalizeWords}
              onChange={(e) => setCapitalizeWords(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">각 단어 첫 글자 대문자</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={appendNumber}
              onChange={(e) => setAppendNumber(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">끝에 숫자 추가</span>
          </label>

          <Button onClick={generate}>{passphrase ? '다시 생성' : '생성'}</Button>
        </div>

        <p className="text-xs text-muted-foreground">
          예상 강도: <span className="font-medium text-foreground">{strengthLabel}</span> (약{' '}
          {entropyBits}비트 엔트로피)
        </p>

        {passphrase !== null && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="break-all rounded-lg bg-muted p-3 font-mono text-base text-foreground">
              {passphrase || <span className="text-muted-foreground">결과가 여기에 표시됩니다</span>}
            </p>
            <Button variant="outline" size="sm" onClick={copyPassphrase} aria-label="패스프레이즈 복사">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        )}

        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-muted-foreground">
          ⚠️ 생성된 패스프레이즈는 사이트마다 다르게 쓰고 재사용하지 마세요. 비밀번호 관리자에
          저장하는 것을 권장합니다. 생성은 브라우저 안에서만 이뤄지며 서버로 전송되지 않습니다.
        </div>
      </main>
    </div>
  );
}
