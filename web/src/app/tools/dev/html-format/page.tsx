'use client';

import { useMemo, useState } from 'react';
import { Check, Code2, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { beautifyHtml, minifyHtml } from '@/lib/tools/html-format-formatter';

type Mode = 'beautify' | 'minify';

const SAMPLE = `<section class="card"><h2>제목</h2><p>본문 <strong>강조</strong> 텍스트</p><ul><li>하나</li><li>둘</li></ul></section>`;

export default function HtmlFormatPage() {
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState<Mode>('beautify');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return mode === 'beautify' ? beautifyHtml(input) : minifyHtml(input);
  }, [input, mode]);

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = mode === 'beautify' ? 'formatted.html' : 'minified.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Code2 className="h-5 w-5 text-primary" aria-hidden />
          HTML 정리·미화
        </h1>
        <p className="text-sm text-muted-foreground">
          HTML 을 들여쓰기로 정리하거나 한 줄로 압축합니다.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-sm font-medium">모드</span>
        <Button
          type="button"
          variant={mode === 'beautify' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('beautify')}
          aria-pressed={mode === 'beautify'}
        >
          정리 (Beautify)
        </Button>
        <Button
          type="button"
          variant={mode === 'minify' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('minify')}
          aria-pressed={mode === 'minify'}
        >
          압축 (Minify)
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 HTML 을 붙여넣으세요"
          spellCheck={false}
          aria-label="HTML 입력"
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
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? '복사됨' : '복사'}
        </Button>
        <Button variant="outline" onClick={download} disabled={!output}>
          <Download className="h-4 w-4" aria-hidden />
          다운로드
        </Button>
      </div>

      <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
        <p>
          <code className="font-mono">pre</code>·<code className="font-mono">script</code>·
          <code className="font-mono">style</code>·<code className="font-mono">textarea</code> 내부는
          원본 그대로 보존합니다. 모든 처리는 브라우저 안에서 이뤄집니다.
        </p>
      </div>
    </main>
  );
}
