'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Eye } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

const SAMPLE_MD = `# 마크다운 미리보기

**굵게**, *기울임*, \`인라인 코드\` 를 지원합니다.

> 인용문도 표현할 수 있습니다.

- 첫째 항목
- 둘째 항목
- 셋째 항목

1. 번호 목록
2. 두 번째

[웹 툴킷](https://example.com) 으로 이동.

---

\`\`\`
코드 블록은
그대로 보존됩니다.
\`\`\`
`;

/* ------------------------------------------------------------------ */
/* 경량 마크다운 → HTML 렌더러 (의존성 없음)                           */
/* 보안: 모든 텍스트를 먼저 HTML escape 한 뒤 인라인 문법을 적용한다.  */
/* 따라서 입력의 원시 HTML 은 절대 실행되지 않는다(XSS 방지).          */
/* 지원: 제목 h1~h6, 굵게, 기울임, 인라인 코드, 코드블록(```),         */
/*       링크, 순서/비순서 목록, 인용문, 수평선.                       */
/* ------------------------------------------------------------------ */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 이미 escape 된 텍스트에 인라인 문법을 적용. 코드 → 링크 → 굵게 → 기울임 순. */
function renderInline(escaped: string): string {
  let result = escaped;

  // 인라인 코드: `code` (내부는 추가 변환 안 함).
  result = result.replace(/`([^`]+?)`/g, (_m, code: string) => `<code>${code}</code>`);

  // 링크: [text](url) — url 은 안전한 스킴만 허용.
  result = result.replace(
    /\[([^\]]+?)\]\(([^)\s]+?)\)/g,
    (_m, label: string, href: string) => {
      if (!isSafeUrl(href)) return `${label} (${href})`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    },
  );

  // 굵게: **text** (기울임보다 먼저 처리).
  result = result.replace(/\*\*([^*]+?)\*\*/g, (_m, t: string) => `<strong>${t}</strong>`);

  // 기울임: *text*.
  result = result.replace(/\*([^*]+?)\*/g, (_m, t: string) => `<em>${t}</em>`);

  return result;
}

/** escape 후 문자열 기준으로 안전한 URL 스킴인지 확인(javascript: 등 차단). */
function isSafeUrl(href: string): boolean {
  const normalized = href.trim().toLowerCase();
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('/') ||
    normalized.startsWith('#')
  ) {
    return true;
  }
  // 스킴이 없는 상대 경로(콜론 없음)도 허용.
  return !normalized.includes(':');
}

function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.map((l) => renderInline(escapeHtml(l))).join('<br>');
    html.push(`<p>${text}</p>`);
    paragraphBuffer = [];
  };

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;

    // 코드블록 토글.
    if (/^```/.test(line.trim())) {
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        closeList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    // 빈 줄 → 문단·목록 경계.
    if (trimmed === '') {
      flushParagraph();
      closeList();
      continue;
    }

    // 수평선.
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      closeList();
      html.push('<hr>');
      continue;
    }

    // 제목 h1~h6.
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(escapeHtml(heading[2].trim()))}</h${level}>`);
      continue;
    }

    // 인용문.
    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${renderInline(escapeHtml(quote[1]))}</blockquote>`);
      continue;
    }

    // 순서 없는 목록.
    const ul = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ul) {
      flushParagraph();
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${renderInline(escapeHtml(ul[1]))}</li>`);
      continue;
    }

    // 순서 있는 목록.
    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushParagraph();
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${renderInline(escapeHtml(ol[1]))}</li>`);
      continue;
    }

    // 일반 문단(목록 진행 중이면 종료).
    closeList();
    paragraphBuffer.push(line);
  }

  // 잔여 flush.
  if (inCodeBlock) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
  }
  flushParagraph();
  closeList();

  return html.join('\n');
}

export default function MarkdownPreviewPage() {
  const [input, setInput] = useState(SAMPLE_MD);
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => {
    try {
      return renderMarkdown(input);
    } catch {
      return '';
    }
  }, [input]);

  const copy = async () => {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    triggerDownload(new Blob([html], { type: 'text/html;charset=utf-8' }), 'preview.html');
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Eye className="h-5 w-5" />
            <h1 className="font-semibold text-base">마크다운 실시간 미리보기</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto space-y-3">
        <div className="grid lg:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">입력 (마크다운)</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={22}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false}
              aria-label="마크다운 입력"
            />
          </div>

          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">미리보기</label>
            <div
              className="markdown-body min-h-[28rem] rounded-lg border bg-background px-3 py-2 text-sm overflow-auto prose-preview"
              // 모든 텍스트가 escapeHtml 로 정화된 뒤 제한된 인라인 문법만 적용되므로 안전.
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>

          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">생성된 HTML</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={html}
              rows={22}
              className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y"
              aria-label="생성된 HTML"
            />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          자체 경량 렌더러 — 제목·굵게·기울임·인라인 코드·코드블록·링크·목록·인용·수평선 지원. 모든 텍스트는
          HTML escape 후 변환되어 원시 HTML 은 실행되지 않습니다(XSS 방지). 표·중첩 목록은 미지원.
        </p>
      </main>
    </div>
  );
}
