'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

// 영어 단어 1개의 음절 수를 모음 그룹 휴리스틱으로 추정한다.
// 연속 모음은 1음절, 끝의 묵음 e 는 제외, 최소 1음절을 보장한다.
function countWordSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;

  const groups = cleaned.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 0;

  // 끝의 묵음 e (예: "make") 차감 — 단, "the"·"be" 처럼 e 만 남는 경우는 보존.
  if (cleaned.length > 2 && cleaned.endsWith('e') && !/[aeiouy]/.test(cleaned[cleaned.length - 2])) {
    count -= 1;
  }

  return Math.max(1, count);
}

interface ReadabilityStats {
  words: number;
  sentences: number;
  syllables: number;
  flesch: number;
  grade: number;
  level: string;
}

/** 점수대별 난이도 라벨(Flesch Reading Ease 기준). */
function easeLabel(score: number): string {
  if (score >= 90) return '매우 쉬움 (초등 5학년 수준)';
  if (score >= 80) return '쉬움 (초등 6학년 수준)';
  if (score >= 70) return '비교적 쉬움 (중학교 1학년 수준)';
  if (score >= 60) return '보통 (중학교 2~3학년 수준)';
  if (score >= 50) return '다소 어려움 (고등학교 수준)';
  if (score >= 30) return '어려움 (대학교 수준)';
  return '매우 어려움 (대학원·전문 수준)';
}

/** 영어 텍스트의 가독성 통계를 계산한다. 빈 텍스트면 null. */
function analyze(text: string): ReadabilityStats | null {
  const wordTokens = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? [];
  const words = wordTokens.length;
  if (words === 0) return null;

  // 문장 종결 부호 기준 분할 — 부호가 전혀 없으면 최소 1문장으로 본다.
  const sentenceTokens = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const sentences = Math.max(1, sentenceTokens.length);

  const syllables = wordTokens.reduce((sum, word) => sum + countWordSyllables(word), 0);

  const wordsPerSentence = words / sentences;
  const syllablesPerWord = syllables / words;

  const flesch = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  return {
    words,
    sentences,
    syllables,
    flesch: Math.round(flesch * 10) / 10,
    grade: Math.round(grade * 10) / 10,
    level: easeLabel(flesch),
  };
}

export default function ReadabilityScorePage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => analyze(input), [input]);

  const report = useMemo(() => {
    if (!stats) return '';
    return [
      `Flesch Reading Ease: ${stats.flesch} (${stats.level})`,
      `Flesch-Kincaid 학년 수준: ${stats.grade}`,
      `단어 수: ${stats.words}`,
      `문장 수: ${stats.sentences}`,
      `음절 수: ${stats.syllables}`,
    ].join('\n');
  }, [stats]);

  async function copy() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    setInput('');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="가독성 점수" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          영어 텍스트의 Flesch 가독성 지수와 Flesch-Kincaid 학년 수준을 계산합니다.
        </p>

        <textarea
          className="min-h-48 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="영어 텍스트를 여기에 입력하세요"
          aria-label="입력"
        />

        {!stats ? (
          <p className="rounded-xl border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            영어 단어가 포함된 텍스트를 입력하면 가독성 점수가 표시됩니다.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Flesch Reading Ease</p>
              <p className="text-3xl font-semibold tabular-nums">{stats.flesch}</p>
              <p className="mt-1 text-sm font-medium text-primary">{stats.level}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="학년 수준" value={stats.grade.toString()} />
              <Stat label="단어" value={stats.words.toLocaleString()} />
              <Stat label="문장" value={stats.sentences.toLocaleString()} />
              <Stat label="음절" value={stats.syllables.toLocaleString()} />
            </div>

            <Button onClick={copy} disabled={!report}>
              {copied ? '복사됨' : '결과 복사'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
