'use client';

import { useEffect, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Unit = 'word' | 'sentence' | 'paragraph';

const UNITS: { value: Unit; label: string }[] = [
  { value: 'word', label: '단어' },
  { value: 'sentence', label: '문장' },
  { value: 'paragraph', label: '문단' },
];

// 자연스러운 한글 단어 풀.
const WORDS = [
  '바람', '하늘', '구름', '바다', '나무', '햇살', '강물', '들판', '언덕', '골목',
  '아침', '저녁', '계절', '시간', '기억', '생각', '마음', '이야기', '풍경', '거리',
  '사람', '친구', '여행', '음악', '그림', '편지', '약속', '미소', '향기', '온기',
  '조용히', '천천히', '가만히', '문득', '어느덧', '잔잔한', '맑은', '고요한', '따뜻한', '서늘한',
  '흐르는', '빛나는', '피어나는', '스며드는', '머무는', '깊은', '넓은', '오래된', '새로운', '낯선',
  '봄날', '여름밤', '가을빛', '겨울잠', '새벽', '노을', '별빛', '달빛', '안개', '이슬',
];

const MIN_COUNT = 1;
const MAX_COUNT = 100;

/** xmur3 시드 → mulberry32 PRNG. 결정적이며 외부 의존성이 없다. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function buildSentence(rng: () => number): string {
  const length = 5 + Math.floor(rng() * 8); // 5~12 단어
  const words: string[] = [];
  for (let i = 0; i < length; i += 1) words.push(pick(WORDS, rng));
  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

function buildParagraph(rng: () => number): string {
  const length = 3 + Math.floor(rng() * 4); // 3~6 문장
  const sentences: string[] = [];
  for (let i = 0; i < length; i += 1) sentences.push(buildSentence(rng));
  return sentences.join(' ');
}

function generateText(unit: Unit, count: number, seed: number): string {
  const rng = makeRng(seed);
  const clamped = Math.min(MAX_COUNT, Math.max(MIN_COUNT, count));
  switch (unit) {
    case 'word': {
      const words: string[] = [];
      for (let i = 0; i < clamped; i += 1) words.push(pick(WORDS, rng));
      return words.join(' ');
    }
    case 'sentence': {
      const sentences: string[] = [];
      for (let i = 0; i < clamped; i += 1) sentences.push(buildSentence(rng));
      return sentences.join(' ');
    }
    case 'paragraph': {
      const paragraphs: string[] = [];
      for (let i = 0; i < clamped; i += 1) paragraphs.push(buildParagraph(rng));
      return paragraphs.join('\n\n');
    }
    default:
      return '';
  }
}

export default function LoremKoPage() {
  const [unit, setUnit] = useState<Unit>('paragraph');
  const [countText, setCountText] = useState('3');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const count = (() => {
    const parsed = Number.parseInt(countText, 10);
    if (Number.isNaN(parsed)) return MIN_COUNT;
    return Math.min(MAX_COUNT, Math.max(MIN_COUNT, parsed));
  })();

  function generate() {
    setOutput(generateText(unit, count, Date.now()));
    setCopied(false);
  }

  // 하이드레이션 안전: 초기 렌더는 빈 결과, 마운트 후 1회 생성한다. 의도된 패턴.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOutput(generateText('paragraph', 3, Date.now()));
  }, []);

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
    setUnit('paragraph');
    setCountText('3');
    setOutput(generateText('paragraph', 3, Date.now()));
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="한글 더미 텍스트" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          디자인용 한글 가짜 본문(로렘 입숨)을 생성합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">단위</span>
            <select
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              aria-label="단위"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">개수</span>
            <Input
              type="number"
              min={MIN_COUNT}
              max={MAX_COUNT}
              value={countText}
              onChange={(e) => setCountText(e.target.value)}
              aria-label="개수"
            />
          </label>
          <Button onClick={generate}>생성</Button>
        </div>

        <textarea
          className="min-h-48 w-full whitespace-pre-wrap rounded-xl border bg-muted/40 p-3 text-sm"
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
