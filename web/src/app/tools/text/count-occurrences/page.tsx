'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';

/** 정규식 메타문자를 이스케이프해 리터럴 검색으로 만든다. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface CountResult {
  count: number;
  positions: number[];
}

/**
 * 본문에서 검색어 등장 횟수와 시작 위치를 센다.
 * caseSensitive=false 면 대소문자 무시, wholeWord=true 면 단어 경계로 제한한다.
 */
function countOccurrences(
  haystack: string,
  needle: string,
  caseSensitive: boolean,
  wholeWord: boolean,
): CountResult {
  if (!needle) return { count: 0, positions: [] };

  const flags = caseSensitive ? 'g' : 'gi';
  const escaped = escapeRegExp(needle);
  const pattern = wholeWord ? `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])` : escaped;

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags + 'u');
  } catch {
    // 유니코드 속성 escape 미지원 환경 폴백
    regex = new RegExp(wholeWord ? `\\b${escaped}\\b` : escaped, flags);
  }

  const positions: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(haystack)) !== null) {
    positions.push(match.index);
    // 길이 0 매치 무한루프 방지
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }

  return { count: positions.length, positions };
}

export default function CountOccurrencesPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const result = useMemo(
    () => countOccurrences(input, query, caseSensitive, wholeWord),
    [input, query, caseSensitive, wholeWord],
  );

  function reset() {
    setInput('');
    setQuery('');
    setCaseSensitive(false);
    setWholeWord(false);
  }

  const hasQuery = query.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="문자열 빈도 세기" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          특정 단어·문자열이 본문에 몇 번 나오는지 셉니다.
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">찾을 문자열</span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어"
              aria-label="찾을 문자열"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            대소문자 구분
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
            />
            단어 단위로 일치
          </label>
        </div>

        <div className="rounded-xl border bg-muted/40 p-4" aria-label="결과">
          {!hasQuery ? (
            <p className="text-sm text-muted-foreground">검색어를 입력하세요.</p>
          ) : (
            <>
              <p className="text-sm">
                <span className="text-lg font-semibold">{result.count}</span>번 등장
              </p>
              {result.count > 0 && (
                <p className="mt-2 break-words text-xs text-muted-foreground">
                  위치(문자 인덱스): {result.positions.join(', ')}
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
