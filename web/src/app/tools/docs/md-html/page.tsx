'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Copy, Check, Download, FileText } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

type Direction = 'md-to-html' | 'html-to-md';

const SAMPLE_MD = `# Hello

**Bold** and *italic* text.

- Item 1
- Item 2

\`\`\`js
const x = 1;
\`\`\`

[Link](https://example.com)`;

export default function MdHtmlPage() {
  const [dir, setDir] = useState<Direction>('md-to-html');
  const [input, setInput] = useState(SAMPLE_MD);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      if (!input.trim()) {
        setOutput('');
        return;
      }
      try {
        if (dir === 'md-to-html') {
          const { marked } = await import('marked');
          const html = await marked.parse(input, { async: true });
          if (!cancelled) setOutput(typeof html === 'string' ? html : '');
        } else {
          const TurndownService = (await import('turndown')).default;
          const svc = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
          if (!cancelled) setOutput(svc.turndown(input));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '변환 실패');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [input, dir]);

  const swap = () => {
    setInput(output);
    setDir(dir === 'md-to-html' ? 'html-to-md' : 'md-to-html');
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const ext = dir === 'md-to-html' ? 'html' : 'md';
    const mime = dir === 'md-to-html' ? 'text/html' : 'text/markdown';
    triggerDownload(new Blob([output], { type: mime }), `converted.${ext}`);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <FileText className="h-5 w-5" />
            <h1 className="font-semibold text-base">Markdown ↔ HTML</h1>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={swap}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            방향 전환
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDir('md-to-html')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'md-to-html'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            Markdown → HTML
          </button>
          <button
            type="button"
            onClick={() => setDir('html-to-md')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'html-to-md'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            HTML → Markdown
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">
              입력 ({dir === 'md-to-html' ? 'Markdown' : 'HTML'})
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false} aria-label="입력 ( )" />
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">
                출력 ({dir === 'md-to-html' ? 'HTML' : 'Markdown'})
              </label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? '소스' : '미리보기'}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {showPreview && dir === 'md-to-html' ? (
              <div
                className="w-full h-[28rem] rounded-lg border bg-background px-3 py-2 text-sm overflow-auto prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            ) : (
              <textarea
                readOnly
                value={output}
                rows={18}
                className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y" aria-label="결과" />
            )}
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          marked (MIT) + turndown (MIT) · 클라이언트 전용 변환
        </p>
      </main>
    </div>
  );
}
