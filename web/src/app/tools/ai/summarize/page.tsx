'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

/**
 * 추출 요약(extractive summarization) 브라우저 전용 구현.
 *
 * 점수화 절차(단순 단어빈도 → 결합 모델):
 *  1. 본문을 문장 단위로 분리한다(영어·한국어 종결부호·줄바꿈 처리).
 *  2. TF(불용어 제외 단어빈도, 최대빈도 정규화)로 단어 가중치를 만든다.
 *  3. 문장 간 코사인 유사도 그래프로 TextRank(PageRank 변형) 점수를 구한다.
 *  4. 최종 점수 = TextRank·TF·위치(앞문단 가중)·제목 유사도의 가중 결합.
 *  5. 상위 N 문장을 골라 원문 순서로 재배열한다.
 *
 * 키워드는 TF 가중 상위 토큰에서 추출한다.
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

// 입력 길이 상한. 매우 긴 본문은 O(n^2) 유사도 그래프가 무거워지므로 안전 상한을 둔다.
const MAX_SENTENCES = 400;

interface ScoredSentence {
  text: string;
  index: number;
  score: number;
  tokenCount: number;
}

interface SummaryResult {
  summary: string;
  keywords: string[];
  sourceChars: number;
  summaryChars: number;
  sourceSentences: number;
  summarySentences: number;
}

/**
 * 본문을 문장 배열로 분리한다. 영어 종결부호(. ! ?)와 한중일 종결부호(。！？)·
 * 줄바꿈을 경계로 사용하되, 종결부호 자체는 문장 끝에 남긴다.
 */
function splitSentences(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n');
  const rawParts = normalized.split(/(?<=[.!?。！？])\s+|\n+/);
  return rawParts
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** 문장에서 점수 산정용 단어 토큰을 추출한다(소문자화, 불용어·짧은 토큰 제외). */
function tokenize(sentence: string): string[] {
  const tokens = sentence
    .toLowerCase()
    .split(/[^0-9a-z가-힣぀-ヿ一-鿿]+/)
    .filter((token) => token.length > 0);
  return tokens.filter((token) => {
    if (STOP_WORDS.has(token)) return false;
    // 한 글자 라틴/숫자 토큰은 의미가 약하므로 제외(한글 한 글자는 유지).
    if (token.length === 1 && /[a-z0-9]/.test(token)) return false;
    return true;
  });
}

/** 문장 배열로부터 단어 빈도 가중치를 계산한다(최대 빈도로 정규화). */
function buildWordWeights(tokensPerSentence: string[][]): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const tokens of tokensPerSentence) {
    for (const token of tokens) {
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

/** 토큰 배열을 단어→빈도 맵(벡터)으로 만든다. */
function toTermVector(tokens: string[]): Map<string, number> {
  const vector = new Map<string, number>();
  for (const token of tokens) {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  }
  return vector;
}

/** 두 단어빈도 벡터의 코사인 유사도. */
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  // 더 작은 맵을 순회해 교집합 내적을 구한다.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [token, count] of small) {
    const other = large.get(token);
    if (other !== undefined) dot += count * other;
  }
  if (dot === 0) return 0;

  let magA = 0;
  for (const count of a.values()) magA += count * count;
  let magB = 0;
  for (const count of b.values()) magB += count * count;

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * TextRank 점수를 계산한다. 문장을 노드로, 코사인 유사도를 가중 간선으로 하는
 * 그래프에서 가중 PageRank 를 수렴까지 반복한다.
 */
function computeTextRank(vectors: Map<string, number>[]): number[] {
  const count = vectors.length;
  if (count === 0) return [];
  if (count === 1) return [1];

  // 유사도 행렬(대칭)과 행 합(정규화용)을 동시에 만든다.
  const similarity: number[][] = Array.from({ length: count }, () => new Array<number>(count).fill(0));
  const rowSum = new Array<number>(count).fill(0);

  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      similarity[i][j] = sim;
      similarity[j][i] = sim;
      rowSum[i] += sim;
      rowSum[j] += sim;
    }
  }

  const damping = 0.85;
  const base = (1 - damping) / count;
  let scores = new Array<number>(count).fill(1 / count);

  // 최대 50회 반복하거나 수렴(L1 변화 < 1e-6)하면 종료.
  for (let iteration = 0; iteration < 50; iteration += 1) {
    const next = new Array<number>(count).fill(base);
    for (let j = 0; j < count; j += 1) {
      if (rowSum[j] === 0) continue;
      const contribution = (damping * scores[j]) / rowSum[j];
      for (let i = 0; i < count; i += 1) {
        if (i === j) continue;
        const weight = similarity[j][i];
        if (weight > 0) next[i] += contribution * weight;
      }
    }

    let delta = 0;
    for (let i = 0; i < count; i += 1) delta += Math.abs(next[i] - scores[i]);
    scores = next;
    if (delta < 1e-6) break;
  }

  return scores;
}

/** 0~1 범위로 정규화한다(전부 동일하면 0.5). */
function normalize(values: number[]): number[] {
  if (values.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const range = max - min;
  if (range === 0) return values.map(() => 0.5);
  return values.map((value) => (value - min) / range);
}

/** TF 가중 상위 키워드를 추출한다. */
function extractKeywords(weights: Map<string, number>, limit: number): string[] {
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * 추출 요약을 생성한다.
 * @param text 원문
 * @param ratio 0.1~0.9 목표 요약 비율
 * @param keywordCount 추출할 키워드 개수
 */
function summarize(text: string, ratio: number, keywordCount: number): SummaryResult {
  const trimmed = text.trim();
  const sourceChars = trimmed.length;
  const allSentences = splitSentences(trimmed);

  // 첫 문장(또는 첫 줄)을 제목 후보로 본다 — 제목 유사도 가중에 사용.
  const firstLine = trimmed.split('\n', 1)[0]?.trim() ?? '';

  if (allSentences.length <= 1) {
    const tokensPerSentence = allSentences.map(tokenize);
    const weights = buildWordWeights(tokensPerSentence);
    return {
      summary: trimmed,
      keywords: extractKeywords(weights, keywordCount),
      sourceChars,
      summaryChars: trimmed.length,
      sourceSentences: allSentences.length,
      summarySentences: allSentences.length,
    };
  }

  // 안전 상한 초과 시 앞쪽 문장만 사용(긴 문서는 보통 앞부분이 핵심).
  const sentences = allSentences.slice(0, MAX_SENTENCES);

  const tokensPerSentence = sentences.map(tokenize);
  const weights = buildWordWeights(tokensPerSentence);
  const vectors = tokensPerSentence.map(toTermVector);
  const titleVector = toTermVector(tokenize(firstLine));

  // TF 점수: 문장 단어 가중치 합 / sqrt(길이).
  const tfScores = tokensPerSentence.map((tokens) => {
    if (tokens.length === 0) return 0;
    let sum = 0;
    for (const token of tokens) sum += weights.get(token) ?? 0;
    return sum / Math.sqrt(tokens.length);
  });

  // TextRank 점수.
  const textRankScores = computeTextRank(vectors);

  // 위치 점수: 앞쪽일수록 높게(선형 감쇠, 1.0 → 0.4).
  const positionScores = sentences.map((_, index) => 1 - (0.6 * index) / sentences.length);

  // 제목 유사도: 첫 줄과의 코사인 유사도(제목이 없으면 0).
  const titleScores = vectors.map((vector) => cosineSimilarity(vector, titleVector));

  const normTf = normalize(tfScores);
  const normRank = normalize(textRankScores);
  const normPos = normalize(positionScores);
  const normTitle = titleVector.size === 0 ? sentences.map(() => 0) : normalize(titleScores);

  // 가중 결합: TextRank 0.45 + TF 0.25 + 위치 0.2 + 제목 0.1.
  const scored: ScoredSentence[] = sentences.map((sentence, index) => ({
    text: sentence,
    index,
    tokenCount: tokensPerSentence[index].length,
    score:
      0.45 * normRank[index] +
      0.25 * normTf[index] +
      0.2 * normPos[index] +
      0.1 * normTitle[index],
  }));

  const targetCount = Math.max(1, Math.min(sentences.length, Math.round(sentences.length * ratio)));

  const topSentences = [...scored]
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .slice(0, targetCount);

  topSentences.sort((a, b) => a.index - b.index);

  const summary = topSentences.map((item) => item.text).join(' ');

  return {
    summary,
    keywords: extractKeywords(weights, keywordCount),
    sourceChars,
    summaryChars: summary.length,
    sourceSentences: allSentences.length,
    summarySentences: topSentences.length,
  };
}

export default function SummarizePage() {
  const [input, setInput] = useState('');
  const [ratioPercent, setRatioPercent] = useState(30);
  const [keywordCount, setKeywordCount] = useState(8);
  const [copied, setCopied] = useState(false);

  // 요약은 O(문장^2) 유사도 그래프로 비싸다. 입력보다 한 박자 늦게 계산해 입력 블로킹을 막는다.
  const deferredInput = useDeferredValue(input);

  const result = useMemo<SummaryResult | null>(() => {
    if (!deferredInput.trim()) return null;
    return summarize(deferredInput, ratioPercent / 100, keywordCount);
  }, [deferredInput, ratioPercent, keywordCount]);

  const compressionPercent = useMemo(() => {
    if (!result || result.sourceChars === 0) return 0;
    return Math.round((1 - result.summaryChars / result.sourceChars) * 100);
  }, [result]);

  const output = result?.summary ?? '';

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
    <div className="min-h-dvh bg-background">
      <ToolHeader title="텍스트 요약(추출)" widthClass="max-w-3xl" onReset={() => setInput('')} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          문장 간 유사도 그래프(TextRank)와 단어빈도·위치·제목 가중을 결합해 핵심 문장을 골라
          요약합니다(모델 불필요, 영·한 지원).
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="summary-ratio" className="text-sm font-medium">
              요약 비율: {ratioPercent}%
            </label>
            {result && (
              <span className="text-xs text-muted-foreground">
                원문 {result.sourceSentences}문장 → 요약 {result.summarySentences}문장
              </span>
            )}
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

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="keyword-count" className="text-sm font-medium">
              키워드 개수: {keywordCount}개
            </label>
          </div>
          <input
            id="keyword-count"
            type="range"
            min={3}
            max={15}
            step={1}
            value={keywordCount}
            onChange={(event) => setKeywordCount(Number(event.target.value))}
            className="w-full"
            aria-label="키워드 개수"
          />
        </div>

        {result && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">원문</p>
              <p className="text-lg font-bold">{result.sourceChars.toLocaleString()}자</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">요약</p>
              <p className="text-lg font-bold">{result.summaryChars.toLocaleString()}자</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">압축률</p>
              <p className="text-lg font-bold">{compressionPercent}%</p>
            </div>
          </div>
        )}

        {result && result.keywords.length > 0 && (
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              핵심 키워드
            </p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

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
          추출 요약은 원문에 있는 문장만 골라냅니다(새 문장을 생성하지 않음). 매우 긴 본문은
          앞쪽 {MAX_SENTENCES.toLocaleString()}문장까지만 분석합니다. 모든 처리는 브라우저
          내부에서 수행되며 입력 텍스트는 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
