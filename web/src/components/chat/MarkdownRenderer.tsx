'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useCallback, useMemo } from 'react';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';

/**
 * 코드 블록 내용을 간단한 문법적 단서로 분석해 언어를 추정한다.
 * 이미 ```python 같은 명시 펜스가 있으면 그 값을 우선 쓴다.
 */
function detectLanguage(explicit: string, code: string): string {
  if (explicit) return explicit;
  const sample = code.slice(0, 400);
  if (/^\s*<\?xml|^\s*<!DOCTYPE html|^\s*<html|<\/\w+>/.test(sample)) return 'html';
  if (/^\s*{[\s\S]*}\s*$/.test(sample) && /"[\w-]+"\s*:/.test(sample)) return 'json';
  if (/^\s*(def\s+\w+|import\s+\w+|from\s+\w+\s+import|print\()/.test(sample)) return 'python';
  if (/^\s*(function\s+\w+|const\s+\w+|let\s+\w+|export\s+)/.test(sample)) return 'javascript';
  if (/^\s*(public\s+class|private\s+\w+|System\.out\.println)/.test(sample)) return 'java';
  if (/^\s*(using\s+\w+;|namespace\s+\w+|public\s+class)/.test(sample)) return 'csharp';
  if (/^\s*(package\s+\w+|func\s+\w+|import\s+"[^"]+")/.test(sample)) return 'go';
  if (/^\s*(#include|int\s+main\s*\()/.test(sample)) return 'cpp';
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE)\s+/i.test(sample)) return 'sql';
  if (/^\s*(#!\/bin\/bash|if\s*\[\[|echo\s)/.test(sample)) return 'bash';
  return '';
}

const EXT_BY_LANG: Record<string, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  typescriptreact: 'tsx',
  javascriptreact: 'jsx',
  html: 'html',
  css: 'css',
  json: 'json',
  yaml: 'yml',
  yml: 'yml',
  sql: 'sql',
  bash: 'sh',
  shell: 'sh',
  java: 'java',
  csharp: 'cs',
  cs: 'cs',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rs',
  ruby: 'rb',
  php: 'php',
  markdown: 'md',
  md: 'md',
  dockerfile: 'dockerfile',
};

// react-markdown 의 code 슬롯 시그니처가 복잡해 any 로 수용 — 소비만 하므로 안전
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CodeBlock({ className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const explicit = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');
  const lang = useMemo(() => detectLanguage(explicit, code), [explicit, code]);
  const lineCount = useMemo(() => code.split('\n').length, [code]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleDownload = useCallback(() => {
    const ext = EXT_BY_LANG[lang] ?? 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `snippet-${stamp}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [code, lang]);

  /**
   * VS Code URL scheme 으로 열기 (`vscode://file/<path>` 또는 `vscode://...`).
   * 바로 붙여넣기는 불가 — 임시 파일을 다운로드 받고 VS Code 는 그 파일을 열게 한다.
   * 실제 open 은 사용자가 파일을 수동으로 끌어 넣거나 OS 파일 연결에 의존.
   * 여기서는 scheme 핸들러가 있으면 vscode:// 기본 새 파일을 여는 식으로 동작 유도.
   */
  const handleOpenIDE = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {});
    // 새 파일 생성용 scheme — 브라우저가 핸들러를 못 찾으면 조용히 실패.
    try {
      window.location.href = 'vscode://file/';
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // 인라인 코드
  if (!className && !code.includes('\n')) {
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
        {children}
      </code>
    );
  }

  // 코드 블록
  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between bg-zinc-800 text-zinc-400 text-[11px] px-3 py-1 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="font-mono">{lang || 'code'}</span>
          <span className="text-zinc-500">· {lineCount}줄 · {code.length.toLocaleString('ko-KR')}자</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenIDE}
            className="hidden md:flex items-center gap-1 hover:text-zinc-200 transition-colors"
            title="코드 복사 후 VS Code 열기 (IDE 설치·핸들러 필요)"
            aria-label="IDE 열기"
          >
            <ExternalLink className="h-3 w-3" />
            IDE
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
            title="파일로 저장"
            aria-label="파일로 저장"
          >
            <Download className="h-3 w-3" />
            저장
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
            title="복사"
            aria-label="복사"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                복사
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-b-lg overflow-x-auto text-[13px] leading-relaxed">
        {lang === 'diff' ? (
          <code className={className} {...props}>
            {code.split('\n').map((line, i) => {
              const cls =
                line.startsWith('+') && !line.startsWith('+++')
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : line.startsWith('-') && !line.startsWith('---')
                  ? 'bg-rose-500/10 text-rose-300'
                  : line.startsWith('@@')
                  ? 'text-sky-400'
                  : line.startsWith('+++') || line.startsWith('---')
                  ? 'text-zinc-400'
                  : '';
              return (
                <span key={i} className={`block px-1 -mx-1 ${cls}`}>
                  {line || '\u200B'}
                </span>
              );
            })}
          </code>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        )}
      </pre>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: CodeBlock,
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-1.5 mt-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
        a: ({ href, children }) => {
          // 이미지 링크면 inline 썸네일 + 링크 병행. 자식이 텍스트와 동일할 때(자동링크)만 썸네일.
          const safeHref = typeof href === 'string' ? href : '';
          const isImage =
            /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|#|$)/i.test(safeHref) ||
            /^data:image\//i.test(safeHref);
          return (
            <>
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                {children}
              </a>
              {isImage && safeHref && (
                <span className="block mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={safeHref}
                    alt=""
                    className="max-h-64 max-w-full rounded border border-border"
                    loading="lazy"
                  />
                </span>
              )}
            </>
          );
        },
        img: ({ src, alt }) => {
          const safeSrc = typeof src === 'string' ? src : '';
          if (!safeSrc) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeSrc}
              alt={alt ?? ''}
              className="max-h-80 max-w-full rounded border border-border my-1"
              loading="lazy"
            />
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zinc-500 pl-3 my-2 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-zinc-700 px-2 py-1 bg-zinc-800 text-left font-medium">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-zinc-700 px-2 py-1">{children}</td>
        ),
        hr: () => <hr className="my-3 border-zinc-700" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
