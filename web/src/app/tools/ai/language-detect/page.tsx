'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 입력 언어 추정 도구(브라우저 전용, 모델 불필요).
 *
 * 1단계: 유니코드 스크립트별 문자 비율을 센다(한글·가나·한자·키릴·아랍·라틴 등).
 *        비-라틴 스크립트가 우세하면 해당 언어로 곧장 판정한다.
 * 2단계: 라틴 문자가 우세하면 흔한 단어/이중문자(diacritic·고빈도 단어) 휴리스틱으로
 *        영어·스페인어·프랑스어·독일어·이탈리아어·포르투갈어 후보를 점수화한다.
 *
 * 신뢰도는 1순위 점수 대비 전체 점수 비율로 근사한다.
 */

interface LanguageResult {
  code: string;
  name: string;
  confidence: number; // 0~1
  detail: string;
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

/** 텍스트를 순회하며 스크립트별 문자 수를 센다(공백·구두점 제외). */
function countScripts(text: string): ScriptCounts {
  const counts: ScriptCounts = {
    hangul: 0, kana: 0, han: 0, cyrillic: 0, arabic: 0, hebrew: 0,
    greek: 0, devanagari: 0, thai: 0, latin: 0, total: 0,
  };

  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) continue;
    // 문자(letter)만 집계 대상으로 한다.
    if (!/\p{L}/u.test(char)) continue;
    counts.total += 1;

    if (code >= 0xac00 && code <= 0xd7a3) counts.hangul += 1;
    else if (code >= 0x1100 && code <= 0x11ff) counts.hangul += 1; // 자모
    else if ((code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff)) counts.kana += 1;
    else if (code >= 0x4e00 && code <= 0x9fff) counts.han += 1;
    else if ((code >= 0x0400 && code <= 0x04ff)) counts.cyrillic += 1;
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
    words: new Set(['the', 'and', 'is', 'in', 'to', 'of', 'that', 'it', 'you', 'for', 'with', 'this', 'have', 'are', 'was', 'not', 'but', 'they']),
  },
  es: {
    name: '스페인어 (Español)',
    words: new Set(['el', 'la', 'los', 'las', 'que', 'de', 'y', 'en', 'un', 'una', 'es', 'por', 'con', 'para', 'no', 'su', 'se', 'del']),
  },
  fr: {
    name: '프랑스어 (Français)',
    words: new Set(['le', 'la', 'les', 'des', 'et', 'est', 'un', 'une', 'que', 'qui', 'pour', 'dans', 'pas', 'avec', 'sur', 'ce', 'vous', 'nous']),
  },
  de: {
    name: '독일어 (Deutsch)',
    words: new Set(['der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'nicht', 'mit', 'sich', 'auf', 'für', 'den', 'von', 'zu', 'auch', 'wird', 'dem']),
  },
  it: {
    name: '이탈리아어 (Italiano)',
    words: new Set(['il', 'la', 'che', 'di', 'e', 'un', 'una', 'per', 'non', 'sono', 'con', 'del', 'della', 'come', 'più', 'ma', 'gli', 'nel']),
  },
  pt: {
    name: '포르투갈어 (Português)',
    words: new Set(['o', 'a', 'os', 'as', 'que', 'de', 'e', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'por', 'mais', 'como']),
  },
};

// 언어별 특징 문자/이중문자(diacritic·고유 패턴). 정규식 매칭마다 가점한다.
const LATIN_DIACRITIC_PATTERNS: Record<string, RegExp> = {
  es: /[ñ¿¡áéíóúü]/gi,
  fr: /[àâçèéêëîïôûùüÿœ]/gi,
  de: /[äöüß]/gi,
  it: /[àèéìòù]/gi,
  pt: /[ãõáâàçéêíóôú]/gi,
};

/** 라틴 표기 텍스트의 언어를 휴리스틱으로 추정한다. */
function detectLatinLanguage(text: string): LanguageResult {
  const lowerText = text.toLowerCase();
  const tokens = lowerText.split(/[^a-zà-ÿ]+/).filter((token) => token.length > 0);

  const scores: Record<string, number> = { en: 0, es: 0, fr: 0, de: 0, it: 0, pt: 0 };

  // 고빈도 단어 매칭(가중 2).
  for (const token of tokens) {
    for (const code of Object.keys(LATIN_WORDS)) {
      if (LATIN_WORDS[code].words.has(token)) {
        scores[code] += 2;
      }
    }
  }

  // 특징 문자 매칭(가중 1.5). 영어는 diacritic 이 거의 없다는 점이 변별점.
  for (const code of Object.keys(LATIN_DIACRITIC_PATTERNS)) {
    const matches = text.match(LATIN_DIACRITIC_PATTERNS[code]);
    if (matches) scores[code] += matches.length * 1.5;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topCode, topScore] = ranked[0];
  const totalScore = ranked.reduce((sum, [, value]) => sum + value, 0);

  // 어떤 단서도 없으면 라틴 기본값으로 영어를 낮은 신뢰도로 제시.
  if (totalScore === 0) {
    return {
      code: 'en',
      name: LATIN_WORDS.en.name,
      confidence: 0.3,
      detail: '라틴 문자이나 식별 단서가 부족해 영어로 추정(신뢰도 낮음).',
    };
  }

  const confidence = Math.min(0.99, topScore / totalScore);
  return {
    code: topCode,
    name: LATIN_WORDS[topCode].name,
    confidence,
    detail: `고빈도 단어·특징 문자 점수 기준 1순위(점수 ${topScore.toFixed(1)} / 합계 ${totalScore.toFixed(1)}).`,
  };
}

/** 전체 감지 파이프라인. 입력이 비면 null. */
function detectLanguage(text: string): LanguageResult | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const counts = countScripts(trimmed);
  if (counts.total === 0) {
    return { code: '?', name: '판별 불가', confidence: 0, detail: '문자(letter)가 없어 언어를 판별할 수 없습니다.' };
  }

  // 비-라틴 스크립트 우세 판정(전체 문자의 일정 비율 이상).
  const ratio = (value: number) => value / counts.total;

  if (ratio(counts.hangul) >= 0.3) {
    return { code: 'ko', name: '한국어 (Korean)', confidence: Math.min(0.99, ratio(counts.hangul) + 0.2), detail: `한글 비율 ${(ratio(counts.hangul) * 100).toFixed(0)}%.` };
  }
  // 가나가 있으면 일본어(한자 혼용 가능). 한자만 있으면 중국어로 본다.
  if (ratio(counts.kana) >= 0.15) {
    return { code: 'ja', name: '일본어 (Japanese)', confidence: Math.min(0.99, ratio(counts.kana + counts.han) + 0.2), detail: `가나 비율 ${(ratio(counts.kana) * 100).toFixed(0)}% (한자 혼용 포함).` };
  }
  if (ratio(counts.han) >= 0.3) {
    return { code: 'zh', name: '중국어 (Chinese)', confidence: Math.min(0.95, ratio(counts.han) + 0.1), detail: `한자 비율 ${(ratio(counts.han) * 100).toFixed(0)}% (가나 미검출 → 중국어 추정).` };
  }
  if (ratio(counts.cyrillic) >= 0.3) {
    return { code: 'ru', name: '러시아어/키릴 (Cyrillic)', confidence: Math.min(0.95, ratio(counts.cyrillic) + 0.1), detail: `키릴 문자 비율 ${(ratio(counts.cyrillic) * 100).toFixed(0)}%.` };
  }
  if (ratio(counts.arabic) >= 0.3) {
    return { code: 'ar', name: '아랍어 (Arabic)', confidence: Math.min(0.95, ratio(counts.arabic) + 0.1), detail: `아랍 문자 비율 ${(ratio(counts.arabic) * 100).toFixed(0)}%.` };
  }
  if (ratio(counts.hebrew) >= 0.3) {
    return { code: 'he', name: '히브리어 (Hebrew)', confidence: Math.min(0.95, ratio(counts.hebrew) + 0.1), detail: `히브리 문자 비율 ${(ratio(counts.hebrew) * 100).toFixed(0)}%.` };
  }
  if (ratio(counts.greek) >= 0.3) {
    return { code: 'el', name: '그리스어 (Greek)', confidence: Math.min(0.95, ratio(counts.greek) + 0.1), detail: `그리스 문자 비율 ${(ratio(counts.greek) * 100).toFixed(0)}%.` };
  }
  if (ratio(counts.devanagari) >= 0.3) {
    return { code: 'hi', name: '힌디/데바나가리 (Devanagari)', confidence: Math.min(0.95, ratio(counts.devanagari) + 0.1), detail: `데바나가리 비율 ${(ratio(counts.devanagari) * 100).toFixed(0)}%.` };
  }
  if (ratio(counts.thai) >= 0.3) {
    return { code: 'th', name: '태국어 (Thai)', confidence: Math.min(0.95, ratio(counts.thai) + 0.1), detail: `태국 문자 비율 ${(ratio(counts.thai) * 100).toFixed(0)}%.` };
  }

  // 라틴 우세 → 세부 언어 휴리스틱.
  if (ratio(counts.latin) >= 0.3) {
    return detectLatinLanguage(trimmed);
  }

  // 혼합이거나 우세 스크립트가 없는 경우 가장 많은 스크립트를 알린다.
  return {
    code: '?',
    name: '혼합/불확실',
    confidence: 0.2,
    detail: '뚜렷이 우세한 스크립트가 없어 언어를 단정하기 어렵습니다.',
  };
}

/** 결과를 복사용 텍스트로 직렬화한다. */
function formatResult(result: LanguageResult): string {
  return [
    `감지 언어: ${result.name}`,
    `언어 코드: ${result.code}`,
    `신뢰도: ${Math.round(result.confidence * 100)}%`,
    `근거: ${result.detail}`,
  ].join('\n');
}

export default function LanguageDetectPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => detectLanguage(input), [input]);
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
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Languages className="h-5 w-5 text-primary" aria-hidden />
          언어 감지
        </h1>
        <p className="text-sm text-muted-foreground">
          입력한 텍스트의 언어를 추정합니다(스크립트 감지 + 라틴어 휴리스틱, 브라우저 내 판별).
        </p>
      </header>

      <textarea
        className="min-h-40 w-full rounded-xl border bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="언어를 추정할 텍스트를 입력하세요."
        aria-label="입력"
      />

      {result && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-lg font-semibold">{result.name}</p>
              <p className="text-xs text-muted-foreground">코드: {result.code}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              복사
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>신뢰도</span>
              <span>{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round(result.confidence * 100)}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{result.detail}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        규칙 기반 추정이라 짧은 문장이나 혼합 언어에서는 정확도가 낮을 수 있습니다. 모든 처리는
        브라우저 내부에서 수행되며 입력 텍스트는 서버로 전송되지 않습니다.
      </p>
    </main>
  );
}
