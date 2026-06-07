'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, Copy, Dices, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 외우기 쉬운 짧은 영어 단어 목록 (290개).
 * 길이는 2의 거듭제곱이 아니어도 무방하며, 거부 표집(rejection sampling)으로
 * 균등 분포를 보장한다.
 */
const WORDLIST: ReadonlyArray<string> = [
  'able', 'acid', 'aged', 'also', 'area', 'army', 'away', 'baby', 'back', 'ball',
  'band', 'bank', 'base', 'bath', 'bear', 'beat', 'been', 'beer', 'bell', 'belt',
  'bent', 'best', 'bird', 'bite', 'blue', 'boat', 'body', 'bone', 'book', 'boom',
  'boot', 'born', 'boss', 'both', 'bowl', 'bulk', 'burn', 'bush', 'busy', 'cake',
  'call', 'calm', 'came', 'camp', 'card', 'care', 'case', 'cash', 'cast', 'cell',
  'chat', 'chip', 'city', 'clay', 'club', 'clue', 'coal', 'coat', 'code', 'cold',
  'come', 'cook', 'cool', 'cope', 'copy', 'core', 'corn', 'cost', 'crew', 'crop',
  'dark', 'data', 'date', 'dawn', 'days', 'dead', 'deal', 'dean', 'dear', 'debt',
  'deck', 'deep', 'deer', 'desk', 'dial', 'diet', 'dirt', 'dish', 'dock', 'does',
  'done', 'door', 'dose', 'down', 'draw', 'drew', 'drop', 'drug', 'drum', 'dual',
  'duck', 'dust', 'duty', 'each', 'earn', 'ease', 'east', 'easy', 'edge', 'else',
  'even', 'ever', 'evil', 'exit', 'face', 'fact', 'fail', 'fair', 'fall', 'farm',
  'fast', 'fate', 'fear', 'feed', 'feel', 'feet', 'fell', 'file', 'fill', 'film',
  'find', 'fine', 'fire', 'firm', 'fish', 'five', 'flag', 'flat', 'flow', 'food',
  'foot', 'ford', 'form', 'fort', 'four', 'free', 'frog', 'from', 'fuel', 'full',
  'fund', 'gain', 'game', 'gate', 'gave', 'gear', 'gift', 'girl', 'give', 'glad',
  'goal', 'goat', 'goes', 'gold', 'golf', 'gone', 'good', 'gray', 'grew', 'grid',
  'grow', 'gulf', 'hair', 'half', 'hall', 'hand', 'hang', 'hard', 'harm', 'hat',
  'have', 'head', 'hear', 'heat', 'held', 'hell', 'help', 'herb', 'hero', 'hide',
  'high', 'hill', 'hint', 'hire', 'hold', 'hole', 'holy', 'home', 'hope', 'horn',
  'host', 'hour', 'huge', 'hung', 'hunt', 'hurt', 'icon', 'idea', 'inch', 'into',
  'iron', 'item', 'jazz', 'join', 'jump', 'jury', 'just', 'keen', 'keep', 'kept',
  'kick', 'kind', 'king', 'knee', 'knew', 'know', 'lack', 'lady', 'laid', 'lake',
  'lamp', 'land', 'lane', 'last', 'late', 'lawn', 'lazy', 'lead', 'leaf', 'lean',
  'left', 'lend', 'lens', 'less', 'life', 'lift', 'like', 'line', 'link', 'lion',
  'list', 'live', 'load', 'loan', 'lock', 'logo', 'lone', 'long', 'look', 'loop',
  'lord', 'lose', 'loss', 'lost', 'loud', 'love', 'luck', 'mail', 'main', 'make',
  'male', 'mall', 'many', 'maple', 'mark', 'mass', 'mate', 'meal', 'mean', 'meat',
  'meet', 'menu', 'mere', 'mild', 'mile', 'milk', 'mill', 'mind', 'mine', 'mint',
];

const SEPARATORS = [
  { value: '-', label: '하이픈 ( - )' },
  { value: ' ', label: '공백 ( )' },
  { value: '.', label: '마침표 ( . )' },
  { value: '_', label: '밑줄 ( _ )' },
  { value: ',', label: '쉼표 ( , )' },
] as const;

const MIN_WORDS = 4;
const MAX_WORDS = 10;

/**
 * crypto.getRandomValues 로 [0, max) 범위의 균등 분포 정수를 뽑는다.
 * 32비트 난수에서 max 의 배수 경계를 넘는 값은 버려 편향을 제거한다.
 */
function secureRandomInt(max: number): number {
  if (max <= 0) throw new Error('max must be positive');
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

interface GenerateOptions {
  wordCount: number;
  separator: string;
  capitalizeWords: boolean;
  appendNumber: boolean;
}

function generatePassphrase(options: GenerateOptions): string {
  const words: string[] = [];
  for (let i = 0; i < options.wordCount; i++) {
    const word = WORDLIST[secureRandomInt(WORDLIST.length)];
    words.push(options.capitalizeWords ? capitalize(word) : word);
  }
  let phrase = words.join(options.separator);
  if (options.appendNumber) {
    // 0~9999 범위의 난수 추가로 추가 엔트로피 확보
    phrase += options.separator + secureRandomInt(10000).toString().padStart(4, '0');
  }
  return phrase;
}

export default function DicewarePage() {
  const [wordCount, setWordCount] = useState(5);
  const [separator, setSeparator] = useState<string>('-');
  const [capitalizeWords, setCapitalizeWords] = useState(false);
  const [appendNumber, setAppendNumber] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [copied, setCopied] = useState(false);

  // 단어 목록 선택분 엔트로피 (숫자 추가분은 별도 안내)
  const wordEntropy = useMemo(
    () => wordCount * Math.log2(WORDLIST.length),
    [wordCount],
  );

  const generate = useCallback(() => {
    const result = generatePassphrase({ wordCount, separator, capitalizeWords, appendNumber });
    setPassphrase(result);
    setCopied(false);
  }, [wordCount, separator, capitalizeWords, appendNumber]);

  async function copy(): Promise<void> {
    if (!passphrase) return;
    try {
      await navigator.clipboard.writeText(passphrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[diceware] clipboard write failed', err);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Dices className="h-5 w-5 text-primary" aria-hidden />
          Diceware 패스프레이즈
        </h1>
        <p className="text-sm text-muted-foreground">
          외우기 쉬운 단어 조합 패스프레이즈를 안전한 난수로 생성합니다.
        </p>
      </header>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <label className="block space-y-1.5">
          <span className="flex items-center justify-between text-sm font-medium">
            <span>단어 수</span>
            <span className="font-mono text-muted-foreground">{wordCount}개</span>
          </span>
          <input
            type="range"
            min={MIN_WORDS}
            max={MAX_WORDS}
            step={1}
            value={wordCount}
            onChange={(event) => setWordCount(Number(event.target.value))}
            className="w-full accent-primary"
            aria-label="단어 수"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">구분자</span>
          <select
            value={separator}
            onChange={(event) => setSeparator(event.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="구분자"
          >
            {SEPARATORS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={capitalizeWords}
              onChange={(event) => setCapitalizeWords(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            각 단어 첫 글자 대문자
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={appendNumber}
              onChange={(event) => setAppendNumber(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            끝에 4자리 숫자 추가
          </label>
        </div>

        <Button onClick={generate} className="w-full">
          <RefreshCw className="h-4 w-4" />
          패스프레이즈 생성
        </Button>
      </div>

      {passphrase && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="break-all rounded-lg bg-muted p-3 text-center font-mono text-base font-medium">
            {passphrase}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              단어 엔트로피 약 {wordEntropy.toFixed(1)} bits
              {appendNumber ? ' (+ 숫자 약 13.3 bits)' : ''}
            </span>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              복사
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        단어는 {WORDLIST.length}개 목록에서 crypto.getRandomValues 로 선택되며, 모든 생성은 브라우저 안에서만
        이루어집니다.
      </p>
    </main>
  );
}
