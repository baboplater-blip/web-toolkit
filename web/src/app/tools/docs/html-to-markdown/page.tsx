'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

const SAMPLE_HTML = `<h1>제목</h1>
<p>이것은 <strong>굵은</strong> 글씨와 <em>기울임</em>이 포함된 문단입니다.</p>
<p>링크는 <a href="https://example.com">여기</a>를 보세요.</p>
<ul>
  <li>첫째 항목</li>
  <li>둘째 항목</li>
</ul>
<blockquote>인용문입니다.</blockquote>
<pre><code>const x = 1;</code></pre>`;

/** 인라인 텍스트 양옆 공백을 보존하면서 마커를 붙일 수 있도록 분리한다. */
function wrapInline(text: string, marker: string): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!match) return text;
  const [, leading, core, trailing] = match;
  if (!core) return text;
  return `${leading}${marker}${core}${marker}${trailing}`;
}

/**
 * 단일 DOM 노드를 마크다운 문자열로 변환한다(재귀).
 * 블록 요소는 앞뒤 개행을, 인라인 요소는 마커를 적용한다.
 */
function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    // 텍스트 노드는 연속 공백을 한 칸으로 접되 줄바꿈 의미는 블록 처리에서 부여한다.
    return (node.textContent ?? '').replace(/\s+/g, ' ');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const childrenMd = (): string =>
    Array.from(element.childNodes).map(nodeToMarkdown).join('');

  switch (tag) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const level = Number(tag.charAt(1));
      return `\n\n${'#'.repeat(level)} ${childrenMd().trim()}\n\n`;
    }
    case 'strong':
    case 'b':
      return wrapInline(childrenMd(), '**');
    case 'em':
    case 'i':
      return wrapInline(childrenMd(), '_');
    case 'code':
      // <pre> 안의 <code> 는 pre 분기에서 처리되므로 여기선 인라인 코드만.
      return `\`${childrenMd().trim()}\``;
    case 'pre': {
      const codeEl = element.querySelector('code');
      const raw = (codeEl ?? element).textContent ?? '';
      return `\n\n\`\`\`\n${raw.replace(/\n+$/, '')}\n\`\`\`\n\n`;
    }
    case 'a': {
      const href = element.getAttribute('href') ?? '';
      const label = childrenMd().trim();
      return href ? `[${label}](${href})` : label;
    }
    case 'img': {
      const src = element.getAttribute('src') ?? '';
      const alt = element.getAttribute('alt') ?? '';
      return src ? `![${alt}](${src})` : '';
    }
    case 'br':
      return '  \n';
    case 'p':
      return `\n\n${childrenMd().trim()}\n\n`;
    case 'blockquote': {
      const inner = childrenMd().trim();
      const quoted = inner
        .split('\n')
        .map((line) => `> ${line}`.trimEnd())
        .join('\n');
      return `\n\n${quoted}\n\n`;
    }
    case 'ul':
    case 'ol': {
      const ordered = tag === 'ol';
      const items = Array.from(element.children).filter((child) => child.tagName.toLowerCase() === 'li');
      const rendered = items
        .map((li, index) => {
          const prefix = ordered ? `${index + 1}.` : '-';
          const content = Array.from(li.childNodes).map(nodeToMarkdown).join('').trim();
          return `${prefix} ${content}`;
        })
        .join('\n');
      return `\n\n${rendered}\n\n`;
    }
    case 'li':
      // 일반적으로 ul/ol 분기에서 처리되지만, 고아 li 도 안전하게 변환한다.
      return `- ${childrenMd().trim()}\n`;
    default:
      // 알 수 없는 태그는 제거하고 내용만 남긴다.
      return childrenMd();
  }
}

/** HTML 문자열을 마크다운으로 변환한다(브라우저 DOMParser 사용). */
function htmlToMarkdown(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const markdown = Array.from(doc.body.childNodes).map(nodeToMarkdown).join('');
  // 과도한 빈 줄을 최대 2개로 정리하고 양끝 공백을 제거한다.
  return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

export default function HtmlToMarkdownPage() {
  const [input, setInput] = useState(SAMPLE_HTML);
  const [copied, setCopied] = useState(false);

  // 초기 렌더는 빈 문자열로 결정적이며, 입력이 있을 때만 DOMParser 가 실행된다.
  const output = useMemo(() => (input.trim() ? htmlToMarkdown(input) : ''), [input]);

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
    triggerDownload(new Blob([output], { type: 'text/markdown;charset=utf-8' }), 'output.md');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="HTML → 마크다운 변환" onReset={reset} widthClass="max-w-5xl" />

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <header className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileCode className="h-5 w-5 text-primary" aria-hidden />
            HTML → 마크다운 변환
          </h2>
          <p className="text-sm text-muted-foreground">
            HTML 을 마크다운 문법으로 변환합니다. 제목·강조·링크·이미지·목록·코드·인용을 지원하며 모든 처리는
            브라우저에서 수행됩니다.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <label className="text-xs font-medium" htmlFor="html-input">
              HTML 입력
            </label>
            <textarea
              id="html-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full resize-y rounded-lg border bg-background px-2.5 py-2 font-mono text-xs"
              aria-label="HTML 입력"
            />
          </div>

          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" htmlFor="markdown-output">
                마크다운 결과
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
                  MD
                </button>
              </div>
            </div>
            <textarea
              id="markdown-output"
              readOnly
              value={output}
              rows={18}
              className="w-full resize-y rounded-lg border bg-muted px-2.5 py-2 font-mono text-xs"
              aria-label="마크다운 결과"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
