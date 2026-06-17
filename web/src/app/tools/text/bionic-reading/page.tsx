'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const MIN_RATIO = 40;
const MAX_RATIO = 70;
const DEFAULT_RATIO = 50;

/** HTML 특수문자를 이스케이프해 입력 텍스트가 마크업으로 해석되지 않도록 한다(XSS 방지). */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 입력 텍스트를 단어 단위로 나누고, 각 단어 앞부분(길이 × 비율, 올림)을
 * <strong> 으로 감싼 HTML 을 만든다. 단어/공백 분리 토큰은 모두 escape 한다.
 */
function buildBionicHtml(input: string, ratioPercent: number): string {
  const ratio = ratioPercent / 100;
  const tokens = input.split(/(\s+)/);
  return tokens
    .map((token) => {
      if (token.length === 0 || /^\s+$/.test(token)) return escapeHtml(token);
      const chars = [...token];
      const boldCount = Math.max(1, Math.ceil(chars.length * ratio));
      const head = escapeHtml(chars.slice(0, boldCount).join(''));
      const tail = escapeHtml(chars.slice(boldCount).join(''));
      return tail ? `<strong>${head}</strong>${tail}` : `<strong>${head}</strong>`;
    })
    .join('');
}

export default function BionicReadingPage() {
  const [input, setInput] = useState('');
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => (input ? buildBionicHtml(input, ratio) : ''), [input, ratio]);
  const previewHtml = useMemo(() => html.replace(/\n/g, '<br />'), [html]);

  function reset() {
    setInput('');
    setRatio(DEFAULT_RATIO);
    setCopied(false);
  }

  async function copyHtml() {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="바이오닉 리딩" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          단어 앞부분을 굵게 처리해 빠른 읽기를 돕습니다.
        </p>

        <textarea
          className="min-h-40 w-full resize-y rounded-xl border bg-card p-3 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />

        <label className="block space-y-1">
          <span className="text-sm font-medium">강조 비율: {ratio}%</span>
          <input
            type="range"
            min={MIN_RATIO}
            max={MAX_RATIO}
            value={ratio}
            onChange={(e) => setRatio(Number(e.target.value))}
            className="w-full"
            aria-label="강조 비율"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium">미리보기</span>
          <div
            className="min-h-40 whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-3 text-base leading-relaxed"
            // 입력은 escapeHtml 로 정화한 뒤 <strong> 만 삽입하므로 안전하다.
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={copyHtml} disabled={!html}>
            {copied ? '복사됨' : 'HTML 복사'}
          </Button>
        </div>
      </main>
    </div>
  );
}
