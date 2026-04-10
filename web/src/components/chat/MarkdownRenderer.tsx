'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

function CodeBlock({ className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
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
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
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
      <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-b-lg overflow-x-auto text-[13px] leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
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
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            {children}
          </a>
        ),
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
