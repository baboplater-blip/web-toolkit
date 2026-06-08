'use client';

import { Fragment, useDeferredValue, useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';

/**
 * 사전 기반 감성 분석(브라우저 전용, 모델 불필요).
 *
 * 영어·한국어 긍/부정 단어 사전으로 텍스트를 토큰화해 매칭하고,
 * 매칭 단어 수 차이로 점수·라벨(긍정/중립/부정)을 산출한다.
 * 매칭된 단어는 본문에서 색상으로 하이라이트한다.
 *
 * 모든 처리는 브라우저 내부에서 수행되며 입력은 서버로 전송되지 않는다.
 */

// 긍정 단어 사전(영어 + 한국어 어간). 소문자로 정규화해 비교한다.
const POSITIVE_WORDS = new Set<string>([
  // English
  'good', 'great', 'excellent', 'amazing', 'awesome', 'wonderful', 'fantastic', 'love',
  'loved', 'like', 'liked', 'happy', 'best', 'better', 'nice', 'perfect', 'beautiful',
  'brilliant', 'positive', 'enjoy', 'enjoyed', 'pleasant', 'delightful', 'superb', 'win',
  'success', 'successful', 'recommend', 'recommended', 'satisfied', 'glad', 'thank',
  'thanks', 'helpful', 'impressive', 'gorgeous', 'favorite', 'fun', 'cool', 'safe',
  // Korean (어간/형용사)
  '좋다', '좋아', '좋은', '좋았', '훌륭', '최고', '멋지', '멋진', '행복', '사랑', '만족',
  '추천', '감사', '고마', '기쁘', '기뻐', '편리', '완벽', '뛰어', '즐겁', '즐거', '예쁘',
  '아름', '성공', '대박', '굿', '맘에', '유익', '친절',
]);

// 부정 단어 사전(영어 + 한국어 어간).
const NEGATIVE_WORDS = new Set<string>([
  // English
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'worse', 'hate', 'hated', 'dislike',
  'sad', 'angry', 'poor', 'ugly', 'disappointing', 'disappointed', 'fail', 'failed',
  'failure', 'negative', 'wrong', 'broken', 'bug', 'buggy', 'slow', 'difficult', 'hard',
  'annoying', 'boring', 'useless', 'waste', 'problem', 'issue', 'crash', 'error', 'pain',
  'painful', 'scared', 'fear', 'unhappy', 'nasty', 'rude', 'dirty', 'expensive',
  // Korean (어간/형용사)
  '나쁘', '나쁜', '별로', '최악', '싫다', '싫어', '슬프', '슬퍼', '화나', '짜증', '실망',
  '실패', '불편', '불만', '느리', '느려', '어렵', '힘들', '문제', '오류', '버그', '아프',
  '아픈', '무섭', '지루', '쓸모', '낭비', '엉망', '구리', '더럽',
]);

type Polarity = 'positive' | 'negative' | 'neutral';

interface Token {
  raw: string; // 원문 그대로(공백·구두점 포함)
  polarity: Polarity; // 매칭 결과
}

interface SentimentResult {
  tokens: Token[];
  positiveCount: number;
  negativeCount: number;
  score: number; // -1 ~ 1
  label: '긍정' | '중립' | '부정';
}

/**
 * 한국어는 어미가 붙으므로 토큰이 사전 어간으로 "시작"하거나 어간을 "포함"하면
 * 매칭으로 본다. 라틴 토큰은 정확 일치만 사용해 오탐을 줄인다.
 */
function classifyToken(token: string): Polarity {
  const lower = token.toLowerCase();
  const isLatin = /^[a-z']+$/.test(lower);

  if (isLatin) {
    if (POSITIVE_WORDS.has(lower)) return 'positive';
    if (NEGATIVE_WORDS.has(lower)) return 'negative';
    return 'neutral';
  }

  // 한국어 등: 어간 포함 검사(예: "좋았어요" → "좋았" 포함).
  for (const word of POSITIVE_WORDS) {
    if (/[가-힣]/.test(word) && lower.includes(word)) return 'positive';
  }
  for (const word of NEGATIVE_WORDS) {
    if (/[가-힣]/.test(word) && lower.includes(word)) return 'negative';
  }
  return 'neutral';
}

/**
 * 본문을 토큰(단어 + 사이의 구분자)으로 쪼개고 각 단어의 감성을 분류한다.
 * 하이라이트를 위해 구분자(공백·구두점)도 raw 토큰으로 보존한다.
 */
function analyze(text: string): SentimentResult {
  // 단어 단위와 비단어(구분자) 단위를 번갈아 캡처한다.
  const parts = text.match(/[0-9A-Za-z가-힣']+|[^0-9A-Za-z가-힣']+/g) ?? [];
  const tokens: Token[] = [];
  let positiveCount = 0;
  let negativeCount = 0;

  for (const part of parts) {
    const isWord = /[0-9A-Za-z가-힣']/.test(part);
    if (!isWord) {
      tokens.push({ raw: part, polarity: 'neutral' });
      continue;
    }
    const polarity = classifyToken(part);
    if (polarity === 'positive') positiveCount += 1;
    else if (polarity === 'negative') negativeCount += 1;
    tokens.push({ raw: part, polarity });
  }

  const totalMatches = positiveCount + negativeCount;
  const score = totalMatches === 0 ? 0 : (positiveCount - negativeCount) / totalMatches;

  let label: SentimentResult['label'];
  if (score > 0.15) label = '긍정';
  else if (score < -0.15) label = '부정';
  else label = '중립';

  return { tokens, positiveCount, negativeCount, score, label };
}

const LABEL_STYLES: Record<SentimentResult['label'], string> = {
  긍정: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
  중립: 'bg-muted text-muted-foreground border-border',
  부정: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
};

export default function SentimentPage() {
  const [input, setInput] = useState('');

  // 분석은 O(토큰×사전)이라 비싸다. 입력보다 한 박자 늦게 계산해 입력 블로킹을 막는다.
  const deferredInput = useDeferredValue(input);
  const result = useMemo(
    () => (deferredInput.trim() ? analyze(deferredInput) : null),
    [deferredInput],
  );

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="감성 분석" widthClass="max-w-3xl" onReset={() => setInput('')} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트의 긍·부정 감성을 사전 기반으로 점수화합니다(영·한, 모델 불필요).
        </p>

      <textarea
        className="min-h-40 w-full rounded-xl border bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="감성을 분석할 텍스트를 입력하세요. (예: 이 제품 정말 좋아요! / This movie was terrible.)"
        aria-label="입력"
      />

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-xl border p-4 text-center ${LABEL_STYLES[result.label]}`}>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">판정</p>
              <p className="text-2xl font-bold">{result.label}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">점수</p>
              <p className="text-2xl font-bold">{result.score.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">-1(부정) ~ +1(긍정)</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">매칭</p>
              <p className="text-sm font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">긍정 {result.positiveCount}</span>
                {' · '}
                <span className="text-red-600 dark:text-red-400">부정 {result.negativeCount}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              매칭 단어 하이라이트
            </p>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {result.tokens.map((token, index) => {
                if (token.polarity === 'positive') {
                  return (
                    <mark key={index} className="rounded bg-emerald-500/20 px-0.5 text-emerald-700 dark:text-emerald-300">
                      {token.raw}
                    </mark>
                  );
                }
                if (token.polarity === 'negative') {
                  return (
                    <mark key={index} className="rounded bg-red-500/20 px-0.5 text-red-700 dark:text-red-300">
                      {token.raw}
                    </mark>
                  );
                }
                return <Fragment key={index}>{token.raw}</Fragment>;
              })}
            </p>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        사전 기반 규칙 분석이라 비꼼·이중부정·문맥은 반영하지 못합니다. 모든 처리는 브라우저
        내부에서 수행되며 입력 텍스트는 서버로 전송되지 않습니다.
      </p>
      </main>
    </div>
  );
}
