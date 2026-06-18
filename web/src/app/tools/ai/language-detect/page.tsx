'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

/**
 * 입력 언어 추정 도구(브라우저 전용, 모델 불필요).
 *
 * 1단계: 유니코드 스크립트별 문자 비율을 센다(한글·가나·한자·키릴·아랍·라틴 등).
 *        비-라틴 스크립트가 우세하면 해당 언어 후보들을 비율로 점수화한다.
 * 2단계: 라틴 문자가 우세하면 고빈도 기능어 + 특징 문자(diacritic)로
 *        영어·스페인어·프랑스어·독일어·이탈리아어·포르투갈어 등을 점수화한다.
 *
 * 단일 결과가 아니라 상위 후보들을 신뢰도(%)와 함께 랭킹으로 제시한다.
 */

interface LanguageCandidate {
  code: string;
  name: string;
  confidence: number; // 0~1
  detail: string;
}

interface DetectionResult {
  candidates: LanguageCandidate[]; // 신뢰도 내림차순
  charCount: number;
  tooShort: boolean;
}

interface ScriptCounts {
  hangul: number;
  kana: number;
  han: number;
  cyrillic: number;
  arabic: number;
  hebrew: number;
  greek: number;
  devanagari: number;
  thai: number;
  latin: number;
  total: number;
}

// 입력이 이보다 짧으면 신뢰도 경고를 띄운다.
const SHORT_INPUT_THRESHOLD = 12;

// 분석 대상 문자 상한. 언어 판별은 앞부분 표본만으로 충분하므로, 매우 긴 입력은
// 앞부분만 검사해 메인스레드 프리징을 막는다.
const MAX_CHARS = 100_000;

/** 텍스트를 순회하며 스크립트별 문자 수를 센다(공백·구두점 제외). */
function countScripts(text: string): ScriptCounts {
  const counts: ScriptCounts = {
    hangul: 0, kana: 0, han: 0, cyrillic: 0, arabic: 0, hebrew: 0,
    greek: 0, devanagari: 0, thai: 0, latin: 0, total: 0,
  };

  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) continue;
    if (!/\p{L}/u.test(char)) continue;
    counts.total += 1;

    if (code >= 0xac00 && code <= 0xd7a3) counts.hangul += 1;
    else if (code >= 0x1100 && code <= 0x11ff) counts.hangul += 1; // 자모
    else if ((code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff)) counts.kana += 1;
    else if (code >= 0x4e00 && code <= 0x9fff) counts.han += 1;
    else if (code >= 0x0400 && code <= 0x04ff) counts.cyrillic += 1;
    else if (code >= 0x0600 && code <= 0x06ff) counts.arabic += 1;
    else if (code >= 0x0590 && code <= 0x05ff) counts.hebrew += 1;
    else if (code >= 0x0370 && code <= 0x03ff) counts.greek += 1;
    else if (code >= 0x0900 && code <= 0x097f) counts.devanagari += 1;
    else if (code >= 0x0e00 && code <= 0x0e7f) counts.thai += 1;
    else if ((code >= 0x0041 && code <= 0x007a) || (code >= 0x00c0 && code <= 0x024f)) counts.latin += 1;
  }

  return counts;
}

// 라틴 표기 언어별 고빈도 기능어. 토큰이 이 집합에 들어가면 가점한다.
const LATIN_WORDS: Record<string, { name: string; words: Set<string> }> = {
  en: {
    name: '영어 (English)',
    words: new Set(['the', 'and', 'is', 'in', 'to', 'of', 'that', 'it', 'you', 'for', 'with', 'this', 'have', 'are', 'was', 'not', 'but', 'they', 'will', 'can', 'all', 'from', 'your', 'what']),
  },
  es: {
    name: '스페인어 (Español)',
    words: new Set(['el', 'la', 'los', 'las', 'que', 'de', 'y', 'en', 'un', 'una', 'es', 'por', 'con', 'para', 'no', 'su', 'se', 'del', 'lo', 'como', 'más', 'pero', 'sus', 'le']),
  },
  fr: {
    name: '프랑스어 (Français)',
    words: new Set(['le', 'la', 'les', 'des', 'et', 'est', 'un', 'une', 'que', 'qui', 'pour', 'dans', 'pas', 'avec', 'sur', 'ce', 'vous', 'nous', 'au', 'du', 'son', 'plus', 'mais', 'par']),
  },
  de: {
    name: '독일어 (Deutsch)',
    words: new Set(['der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'nicht', 'mit', 'sich', 'auf', 'für', 'den', 'von', 'zu', 'auch', 'wird', 'dem', 'im', 'es', 'sie', 'aber', 'als', 'oder']),
  },
  it: {
    name: '이탈리아어 (Italiano)',
    words: new Set(['il', 'la', 'che', 'di', 'e', 'un', 'una', 'per', 'non', 'sono', 'con', 'del', 'della', 'come', 'più', 'ma', 'gli', 'nel', 'si', 'le', 'in', 'al', 'da', 'questo']),
  },
  pt: {
    name: '포르투갈어 (Português)',
    words: new Set(['o', 'a', 'os', 'as', 'que', 'de', 'e', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'por', 'mais', 'como', 'se', 'na', 'no', 'mas', 'foi', 'são']),
  },
  nl: {
    name: '네덜란드어 (Nederlands)',
    words: new Set(['de', 'het', 'een', 'en', 'van', 'in', 'is', 'dat', 'op', 'te', 'met', 'niet', 'zijn', 'voor', 'aan', 'ook', 'maar', 'die', 'er', 'om', 'naar', 'dan', 'wordt', 'als']),
  },
};

// 언어별 특징 문자/이중문자(diacritic·고유 패턴). 정규식 매칭마다 가점한다.
const LATIN_DIACRITIC_PATTERNS: Record<string, RegExp> = {
  es: /[ñ¿¡áéíóúü]/gi,
  fr: /[àâçèéêëîïôûùüÿœ]/gi,
  de: /[äöüß]/gi,
  it: /[àèéìòù]/gi,
  pt: /[ãõáâàçéêíóôú]/gi,
  nl: /[ëïĳ]/gi,
};

/** 라틴 표기 텍스트의 언어 후보들을 휴리스틱으로 점수화한다(신뢰도 내림차순). */
function detectLatinLanguages(text: string): LanguageCandidate[] {
  const lowerText = text.toLowerCase();
  const tokens = lowerText.split(/[^a-zà-ÿ]+/).filter((token) => token.length > 0);

  const scores: Record<string, number> = {};
  for (const code of Object.keys(LATIN_WORDS)) scores[code] = 0;

  // 고빈도 단어 매칭(가중 2).
  for (const token of tokens) {
    for (const code of Object.keys(LATIN_WORDS)) {
      if (LATIN_WORDS[code].words.has(token)) scores[code] += 2;
    }
  }

  // 특징 문자 매칭(가중 1.5). 영어는 diacritic 이 거의 없다는 점이 변별점.
  for (const code of Object.keys(LATIN_DIACRITIC_PATTERNS)) {
    const matches = text.match(LATIN_DIACRITIC_PATTERNS[code]);
    if (matches) scores[code] += matches.length * 1.5;
  }

  const ranked = Object.entries(scores)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  // 어떤 단서도 없으면 라틴 기본값으로 영어를 낮은 신뢰도로 제시.
  if (ranked.length === 0) {
    return [{
      code: 'en',
      name: LATIN_WORDS.en.name,
      confidence: 0.3,
      detail: '라틴 문자이나 식별 단서가 부족해 영어로 추정(신뢰도 낮음).',
    }];
  }

  const totalScore = ranked.reduce((sum, [, value]) => sum + value, 0);

  return ranked.slice(0, 4).map(([code, score]) => ({
    code,
    name: LATIN_WORDS[code].name,
    confidence: Math.min(0.99, score / totalScore),
    detail: `고빈도 단어·특징 문자 점수 ${score.toFixed(1)} / 합계 ${totalScore.toFixed(1)}.`,
  }));
}

/** 비-라틴 스크립트 후보를 비율 기반으로 점수화한다(우세 스크립트가 1개 이상 있을 때). */
function detectScriptLanguages(counts: ScriptCounts): LanguageCandidate[] {
  const ratio = (value: number) => (counts.total === 0 ? 0 : value / counts.total);
  const candidates: LanguageCandidate[] = [];
  const push = (code: string, name: string, value: number, detailLabel: string, cap = 0.99) => {
    if (value <= 0) return;
    const r = ratio(value);
    candidates.push({
      code,
      name,
      confidence: Math.min(cap, r + 0.1),
      detail: `${detailLabel} 비율 ${(r * 100).toFixed(0)}%.`,
    });
  };

  push('ko', '한국어 (Korean)', counts.hangul, '한글', 0.99);

  // 가나가 있으면 일본어(한자 혼용). 한자만 있으면 중국어.
  if (counts.kana > 0) {
    const r = ratio(counts.kana + counts.han);
    candidates.push({
      code: 'ja',
      name: '일본어 (Japanese)',
      confidence: Math.min(0.99, r + 0.1),
      detail: `가나 비율 ${(ratio(counts.kana) * 100).toFixed(0)}% (한자 혼용 포함).`,
    });
    // 한자 비중이 가나보다 훨씬 크면 중국어도 후보로.
    if (counts.han > counts.kana * 3) {
      push('zh', '중국어 (Chinese)', counts.han, '한자', 0.6);
    }
  } else {
    push('zh', '중국어 (Chinese)', counts.han, '한자', 0.92);
  }

  push('ru', '러시아어/키릴 (Cyrillic)', counts.cyrillic, '키릴 문자', 0.92);
  push('ar', '아랍어 (Arabic)', counts.arabic, '아랍 문자', 0.92);
  push('he', '히브리어 (Hebrew)', counts.hebrew, '히브리 문자', 0.92);
  push('el', '그리스어 (Greek)', counts.greek, '그리스 문자', 0.92);
  push('hi', '힌디/데바나가리 (Devanagari)', counts.devanagari, '데바나가리', 0.92);
  push('th', '태국어 (Thai)', counts.thai, '태국 문자', 0.92);

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates;
}

/** 전체 감지 파이프라인. 입력이 비면 null. */
function detectLanguage(text: string): DetectionResult | null {
  const fullTrimmed = text.trim();
  if (!fullTrimmed) return null;

  // 언어 판별은 앞부분 표본이면 충분하므로 상한을 넘는 입력은 잘라 분석한다.
  const trimmed = fullTrimmed.length > MAX_CHARS ? fullTrimmed.slice(0, MAX_CHARS) : fullTrimmed;

  const counts = countScripts(trimmed);
  const charCount = counts.total;

  if (charCount === 0) {
    return {
      candidates: [{ code: '?', name: '판별 불가', confidence: 0, detail: '문자(letter)가 없어 언어를 판별할 수 없습니다.' }],
      charCount: 0,
      tooShort: true,
    };
  }

  const tooShort = charCount < SHORT_INPUT_THRESHOLD;

  // 비-라틴 스크립트가 의미 있게 존재하는지(전체의 10% 이상) 확인.
  const nonLatin = counts.hangul + counts.kana + counts.han + counts.cyrillic
    + counts.arabic + counts.hebrew + counts.greek + counts.devanagari + counts.thai;

  let candidates: LanguageCandidate[];

  if (nonLatin / charCount >= 0.3) {
    // 스크립트 우세 → 스크립트 기반 후보.
    candidates = detectScriptLanguages(counts);
    // 라틴이 일부 섞여 있으면 라틴 후보도 약하게 덧붙인다.
    if (counts.latin / charCount >= 0.15) {
      const latin = detectLatinLanguages(trimmed).slice(0, 1).map((c) => ({
        ...c,
        confidence: c.confidence * 0.4,
      }));
      candidates = [...candidates, ...latin].sort((a, b) => b.confidence - a.confidence);
    }
  } else if (counts.latin / charCount >= 0.3) {
    candidates = detectLatinLanguages(trimmed);
  } else if (nonLatin > 0) {
    candidates = detectScriptLanguages(counts);
  } else {
    candidates = [{
      code: '?',
      name: '혼합/불확실',
      confidence: 0.2,
      detail: '뚜렷이 우세한 스크립트가 없어 언어를 단정하기 어렵습니다.',
    }];
  }

  if (candidates.length === 0) {
    candidates = [{
      code: '?',
      name: '혼합/불확실',
      confidence: 0.2,
      detail: '뚜렷이 우세한 스크립트가 없어 언어를 단정하기 어렵습니다.',
    }];
  }

  return { candidates: candidates.slice(0, 5), charCount, tooShort };
}

/** 결과를 복사용 텍스트로 직렬화한다. */
function formatResult(result: DetectionResult): string {
  const lines = result.candidates.map((candidate, index) =>
    `${index + 1}. ${candidate.name} [${candidate.code}] — ${Math.round(candidate.confidence * 100)}%`,
  );
  return ['언어 감지 결과 (신뢰도순):', ...lines].join('\n');
}

export default function LanguageDetectPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  // 스크립트 카운팅·휴리스틱은 긴 입력에서 비싸다. 한 박자 늦게 계산해 입력 블로킹을 막는다.
  const deferredInput = useDeferredValue(input);
  const result = useMemo(() => detectLanguage(deferredInput), [deferredInput]);
  const outputText = useMemo(() => (result ? formatResult(result) : ''), [result]);

  async function copy(): Promise<void> {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[language-detect] clipboard write failed', err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="언어 감지" widthClass="max-w-3xl" onReset={() => setInput('')} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          입력한 텍스트의 언어를 추정합니다(스크립트 감지 + 라틴어 휴리스틱). 상위 후보를
          신뢰도와 함께 표시합니다(브라우저 내 판별).
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="언어를 추정할 텍스트를 입력하세요."
          aria-label="입력"
        />

        {result && (
          <div className="space-y-3">
            {result.tooShort && result.charCount > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                입력이 짧아({result.charCount}자) 정확도가 낮을 수 있습니다. 한 문장 이상 입력하면
                결과가 더 안정적입니다.
              </div>
            )}

            <div className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  후보 언어 (신뢰도순)
                </p>
                <Button variant="outline" size="sm" onClick={copy}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  복사
                </Button>
              </div>

              <ol className="space-y-3">
                {result.candidates.map((candidate, index) => {
                  const percent = Math.round(candidate.confidence * 100);
                  return (
                    <li key={`${candidate.code}-${index}`} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                          <span className={index === 0 ? 'text-base font-semibold' : 'text-sm font-medium'}>
                            {candidate.name}
                          </span>
                          <span className="text-xs text-muted-foreground">[{candidate.code}]</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{percent}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${index === 0 ? 'bg-primary' : 'bg-primary/50'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {index === 0 && (
                        <p className="text-xs text-muted-foreground">{candidate.detail}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          규칙 기반 추정이라 짧은 문장이나 혼합 언어에서는 정확도가 낮을 수 있습니다. 모든 처리는
          브라우저 내부에서 수행되며 입력 텍스트는 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
