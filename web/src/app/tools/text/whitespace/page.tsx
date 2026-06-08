'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhitespaceOptions {
  trimLineEnds: boolean;
  collapseBlankLines: boolean;
  tabsToSpaces: boolean;
  tabWidth: 2 | 4;
  trimEdgeBlankLines: boolean;
  collapseSpaces: boolean;
}

function cleanWhitespace(input: string, opts: WhitespaceOptions): string {
  let lines = input.split('\n');

  if (opts.tabsToSpaces) {
    const filler = ' '.repeat(opts.tabWidth);
    lines = lines.map((line) => line.replace(/\t/g, filler));
  }

  if (opts.collapseSpaces) {
    // 줄 안의 연속 스페이스만 1개로(탭은 위에서 처리됨, 줄바꿈은 유지)
    lines = lines.map((line) => line.replace(/ {2,}/g, ' '));
  }

  if (opts.trimLineEnds) {
    lines = lines.map((line) => line.replace(/[ \t]+$/, ''));
  }

  let result = lines.join('\n');

  if (opts.collapseBlankLines) {
    // 연속된 빈 줄(공백만 있는 줄 포함)을 1개로
    result = result.replace(/\n[ \t]*(?:\n[ \t]*)+/g, '\n\n');
  }

  if (opts.trimEdgeBlankLines) {
    result = result.replace(/^(?:[ \t]*\n)+/, '').replace(/(?:\n[ \t]*)+$/, '');
  }

  return result;
}

export default function WhitespaceCleanPage() {
  const [input, setInput] = useState('');
  const [trimLineEnds, setTrimLineEnds] = useState(true);
  const [collapseBlankLines, setCollapseBlankLines] = useState(false);
  const [tabsToSpaces, setTabsToSpaces] = useState(false);
  const [tabWidth, setTabWidth] = useState<2 | 4>(2);
  const [trimEdgeBlankLines, setTrimEdgeBlankLines] = useState(false);
  const [collapseSpaces, setCollapseSpaces] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () =>
      cleanWhitespace(input, {
        trimLineEnds,
        collapseBlankLines,
        tabsToSpaces,
        tabWidth,
        trimEdgeBlankLines,
        collapseSpaces,
      }),
    [
      input,
      trimLineEnds,
      collapseBlankLines,
      tabsToSpaces,
      tabWidth,
      trimEdgeBlankLines,
      collapseSpaces,
    ],
  );

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 권한 거부·비보안 컨텍스트 등에서 reject 될 수 있어 무시하고 로깅만.
      console.error('[whitespace] 클립보드 복사 실패', err);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whitespace-clean.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="공백 정리" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">줄 끝 공백·중복 빈 줄·탭을 정리하고 들여쓰기를 통일합니다.</p>

      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={trimLineEnds}
            onChange={(e) => setTrimLineEnds(e.target.checked)}
          />
          줄끝 공백 제거
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={collapseBlankLines}
            onChange={(e) => setCollapseBlankLines(e.target.checked)}
          />
          연속 빈 줄 1개로
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={collapseSpaces}
            onChange={(e) => setCollapseSpaces(e.target.checked)}
          />
          연속 스페이스 1개로
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={trimEdgeBlankLines}
            onChange={(e) => setTrimEdgeBlankLines(e.target.checked)}
          />
          앞뒤 빈 줄 제거
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={tabsToSpaces}
            onChange={(e) => setTabsToSpaces(e.target.checked)}
          />
          탭→스페이스
        </label>
        <label className="flex items-center gap-2">
          폭
          <select
            className="rounded-lg border bg-background px-2 py-1 text-sm disabled:opacity-50"
            value={tabWidth}
            onChange={(e) => setTabWidth(Number(e.target.value) === 4 ? 4 : 2)}
            disabled={!tabsToSpaces}
            aria-label="탭 폭"
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!output}>
          {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
          {copied ? '복사됨' : '복사'}
        </Button>
        <Button variant="outline" onClick={download} disabled={!output}>다운로드</Button>
      </div>
    </main>
    </div>
  );
}
