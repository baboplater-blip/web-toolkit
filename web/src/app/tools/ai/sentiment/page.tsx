'use client';

import { Fragment, useDeferredValue, useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';

/**
 * 사전 기반 감성 분석(브라우저 전용, 모델 불필요).
 *
 * 개선점:
 *  - 부정어 처리: 감성어 앞 N토큰 내에 부정어("not", "안", "못", "없")가 있으면 극성 반전.
 *  - 강조어 가중: "very", "너무", "매우" 등이 앞에 있으면 가중치 증폭.
 *  - 문장별 분해: 각 문장의 긍/부정/중립 판정을 별도로 표시.
 *  - 전체 점수 게이지(긍정↔부정 바) + -1~+1 정규화 점수.
 *
 * 모든 처리는 브라우저 내부에서 수행되며 입력은 서버로 전송되지 않는다.
 */

// 긍정 단어 사전(영어 + 한국어 어간). 소문자로 정규화해 비교한다.
const POSITIVE_WORDS = new Set<string>([
  // English
  'good', 'great', 'excellent', 'amazing', 'awesome', 'wonderful', 'fantastic', 'love',
  'loved', 'loves', 'like', 'liked', 'likes', 'happy', 'best', 'better', 'nice', 'perfect',
  'beautiful', 'brilliant', 'positive', 'enjoy', 'enjoyed', 'enjoyable', 'pleasant',
  'delightful', 'superb', 'win', 'winner', 'success', 'successful', 'recommend',
  'recommended', 'satisfied', 'satisfying', 'satisfaction', 'glad', 'thank', 'thanks',
  'thankful', 'helpful', 'impressive', 'impressed', 'gorgeous', 'favorite', 'fun', 'cool',
  'safe', 'comfortable', 'reliable', 'smooth', 'fast', 'efficient', 'easy', 'clean',
  'fresh', 'friendly', 'generous', 'gentle', 'honest', 'inspiring', 'joy', 'joyful',
  'lovely', 'marvelous', 'outstanding', 'remarkable', 'splendid', 'stunning', 'sweet',
  'terrific', 'valuable', 'worth', 'worthy', 'beneficial', 'cheerful', 'comfort', 'praise',
  'pleased', 'pleasing', 'admire', 'appreciate', 'appreciated', 'grateful', 'delighted',
  // Korean (어간/형용사)
  '좋다', '좋아', '좋은', '좋았', '좋고', '훌륭', '최고', '멋지', '멋진', '멋있', '행복',
  '사랑', '만족', '추천', '감사', '고마', '기쁘', '기뻐', '편리', '완벽', '뛰어', '즐겁',
  '즐거', '예쁘', '이쁘', '아름', '성공', '대박', '굿', '맘에', '유익', '친절', '깔끔',
  '편안', '안전', '빠르', '쉽다', '쉬운', '간편', '신선', '튼튼', '우수', '탁월', '환상',
  '인상', '감동', '고급', '맛있', '시원', '훈훈', '따뜻', '믿음', '신뢰', '효율', '깨끗',
  '재밌', '재미', '괜찮', '좋아요', '굿잡', '최상', '뿌듯', '든든', '상쾌', '명품',
]);

// 부정 단어 사전(영어 + 한국어 어간).
const NEGATIVE_WORDS = new Set<string>([
  // English
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'worse', 'hate', 'hated', 'hates',
  'dislike', 'disliked', 'sad', 'angry', 'anger', 'poor', 'ugly', 'disappointing',
  'disappointed', 'disappointment', 'fail', 'failed', 'fails', 'failure', 'negative',
  'wrong', 'broken', 'break', 'bug', 'buggy', 'slow', 'difficult', 'hard', 'annoying',
  'annoyed', 'boring', 'bored', 'useless', 'waste', 'wasted', 'problem', 'problematic',
  'issue', 'crash', 'crashed', 'error', 'errors', 'pain', 'painful', 'scared', 'fear',
  'unhappy', 'nasty', 'rude', 'dirty', 'expensive', 'overpriced', 'cheap', 'lousy',
  'mediocre', 'frustrating', 'frustrated', 'confusing', 'confused', 'disgusting', 'awkward',
  'weak', 'lame', 'messy', 'noisy', 'uncomfortable', 'unreliable', 'unstable',
  'defective', 'damaged', 'faulty', 'inferior', 'regret', 'complaint', 'complain', 'worry',
  'worried', 'trouble', 'troubled', 'horrendous', 'dreadful', 'unacceptable', 'garbage',
  'junk', 'scam', 'fraud', 'sucks', 'suck', 'hopeless', 'miserable', 'tragic',
  // Korean (어간/형용사)
  '나쁘', '나쁜', '별로', '최악', '싫다', '싫어', '슬프', '슬퍼', '화나', '짜증', '실망',
  '실패', '불편', '불만', '느리', '느려', '어렵', '힘들', '문제', '오류', '버그', '아프',
  '아픈', '무섭', '지루', '쓸모', '낭비', '엉망', '구리', '더럽', '더러', '망했', '망함',
  '후회', '불쾌', '불안', '걱정', '두렵', '두려', '못생', '추하', '비싸', '과하', '형편',
  '끔찍', '역겹', '역겨', '답답', '복잡', '거슬', '시끄', '지겹', '지겨', '귀찮', '아쉽',
  '아쉬', '부족', '저질', '조잡', '허접', '꽝', '실수', '결함', '고장', '먹통', '느림',
  '비추', '환불', '사기', '거짓', '짜증나', '짜증남', '최하', '불량', '불친절',
]);

// 부정어(앞 N토큰 내에 있으면 뒤따르는 감성어의 극성을 반전).
const NEGATORS = new Set<string>([
  // English
  'not', 'no', 'never', "n't", 'nt', 'without', 'hardly', 'barely', 'neither', 'nor',
  'none', 'cannot', "can't", "don't", "doesn't", "didn't", "isn't", "wasn't", "aren't",
  'dont', 'doesnt', 'didnt', 'isnt', 'wasnt', 'arent', 'cant',
  // Korean
  '안', '못', '없다', '없어', '없는', '없이', '아니', '아닌', '말고', '비', '덜',
]);

// 강조어(앞에 있으면 가중치 증폭).
const INTENSIFIERS = new Set<string>([
  // English
  'very', 'really', 'so', 'extremely', 'absolutely', 'totally', 'completely', 'highly',
  'incredibly', 'super', 'quite', 'too', 'amazingly', 'remarkably', 'truly', 'deeply',
  // Korean
  '너무', '매우', '정말', '진짜', '아주', '엄청', '굉장', '완전', '겁나', '되게', '몹시',
  '무척', '훨씬', '대단히', '상당히', '존나', '졸라', '개', '쩔', '극도',
]);

const NEGATION_WINDOW = 2; // 감성어 앞 몇 토큰까지 부정어를 탐색하는가.
const INTENSIFIER_BOOST = 1.5; // 강조어가 있을 때 곱하는 가중치.

type Polarity = 'positive' | 'negative' | 'neutral';

interface WordToken {
  raw: string; // 원문 그대로(공백·구두점 포함)
  isWord: boolean;
  polarity: Polarity; // 최종 판정(부정어 반전 반영)
  weight: number; // 기여 가중치(강조어 반영)
}

interface SentenceResult {
  text: string;
  score: number; // -1 ~ 1
  label: '긍정' | '중립' | '부정';
  positive: number;
  negative: number;
}

interface SentimentResult {
  tokens: WordToken[];
  sentences: SentenceResult[];
  positiveScore: number; // 가중 긍정 합
  negativeScore: number; // 가중 부정 합
  score: number; // -1 ~ 1
  label: '긍정' | '중립' | '부정';
}

/** 한 단어의 기본(부정어 반전 전) 극성을 사전에서 조회한다. */
function baseClassify(token: string): Polarity {
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

/** 토큰이 부정어인지(라틴 정확 일치 + 한국어 부분 포함) 판단한다. */
function isNegator(token: string): boolean {
  const lower = token.toLowerCase();
  if (NEGATORS.has(lower)) return true;
  // 한국어 부정 표현은 어간 포함으로 검사(예: "없었어요" → "없").
  for (const word of NEGATORS) {
    if (/[가-힣]/.test(word) && lower.includes(word)) return true;
  }
  return false;
}

/** 토큰이 강조어인지 판단한다. */
function isIntensifier(token: string): boolean {
  const lower = token.toLowerCase();
  if (INTENSIFIERS.has(lower)) return true;
  for (const word of INTENSIFIERS) {
    if (/[가-힣]/.test(word) && lower.includes(word)) return true;
  }
  return false;
}

/** 점수로 라벨을 결정한다. */
function scoreToLabel(score: number): '긍정' | '중립' | '부정' {
  if (score > 0.15) return '긍정';
  if (score < -0.15) return '부정';
  return '중립';
}

/** 본문을 문장 단위로 분리한다(영·한 종결부호·줄바꿈). 반환은 [원문, ...]. */
function splitSentences(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n');
  return normalized
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * 본문 전체를 토큰화·분류한다. 하이라이트용으로 구분자도 raw 토큰으로 보존하며,
 * 단어 토큰에는 부정어 반전·강조어 가중을 반영한 최종 극성/가중치를 매긴다.
 */
function analyzeTokens(text: string): { tokens: WordToken[]; positiveScore: number; negativeScore: number } {
  const parts = text.match(/[0-9A-Za-z가-힣']+|[^0-9A-Za-z가-힣']+/g) ?? [];

  // 단어 토큰만 별도 인덱싱해 부정어 윈도우 탐색을 단순화한다.
  const wordIndices: number[] = [];
  const tokens: WordToken[] = parts.map((part) => {
    const isWord = /[0-9A-Za-z가-힣']/.test(part);
    return { raw: part, isWord, polarity: 'neutral' as Polarity, weight: 0 };
  });
  tokens.forEach((token, index) => {
    if (token.isWord) wordIndices.push(index);
  });

  let positiveScore = 0;
  let negativeScore = 0;

  for (let wi = 0; wi < wordIndices.length; wi += 1) {
    const tokenIndex = wordIndices[wi];
    const token = tokens[tokenIndex];
    const basePolarity = baseClassify(token.raw);
    if (basePolarity === 'neutral') continue;

    // 앞 NEGATION_WINDOW 단어 토큰 내 부정어/강조어 탐색.
    let negated = false;
    let weight = 1;
    for (let back = 1; back <= NEGATION_WINDOW; back += 1) {
      const prevWi = wi - back;
      if (prevWi < 0) break;
      const prevRaw = tokens[wordIndices[prevWi]].raw;
      if (isNegator(prevRaw)) negated = true;
      if (isIntensifier(prevRaw)) weight = INTENSIFIER_BOOST;
    }

    const finalPolarity: Polarity = negated
      ? basePolarity === 'positive' ? 'negative' : 'positive'
      : basePolarity;

    token.polarity = finalPolarity;
    token.weight = weight;

    if (finalPolarity === 'positive') positiveScore += weight;
    else negativeScore += weight;
  }

  return { tokens, positiveScore, negativeScore };
}

/** 전체 본문 + 문장별 결과를 산출한다. */
function analyze(text: string): SentimentResult {
  const { tokens, positiveScore, negativeScore } = analyzeTokens(text);

  const total = positiveScore + negativeScore;
  const score = total === 0 ? 0 : (positiveScore - negativeScore) / total;

  // 문장별 분석(각 문장을 독립적으로 토큰 분석).
  const sentences: SentenceResult[] = splitSentences(text).map((sentence) => {
    const sub = analyzeTokens(sentence);
    const subTotal = sub.positiveScore + sub.negativeScore;
    const subScore = subTotal === 0 ? 0 : (sub.positiveScore - sub.negativeScore) / subTotal;
    return {
      text: sentence,
      score: subScore,
      label: scoreToLabel(subScore),
      positive: sub.positiveScore,
      negative: sub.negativeScore,
    };
  });

  return {
    tokens,
    sentences,
    positiveScore,
    negativeScore,
    score,
    label: scoreToLabel(score),
  };
}

const LABEL_STYLES: Record<SentimentResult['label'], string> = {
  긍정: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
  중립: 'bg-muted text-muted-foreground border-border',
  부정: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
};

const SENTENCE_DOT: Record<SentimentResult['label'], string> = {
  긍정: 'bg-emerald-500',
  중립: 'bg-muted-foreground/40',
  부정: 'bg-red-500',
};

export default function SentimentPage() {
  const [input, setInput] = useState('');

  // 분석은 O(토큰×사전)이라 비싸다. 입력보다 한 박자 늦게 계산해 입력 블로킹을 막는다.
  const deferredInput = useDeferredValue(input);
  const result = useMemo(
    () => (deferredInput.trim() ? analyze(deferredInput) : null),
    [deferredInput],
  );

  // 게이지 바: -1~+1 점수를 0~100% 위치로 변환(중앙 50%가 중립).
  const gaugePercent = useMemo(() => {
    if (!result) return 50;
    return Math.round((result.score + 1) * 50);
  }, [result]);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="감성 분석" widthClass="max-w-3xl" onReset={() => setInput('')} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트의 긍·부정 감성을 사전 기반으로 점수화합니다. 부정어 반전(&quot;안 좋다&quot;,
          &quot;not good&quot;)과 강조어 가중(&quot;너무&quot;, &quot;very&quot;)을 반영합니다(영·한,
          모델 불필요).
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="감성을 분석할 텍스트를 입력하세요. (예: 이 제품 정말 좋아요! 근데 배송은 안 좋았어요. / This movie was not bad at all.)"
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
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">가중 합</p>
                <p className="text-sm font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    긍정 {result.positiveScore.toFixed(1)}
                  </span>
                  {' · '}
                  <span className="text-red-600 dark:text-red-400">
                    부정 {result.negativeScore.toFixed(1)}
                  </span>
                </p>
              </div>
            </div>

            {/* 긍정↔부정 게이지 바 */}
            <div className="space-y-1 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-red-600 dark:text-red-400">부정</span>
                <span>중립</span>
                <span className="text-emerald-600 dark:text-emerald-400">긍정</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-red-500/30 via-muted to-emerald-500/30">
                <div
                  className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow"
                  style={{ left: `${gaugePercent}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* 문장별 분해 */}
            {result.sentences.length > 0 && (
              <div className="space-y-2 rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  문장별 분석
                </p>
                <ul className="space-y-1.5">
                  {result.sentences.map((sentence, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SENTENCE_DOT[sentence.label]}`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 break-words">{sentence.text}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {sentence.label} {sentence.score.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 매칭 단어 하이라이트 */}
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                매칭 단어 하이라이트 (부정어 반전·강조어 가중 반영)
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
          사전 기반 규칙 분석이라 비꼼·관용구·복잡한 문맥은 완전히 반영하지 못합니다. 모든 처리는
          브라우저 내부에서 수행되며 입력 텍스트는 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
