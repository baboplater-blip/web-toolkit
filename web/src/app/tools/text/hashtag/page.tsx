'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type CaseMode = 'keep' | 'lower' | 'title';

/**
 * 키워드/문장을 해시태그로 변환한다.
 * 공백·쉼표·줄바꿈으로 토큰을 나누고, 각 토큰 내부의 구두점을 제거한 뒤
 * 남은 단어들을 붙여(공백 제거) `#` 접두사를 붙인다.
 */
function toHashtags(input: string, caseMode: CaseMode): string {
  const tokens = input
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const token of tokens) {
    // 토큰 내부에서 영문/숫자/유니코드 문자만 남기고 구두점 제거.
    const cleaned = token.replace(/[^\p{L}\p{N}]+/gu, '');
    if (!cleaned) continue;

    let tag = cleaned;
    if (caseMode === 'lower') {
      tag = tag.toLowerCase();
    } else if (caseMode === 'title') {
      tag = tag.charAt(0).toUpperCase() + tag.slice(1);
    }

    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(`#${tag}`);
  }

  return tags.join(' ');
}

export default function HashtagGeneratorPage() {
  const [input, setInput] = useState('');
  const [caseMode, setCaseMode] = useState<CaseMode>('lower');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => (input ? toHashtags(input, caseMode) : ''), [input, caseMode]);

  function reset() {
    setInput('');
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hashtag-generator.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="해시태그 생성기" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          키워드나 문장을 SNS용 해시태그로 변환합니다. 공백·쉼표·줄바꿈으로 단어를 나눕니다.
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            대소문자
            <select
              className="rounded-lg border bg-background px-2 py-1 text-sm"
              value={caseMode}
              onChange={(e) => setCaseMode(e.target.value as CaseMode)}
              aria-label="대소문자 처리"
            >
              <option value="lower">소문자</option>
              <option value="keep">원본 유지</option>
              <option value="title">첫 글자 대문자</option>
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
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!output}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
