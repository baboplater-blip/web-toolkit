'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'minify' | 'beautify';

/** CSS 주석 제거. 문자열 리터럴 내부 보존은 하지 않는 경량 구현. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** CSS 를 압축: 주석·불필요 공백 제거. */
function minify(css: string): string {
  return stripComments(css)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s*!\s*important/gi, '!important')
    .trim();
}

/** CSS 를 규칙별 줄바꿈 + 2칸 들여쓰기로 정리. */
function beautify(css: string): string {
  const compact = minify(css);
  const lines: string[] = [];
  let indent = 0;
  let buffer = '';

  const pushLine = (text: string): void => {
    const trimmed = text.trim();
    if (trimmed) lines.push('  '.repeat(indent) + trimmed);
  };

  for (const char of compact) {
    if (char === '{') {
      pushLine(`${buffer.trim()} {`);
      buffer = '';
      indent += 1;
    } else if (char === '}') {
      pushLine(buffer);
      buffer = '';
      indent = Math.max(0, indent - 1);
      pushLine('}');
    } else if (char === ';') {
      pushLine(`${buffer.trim()};`);
      buffer = '';
    } else {
      buffer += char;
    }
  }
  pushLine(buffer);
  return lines.join('\n');
}

function formatBytes(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function CssMinifyPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('minify');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return mode === 'minify' ? minify(input) : beautify(input);
  }, [input, mode]);

  async function copy() {
    if (!output) return;
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed', e);
      setCopyError('복사에 실패했습니다.');
    }
  }

  function reset() {
    setInput('');
    setMode('minify');
    setCopied(false);
    setCopyError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS 압축/정리" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">CSS 를 압축하거나 보기 좋게 정리합니다.</p>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant={mode === 'minify' ? 'default' : 'outline'} onClick={() => setMode('minify')}>
            압축
          </Button>
          <Button size="sm" variant={mode === 'beautify' ? 'default' : 'outline'} onClick={() => setMode('beautify')}>
            정리
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="여기에 CSS 를 입력하세요"
            aria-label="입력 CSS"
            spellCheck={false}
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="결과"
            aria-label="결과 CSS"
            spellCheck={false}
          />
        </div>

        {output && (
          <p className="text-xs text-muted-foreground">
            원본 {formatBytes(input)} → 결과 {formatBytes(output)}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? '복사됨' : '복사'}
          </Button>
          {copyError && <span className="text-sm text-destructive">{copyError}</span>}
        </div>
      </main>
    </div>
  );
}
