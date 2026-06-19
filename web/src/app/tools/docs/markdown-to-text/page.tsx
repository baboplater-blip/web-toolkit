'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Download, FileText } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

const SAMPLE_MD = `# 제목

이것은 **굵게**, *기울임*, ~~취소선~~ 그리고 \`인라인 코드\` 예시입니다.

- 목록 1
- 목록 2
  1. 중첩 항목

> 인용문입니다.

[링크](https://example.com) 와 ![이미지](https://example.com/img.png).

\`\`\`js
const x = 1;
\`\`\`

---

<div>남은 HTML 태그</div>
`;

/**
 * 마크다운 서식을 제거해 순수 텍스트로 변환한다.
 * 펜스 코드 블록은 내부 텍스트를 보존하고, 인라인 서식·링크·이미지·HTML 태그는 제거한다.
 */
function markdownToText(markdown: string): string {
  let text = markdown.replace(/\r\n/g, '\n');

  // 1) 펜스 코드 블록(```lang ... ```)은 펜스만 제거하고 내부 코드는 보존.
  text = text.replace(/^[ \t]*```[^\n]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm, (_match, code) => code);

  // 2) 이미지 ![alt](url) → alt (alt 가 없으면 제거).
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 3) 링크 [text](url) → text.
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 4) 인라인 코드 `code` → code.
  text = text.replace(/`([^`]+)`/g, '$1');

  const lines = text.split('\n').map((line) => {
    let result = line;

    // 5) ATX 헤딩 마커(#, ## …)와 후행 # 제거.
    result = result.replace(/^[ \t]*#{1,6}[ \t]+/, '').replace(/[ \t]+#+[ \t]*$/, '');

    // 6) 인용 마커(>, >> …) 제거.
    result = result.replace(/^[ \t]*(?:>[ \t]?)+/, '');

    // 7) 수평선(---, ***, ___) → 빈 줄.
    if (/^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(result)) {
      return '';
    }

    // 8) 목록 마커(-, *, +, 1.) 제거(들여쓰기는 보존).
    result = result.replace(/^([ \t]*)(?:[-*+]|\d+[.)])[ \t]+/, '$1');

    return result;
  });

  text = lines.join('\n');

  // 9) 굵게/기울임/취소선 강조 마커 제거(내용 보존).
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/~~(.*?)~~/g, '$1');

  // 10) 남은 HTML 태그 제거.
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // 11) 3줄 이상 연속 빈 줄을 2줄로 축약하고 앞뒤 공백 정리.
  text = text.replace(/[ \t]+$/gm, '');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

export default function MarkdownToTextPage() {
  const [input, setInput] = useState(SAMPLE_MD);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => (input ? markdownToText(input) : ''), [input]);

  const reset = () => {
    setInput('');
    setCopied(false);
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  };

  const download = () => {
    if (!output) return;
    triggerDownload(new Blob([output], { type: 'text/plain;charset=utf-8' }), 'plain.txt');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="마크다운 → 일반 텍스트" onReset={reset} widthClass="max-w-5xl" />

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <header className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
            마크다운 → 일반 텍스트
          </h2>
          <p className="text-sm text-muted-foreground">
            마크다운 서식을 제거해 순수 텍스트로 변환합니다. 모든 처리는 브라우저에서 수행됩니다.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <label className="text-xs font-medium" htmlFor="md-input">
              마크다운 입력
            </label>
            <textarea
              id="md-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full resize-y rounded-lg border bg-background px-2.5 py-2 font-mono text-xs"
              aria-label="마크다운 입력"
            />
          </div>

          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" htmlFor="text-output">
                일반 텍스트 결과
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={copy}
                  disabled={!output}
                  className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] hover:bg-muted disabled:opacity-50"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? '복사됨' : '복사'}
                </button>
                <button
                  type="button"
                  onClick={download}
                  disabled={!output}
                  className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] hover:bg-muted disabled:opacity-50"
                >
                  <Download className="h-3 w-3" />
                  TXT
                </button>
              </div>
            </div>
            <textarea
              id="text-output"
              readOnly
              value={output}
              rows={18}
              className="w-full resize-y rounded-lg border bg-muted px-2.5 py-2 font-mono text-xs"
              aria-label="일반 텍스트 결과"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
