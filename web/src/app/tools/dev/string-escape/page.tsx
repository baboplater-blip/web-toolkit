'use client';

import { useMemo, useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'json' | 'javascript' | 'html' | 'sql' | 'url';
type Direction = 'escape' | 'unescape';

const MODES: { value: Mode; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'sql', label: 'SQL' },
  { value: 'url', label: 'URL' },
];

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const HTML_UNESCAPE: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&apos;': "'",
};

/** JS/JSON 문자열 리터럴용 이스케이프(따옴표는 감싸지 않고 내부 문자만 처리). */
function escapeJs(input: string): string {
  let out = '';
  for (const ch of input) {
    switch (ch) {
      case '\\': out += '\\\\'; break;
      case '"': out += '\\"'; break;
      case '\n': out += '\\n'; break;
      case '\r': out += '\\r'; break;
      case '\t': out += '\\t'; break;
      case '\b': out += '\\b'; break;
      case '\f': out += '\\f'; break;
      default: {
        const code = ch.codePointAt(0) ?? 0;
        out += code < 0x20 ? `\\u${code.toString(16).padStart(4, '0')}` : ch;
      }
    }
  }
  return out;
}

/** JS/JSON 이스케이프 시퀀스를 원문으로 되돌린다. */
function unescapeJs(input: string): string {
  return input.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, seq: string) => {
    if (seq[0] === 'u') return String.fromCodePoint(parseInt(seq.slice(1), 16));
    if (seq[0] === 'x') return String.fromCodePoint(parseInt(seq.slice(1), 16));
    const map: Record<string, string> = {
      n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '\\': '\\', '"': '"', "'": "'", '0': '\0',
    };
    return map[seq] ?? seq;
  });
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch]);
}

function unescapeHtml(input: string): string {
  return input
    .replace(/&(amp|lt|gt|quot|apos|#39|#x27);/g, (entity) => HTML_UNESCAPE[entity] ?? entity)
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

/** SQL 문자열 리터럴: 작은따옴표를 두 번 반복(표준 SQL), 백슬래시 보존. */
function escapeSql(input: string): string {
  return input.replace(/'/g, "''");
}
function unescapeSql(input: string): string {
  return input.replace(/''/g, "'");
}

/** 변환을 수행한다. 실패 시 사용자용 메시지를 던진다. */
function transform(input: string, mode: Mode, direction: Direction): string {
  if (mode === 'json') {
    if (direction === 'escape') return JSON.stringify(input).slice(1, -1);
    return unescapeJs(input);
  }
  if (mode === 'javascript') {
    return direction === 'escape' ? escapeJs(input) : unescapeJs(input);
  }
  if (mode === 'html') {
    return direction === 'escape' ? escapeHtml(input) : unescapeHtml(input);
  }
  if (mode === 'sql') {
    return direction === 'escape' ? escapeSql(input) : unescapeSql(input);
  }
  // url
  if (direction === 'escape') return encodeURIComponent(input);
  return decodeURIComponent(input);
}

interface Result {
  output: string;
  error: string | null;
}

function run(input: string, mode: Mode, direction: Direction): Result {
  if (input === '') return { output: '', error: null };
  try {
    return { output: transform(input, mode, direction), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { output: '', error: `변환 실패: ${message}` };
  }
}

export default function StringEscapePage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('json');
  const [direction, setDirection] = useState<Direction>('escape');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => run(input, mode, direction), [input, mode, direction]);

  async function copy() {
    if (!result.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setInput('');
    setMode('json');
    setDirection('escape');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="문자열 이스케이프" onReset={input ? reset : undefined} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Code className="h-4 w-4 text-primary" aria-hidden />
          JSON · JS · HTML · SQL · URL 로 문자열을 이스케이프/언이스케이프합니다.
        </p>

        <div className="flex flex-wrap gap-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">형식</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              aria-label="이스케이프 형식"
            >
              {MODES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">방향</span>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
              className="block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              aria-label="변환 방향"
            >
              <option value="escape">이스케이프</option>
              <option value="unescape">언이스케이프</option>
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
            spellCheck={false}
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={result.output}
            readOnly
            placeholder="결과"
            aria-label="결과"
          />
        </div>

        {result.error && <p className="text-xs text-destructive">{result.error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} disabled={!result.output}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
      </main>
    </div>
  );
}
