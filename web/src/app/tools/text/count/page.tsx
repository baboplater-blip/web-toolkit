'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeft, Hash } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function countReadMinutes(words: number): number {
  return words / 200;
}

export default function TextCountPage() {
  const [text, setText] = useState(
    '여기에 텍스트를 입력하세요. 단어·문자·줄 수가 실시간으로 집계됩니다.\n\n한글, English, 숫자 123 모두 지원합니다.',
  );

  // 무거운 집계는 입력보다 한 박자 늦게 계산해 대용량 붙여넣기 시 입력 블로킹을 막는다.
  // (입력값 text 는 즉시 반영, deferredText 는 React 가 여유 있을 때 따라옴)
  const deferredText = useDeferredValue(text);

  const stats = useMemo(() => {
    const chars = deferredText.length;
    const charsNoSpace = deferredText.replace(/\s/g, '').length;
    const words = deferredText.trim() ? deferredText.trim().split(/\s+/).length : 0;
    const lines = deferredText.split('\n').length;
    const paragraphs = deferredText.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const bytes = new Blob([deferredText]).size;
    const sentences = deferredText.split(/[.!?。!?]+\s*/).filter((s) => s.trim()).length;
    const korean = (deferredText.match(/[\uac00-\ud7af]/g) ?? []).length;
    const english = (deferredText.match(/[a-zA-Z]/g) ?? []).length;
    const digits = (deferredText.match(/[0-9]/g) ?? []).length;
    const avgWordLen = words > 0 ? charsNoSpace / words : 0;
    const readMin = countReadMinutes(words);
    return {
      chars,
      charsNoSpace,
      words,
      lines,
      paragraphs,
      sentences,
      bytes,
      korean,
      english,
      digits,
      avgWordLen,
      readMin,
    };
  }, [deferredText]);

  // 상위 단어 빈도 (5개)
  const topWords = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of deferredText.toLowerCase().match(/[\w가-힣]+/g) ?? []) {
      if (w.length <= 1) continue;
      map.set(w, (map.get(w) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [deferredText]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Hash className="h-5 w-5" />
            <h1 className="font-semibold text-base">단어·문자 카운트</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setText('')}
          >
            지우기
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y"
            placeholder="텍스트를 입력하세요..." aria-label="텍스트를 입력하세요..." />
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            통계
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['문자', stats.chars.toLocaleString()],
              ['공백 제외', stats.charsNoSpace.toLocaleString()],
              ['단어', stats.words.toLocaleString()],
              ['줄', stats.lines.toLocaleString()],
              ['문단', stats.paragraphs.toLocaleString()],
              ['문장', stats.sentences.toLocaleString()],
              ['바이트 (UTF-8)', stats.bytes.toLocaleString()],
              ['평균 단어 길이', stats.avgWordLen.toFixed(2)],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg border p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold font-mono mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-2 text-center">
              <p className="text-[10px] text-muted-foreground">한글</p>
              <p className="text-sm font-semibold mt-0.5">{stats.korean}자</p>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <p className="text-[10px] text-muted-foreground">영문</p>
              <p className="text-sm font-semibold mt-0.5">{stats.english}자</p>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <p className="text-[10px] text-muted-foreground">숫자</p>
              <p className="text-sm font-semibold mt-0.5">{stats.digits}자</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            예상 읽는 시간: {stats.readMin < 1 ? '1분 미만' : `약 ${Math.ceil(stats.readMin)}분`}{' '}
            (200 wpm 기준)
          </p>
        </div>

        {topWords.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              상위 단어 빈도 (10)
            </h2>
            <div className="space-y-1">
              {topWords.map(([word, count]) => {
                const max = topWords[0][1];
                return (
                  <div key={word} className="flex items-center gap-2 text-xs">
                    <span className="w-24 truncate font-mono">{word}</span>
                    <div className="flex-1 h-4 rounded-sm bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-muted-foreground">{count}회</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
