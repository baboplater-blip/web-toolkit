'use client';

import { useMemo, useState } from 'react';
import { AlignLeft, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 추출 요약(extractive summarization) 브라우저 전용 구현.
 *
 * 절차:
 *  1. 본문을 문장 단위로 분리한다(영어·한국어 종결부호 모두 처리).
 *  2. 불용어를 제외한 단어 빈도를 집계해 단어 가중치를 만든다.
 *  3. 각 문장의 점수 = 포함 단어 가중치 합 / sqrt(단어 수) (긴 문장 편향 완화).
 *  4. 점수 상위 N 문장을 고른 뒤 원문 등장 순서로 재배열해 출력한다.
 *
 * 모델·네트워크 없이 동작하며 입력은 서버로 전송되지 않는다.
 */

// 영어 불용어 + 한국어 조사·흔한 기능어. 점수 계산에서 제외한다.
const STOP_WORDS = new Set<string>([
  // English
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by', 'for',
  'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'of', 'this', 'that', 'these', 'those', 'it', 'its', 'as',
  'so', 'than', 'too', 'very', 'can', 'will', 'just', 'not', 'no', 'nor', 'only', 'own',
  'same', 'such', 'i', 'you', 'he', 'she', 'we', 'they', 'them', 'his', 'her', 'their',
  'our', 'your', 'my', 'me', 'him', 'us', 'what', 'which', 'who', 'whom', 'there', 'here',
  // Korean (조사·접속어·지시어)
  '그리고', '그러나', '그런데', '하지만', '또한', '그래서', '따라서', '즉', '및', '등',
  '이', '그', '저', '것', '수', '때', '더', '못', '안', '잘', '를', '을', '에', '의',
  '가', '은', '는', '도', '로', '으로', '에서', '에게', '한', '하다', '있다', '없다',
  '되다', '같이', '대해', '위해', '통해', '대한', '또는',
]);

interface ScoredSentence {
  text: string;
  index: number;
  score: number;
}

/**
 * 본문을 문장 배열로 분리한다. 영어 종결부호(. ! ?)와 한국어 종결부호(。 및 줄바꿈)를
 * 경계로 사용하되, 종결부호 자체는 문장 끝에 남긴다.
 */
function splitSentences(text: string): string[] {
  // 줄바꿈은 강한 경계로 취급하고, 그 외에는 종결부호 뒤 공백을 경계로 본다.
  const normalized = text.replace(/\r\n/g, '\n');
  const rawParts = normalized
    // 종결부호(영문/한중일) 뒤에서 분할. 종결부호는 lookbehind 로 보존.
    .split(/(?<=[.!?。！？])\s+|\n+/);
  return rawParts
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** 문장에서 점수 산정용 단어 토큰을 추출한다(소문자화, 불용어·짧은 토큰 제외). */
function tokenize(sentence: string): string[] {
  // 영문/숫자/한글/일부 문자 단위로 분리.
  const tokens = sentence
    .toLowerCase()
    .split(/[^0-9a-z가-힣぀-ヿ一-鿿]+/)
    .filter((token) => token.length > 0);
  return tokens.filter((token) => {
    if (STOP_WORDS.has(token)) return false;
    // 한 글자 라틴 토큰은 의미가 약하므로 제외(한글 한 글자는 유지).
    if (token.length === 1 && /[a-z0-9]/.test(token)) return false;
    return true;
  });
}

/**
 * 문장 배열로부터 단어 빈도 가중치를 계산한다(최대 빈도로 정규화).
 */
function buildWordWeights(sentences: string[]): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const sentence of sentences) {
    for (const token of tokenize(sentence)) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }
  }

  let maxFrequency = 0;
  for (const count of frequency.values()) {
    if (count > maxFrequency) maxFrequency = count;
  }

  const weights = new Map<string, number>();
  if (maxFrequency === 0) return weights;
  for (const [word, count] of frequency) {
    weights.set(word, count / maxFrequency);
  }
  return weights;
}

/**
 * 추출 요약을 생성한다. ratio 는 0.1~0.9 사이의 목표 요약 비율.
 */
function summarize(text: string, ratio: number): string {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) {
    return text.trim();
  }

  const weights = buildWordWeights(sentences);

  const scored: ScoredSentence[] = sentences.map((sentence, index) => {
    const tokens = tokenize(sentence);
    if (tokens.length === 0) {
      return { text: sentence, index, score: 0 };
    }
    let sum = 0;
    for (const token of tokens) {
      sum += weights.get(token) ?? 0;
    }
    // sqrt(길이)로 나눠 긴 문장 편향을 완화한다.
    return { text: sentence, index, score: sum / Math.sqrt(tokens.length) };
  });

  // 목표 문장 수: 비율 기반, 최소 1개 ~ 전체 문장 수 사이.
  const targetCount = Math.max(1, Math.min(sentences.length, Math.round(sentences.length * ratio)));

  // 점수 내림차순(동점이면 원문 순서)으로 상위 N개 선택.
  const topSentences = [...scored]
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .slice(0, targetCount);

  // 선택된 문장을 원문 순서로 재배열.
  topSentences.sort((a, b) => a.index - b.index);

  return topSentences.map((item) => item.text).join(' ');
}

export default function SummarizePage() {
  const [input, setInput] = useState('');
  const [ratioPercent, setRatioPercent] = useState(30);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return summarize(input, ratioPercent / 100);
  }, [input, ratioPercent]);

  const stats = useMemo(() => {
    const sourceSentences = splitSentences(input).length;
    const summarySentences = output ? splitSentences(output).length : 0;
    return { sourceSentences, summarySentences };
  }, [input, output]);

  async function copy(): Promise<void> {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[summarize] clipboard write failed', err);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <AlignLeft className="h-5 w-5 text-primary" aria-hidden />
          텍스트 요약(추출)
        </h1>
        <p className="text-sm text-muted-foreground">
          문장 중요도를 분석해 핵심 문장을 골라 요약합니다(모델 불필요, 영·한 지원).
        </p>
      </header>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="summary-ratio" className="text-sm font-medium">
            요약 비율: {ratioPercent}%
          </label>
          <span className="text-xs text-muted-foreground">
            원문 {stats.sourceSentences}문장 → 요약 {stats.summarySentences}문장
          </span>
        </div>
        <input
          id="summary-ratio"
          type="range"
          min={10}
          max={90}
          step={5}
          value={ratioPercent}
          onChange={(event) => setRatioPercent(Number(event.target.value))}
          className="w-full"
          aria-label="요약 비율"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="요약할 본문을 붙여넣으세요."
          aria-label="입력"
        />
        <textarea
          className="min-h-64 rounded-xl border bg-muted/40 p-3 text-sm outline-none"
          value={output}
          readOnly
          placeholder="요약 결과가 여기에 표시됩니다."
          aria-label="요약 결과"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!output}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          복사
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        추출 요약은 원문에 있는 문장만 골라냅니다(새 문장을 생성하지 않음). 모든 처리는 브라우저
        내부에서 수행되며 입력 텍스트는 서버로 전송되지 않습니다.
      </p>
    </main>
  );
}
