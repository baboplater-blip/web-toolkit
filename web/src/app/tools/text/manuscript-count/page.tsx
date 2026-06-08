'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useDeferredValue, useMemo, useState } from 'react';

export default function ManuscriptCountPage() {
  const [input, setInput] = useState('');

  // 집계는 입력보다 한 박자 늦게 계산해 대용량 붙여넣기 시 입력 블로킹을 막는다.
  const deferredInput = useDeferredValue(input);

  const stats = useMemo(() => {
    const text = deferredInput;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const words = text.split(/\s+/).filter(Boolean).length;
    const lines = text.split(/\n/).length;
    // Blob 은 전체 문자열을 복사하므로 대용량에서 비싸다. TextEncoder 로 바이트 길이만 구한다.
    const bytes = new TextEncoder().encode(text).length;

    // 원고지 단위 (200자 / 400자)
    const sheet200 = Math.ceil(chars / 200);
    const sheet400 = Math.ceil(chars / 400);

    // 한국 출판 기준 — 200자 원고지 1매 = 신국판 기준 약 1페이지
    // 1매 = 200자 (10×20)
    // 매·줄·칸 계산
    const COLS = 20;
    const ROWS_400 = 20;
    const ROWS_200 = 10;

    // 신국판 페이지 = 약 1100자 (글 분량용 추정)
    const novelPages = Math.ceil(chars / 1100);

    return {
      chars,
      charsNoSpace,
      words,
      lines,
      bytes,
      sheet200,
      sheet400,
      novelPages,
      cols: COLS,
      rows200: ROWS_200,
      rows400: ROWS_400,
    };
  }, [deferredInput]);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="원고지 글자 수 세기" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          200자/400자 원고지 매수, 출판 페이지 환산까지 실시간으로 표시합니다.
        </p>

      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium">본문</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-sm min-h-72 resize-y leading-relaxed"
          placeholder="원고지 매수가 궁금한 글을 붙여넣거나 직접 입력하세요." aria-label="본문" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <Box label="글자 (공백 포함)" value={stats.chars.toLocaleString()} />
        <Box label="글자 (공백 제외)" value={stats.charsNoSpace.toLocaleString()} />
        <Box label="단어" value={stats.words.toLocaleString()} />
        <Box label="줄" value={stats.lines.toLocaleString()} />
        <Box label="200자 원고지" value={`${stats.sheet200.toLocaleString()} 매`} />
        <Box label="400자 원고지" value={`${stats.sheet400.toLocaleString()} 매`} />
        <Box label="신국판 추정" value={`${stats.novelPages.toLocaleString()} 쪽`} />
        <Box label="바이트" value={`${stats.bytes.toLocaleString()} B`} />
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">참고</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>200자 원고지: 10줄 × 20칸. 출판·문학 공모전에서 표준.</li>
          <li>400자 원고지: 20줄 × 20칸. 일본·과거 한국 작품 기준.</li>
          <li>신국판 1쪽 ≈ 1,100자 (한국 출판 평균 기준 추정치).</li>
        </ul>
      </div>
    </main>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}
