'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Stats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  headings: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  links: number;
  images: number;
  codeBlocks: number;
  inlineCode: number;
  lists: number;
  tables: number;
  readingMinutes: number;
}

const WORDS_PER_MINUTE = 220;

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

function analyze(md: string): Stats {
  if (!md) {
    return {
      words: 0,
      chars: 0,
      charsNoSpaces: 0,
      lines: 0,
      paragraphs: 0,
      sentences: 0,
      headings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      links: 0,
      images: 0,
      codeBlocks: 0,
      inlineCode: 0,
      lists: 0,
      tables: 0,
      readingMinutes: 0,
    };
  }

  const chars = md.length;
  const charsNoSpaces = md.replace(/\s/g, '').length;
  const lines = md.split(/\r?\n/).length;
  const paragraphs = md
    .split(/\r?\n\s*\r?\n/)
    .filter((p) => p.trim().length > 0).length;
  // 한글 글자 + 영문 단어 모두 counting
  const koreanChars = countMatches(md, /[가-힣]/g);
  const englishWords = countMatches(md, /[A-Za-z]+/g);
  const numberWords = countMatches(md, /\d+/g);
  const words = koreanChars + englishWords + numberWords;
  const sentences = countMatches(md, /[.!?。!?][\s\n]|[.!?。!?]$/g);

  const headings: Stats['headings'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^(#{1,6})\s+/);
    if (m) {
      const level = m[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      headings[level]++;
    }
  }

  const codeBlocks = countMatches(md, /^```/gm) / 2;
  // 코드 블록 안 내용은 통계에서 제외하기 위해 일단 제거
  const noCodeBlocks = md.replace(/```[\s\S]*?```/g, '');
  const inlineCode = countMatches(noCodeBlocks, /(?<!`)`[^`\n]+`(?!`)/g);
  const links = countMatches(noCodeBlocks, /\[[^\]]+\]\([^)]+\)/g);
  const images = countMatches(noCodeBlocks, /!\[[^\]]*\]\([^)]+\)/g);
  const lists = countMatches(md, /^\s*[-*+]\s+/gm) + countMatches(md, /^\s*\d+\.\s+/gm);
  const tables = countMatches(md, /^\s*\|[^\n]*\|\s*$/gm);

  return {
    words,
    chars,
    charsNoSpaces,
    lines,
    paragraphs,
    sentences,
    headings,
    links,
    images,
    codeBlocks: Math.floor(codeBlocks),
    inlineCode,
    lists,
    tables,
    readingMinutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
  };
}

export default function MarkdownStatsPage() {
  const [md, setMd] = useState('');
  // 무거운 정규식 집계는 입력보다 한 박자 늦게 실행해 대용량 붙여넣기 시
  // 입력(textarea) 블로킹을 막는다. 입력값 md 는 즉시 반영된다.
  const deferredMd = useDeferredValue(md);
  const stats = useMemo(() => analyze(deferredMd), [deferredMd]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({
              variant: 'ghost',
              size: 'icon',
              className: 'h-8 w-8',
            })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <FileText className="h-5 w-5" />
          <h1 className="font-semibold text-base">마크다운 통계</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <label className="text-xs font-medium block" htmlFor="md-stats-input">
            마크다운 입력
          </label>
          <textarea
            id="md-stats-input"
            value={md}
            onChange={(e) => setMd(e.target.value)}
            rows={14}
            placeholder={'# 제목\n\n본문... [링크](https://example.com)\n\n- 항목 1\n- 항목 2'}
            className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y"
            spellCheck={false}
            aria-label="마크다운 입력"
          />
        </div>

        <section className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            기본 통계
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="단어 수" value={stats.words} />
            <Stat label="문자 수" value={stats.chars} />
            <Stat label="공백 제외" value={stats.charsNoSpaces} />
            <Stat label="줄 수" value={stats.lines} />
            <Stat label="문단" value={stats.paragraphs} />
            <Stat label="문장" value={stats.sentences} />
            <Stat
              label="읽기 시간"
              value={stats.readingMinutes}
              unit="분"
              hint={`${WORDS_PER_MINUTE} wpm 기준`}
            />
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            구조 요소
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <Stat label="H1" value={stats.headings[1]} />
            <Stat label="H2" value={stats.headings[2]} />
            <Stat label="H3" value={stats.headings[3]} />
            <Stat label="H4" value={stats.headings[4]} />
            <Stat label="H5" value={stats.headings[5]} />
            <Stat label="H6" value={stats.headings[6]} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <Stat label="링크" value={stats.links} />
            <Stat label="이미지" value={stats.images} />
            <Stat label="코드 블록" value={stats.codeBlocks} />
            <Stat label="인라인 코드" value={stats.inlineCode} />
            <Stat label="목록 항목" value={stats.lists} />
            <Stat label="표 행" value={stats.tables} />
          </div>
        </section>

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            한국어 단어는 음절 단위로 카운트(한국어 텍스트 분량 기준에 맞춤). 코드 블록
            내부의 링크·이미지는 통계에서 제외해 마크다운 의도와 일치하도록 처리합니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: number;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border bg-background p-2.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums mt-0.5">
        {value.toLocaleString()}
        {unit && <span className="text-xs ml-0.5 text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="text-[9px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
