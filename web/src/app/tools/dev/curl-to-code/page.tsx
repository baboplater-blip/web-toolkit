'use client';

import { useMemo, useState } from 'react';
import { TerminalSquare, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface ParsedCurl {
  url: string;
  method: string;
  headers: Array<[string, string]>;
  data: string | null;
  /** 사용자가 명시한 Authorization Basic 인증(user:pass) */
  basicAuth: string | null;
}

type Lang = 'fetch' | 'axios' | 'python';

const TABS: ReadonlyArray<{ id: Lang; label: string }> = [
  { id: 'fetch', label: 'JavaScript (fetch)' },
  { id: 'axios', label: 'axios' },
  { id: 'python', label: 'Python (requests)' },
];

/**
 * cURL 명령 문자열을 셸 토큰 배열로 분해한다.
 * 작은/큰따옴표 묶음, 백슬래시 줄바꿈(\\\n), 따옴표 안 공백을 처리한다.
 */
function tokenizeCurl(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let hasContent = false;

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];

    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === '\\' && quote === '"') {
        // 큰따옴표 안에서만 백슬래시 이스케이프 인정
        const next = command[index + 1];
        current += next ?? '\\';
        index += 1;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      hasContent = true;
      continue;
    }

    if (char === '\\') {
      // 줄 연속(\ 다음 개행)은 공백처럼 취급, 그 외 백슬래시는 다음 문자를 리터럴로
      const next = command[index + 1];
      if (next === '\n' || next === '\r') {
        index += 1;
        continue;
      }
      if (next !== undefined) {
        current += next;
        hasContent = true;
        index += 1;
      }
      continue;
    }

    if (/\s/.test(char)) {
      if (hasContent) {
        tokens.push(current);
        current = '';
        hasContent = false;
      }
      continue;
    }

    current += char;
    hasContent = true;
  }

  if (hasContent) tokens.push(current);
  return tokens;
}

/** 토큰 배열에서 cURL 옵션을 해석한다. 실패 시 url 이 빈 문자열. */
function parseCurl(command: string): ParsedCurl {
  const tokens = tokenizeCurl(command.trim());
  const headers: Array<[string, string]> = [];
  const dataParts: string[] = [];
  let url = '';
  let method = '';
  let basicAuth: string | null = null;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === 'curl') continue;

    if (token === '-X' || token === '--request') {
      method = (tokens[index + 1] ?? '').toUpperCase();
      index += 1;
    } else if (token === '-H' || token === '--header') {
      const raw = tokens[index + 1] ?? '';
      const colon = raw.indexOf(':');
      if (colon > -1) {
        headers.push([raw.slice(0, colon).trim(), raw.slice(colon + 1).trim()]);
      }
      index += 1;
    } else if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-ascii'
    ) {
      dataParts.push(tokens[index + 1] ?? '');
      index += 1;
    } else if (token === '-u' || token === '--user') {
      basicAuth = tokens[index + 1] ?? '';
      index += 1;
    } else if (token === '--compressed' || token === '-L' || token === '--location' || token === '-s' || token === '--silent' || token === '-k' || token === '--insecure') {
      // 본문/헤더에 영향 없는 플래그는 무시
    } else if (token.startsWith('-')) {
      // 값이 따라올 수 있는 알 수 없는 옵션: 다음 토큰이 옵션이 아니면 소비
      const next = tokens[index + 1];
      if (next !== undefined && !next.startsWith('-')) index += 1;
    } else if (!url) {
      url = token;
    }
  }

  const data = dataParts.length > 0 ? dataParts.join('&') : null;
  if (!method) method = data !== null ? 'POST' : 'GET';

  return { url, method, headers, data, basicAuth };
}

function encodeBasicAuth(userPass: string): string {
  if (typeof btoa === 'function') {
    // btoa 는 Latin-1 만 — UTF-8 안전 인코딩
    const bytes = new TextEncoder().encode(userPass);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  return userPass;
}

function quoteJs(value: string): string {
  return JSON.stringify(value);
}

function headersToObjectLines(headers: Array<[string, string]>, basicAuth: string | null, indent: string): string[] {
  const lines = headers.map(([key, value]) => `${indent}${quoteJs(key)}: ${quoteJs(value)},`);
  if (basicAuth) {
    lines.push(`${indent}${quoteJs('Authorization')}: ${quoteJs(`Basic ${encodeBasicAuth(basicAuth)}`)},`);
  }
  return lines;
}

function buildFetch(parsed: ParsedCurl): string {
  const { url, method, headers, data, basicAuth } = parsed;
  const optionLines: string[] = [`  method: ${quoteJs(method)},`];
  const headerLines = headersToObjectLines(headers, basicAuth, '    ');
  if (headerLines.length > 0) {
    optionLines.push('  headers: {', ...headerLines, '  },');
  }
  if (data !== null) {
    optionLines.push(`  body: ${quoteJs(data)},`);
  }
  return [
    `const response = await fetch(${quoteJs(url)}, {`,
    ...optionLines,
    '});',
    'const data = await response.json();',
  ].join('\n');
}

function buildAxios(parsed: ParsedCurl): string {
  const { url, method, headers, data, basicAuth } = parsed;
  const lines: string[] = [
    'const response = await axios({',
    `  method: ${quoteJs(method.toLowerCase())},`,
    `  url: ${quoteJs(url)},`,
  ];
  const headerLines = headersToObjectLines(headers, basicAuth, '    ');
  if (headerLines.length > 0) {
    lines.push('  headers: {', ...headerLines, '  },');
  }
  if (data !== null) {
    lines.push(`  data: ${quoteJs(data)},`);
  }
  lines.push('});');
  return lines.join('\n');
}

function quotePy(value: string): string {
  // 파이썬 문자열: 작은따옴표 기준, 역슬래시·작은따옴표 이스케이프
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function buildPython(parsed: ParsedCurl): string {
  const { url, method, headers, data, basicAuth } = parsed;
  const lines: string[] = ['import requests', ''];

  if (headers.length > 0) {
    lines.push('headers = {');
    for (const [key, value] of headers) {
      lines.push(`    ${quotePy(key)}: ${quotePy(value)},`);
    }
    lines.push('}');
  }

  const args: string[] = [quotePy(url)];
  if (headers.length > 0) args.push('headers=headers');
  if (data !== null) args.push(`data=${quotePy(data)}`);
  if (basicAuth) {
    const [user, ...rest] = basicAuth.split(':');
    args.push(`auth=(${quotePy(user)}, ${quotePy(rest.join(':'))})`);
  }

  lines.push('');
  lines.push(`response = requests.${method.toLowerCase()}(${args.join(', ')})`);
  lines.push('data = response.json()');
  return lines.join('\n');
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={copy}
        className="absolute right-2 top-2"
        aria-label="코드 복사"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? '복사됨' : '복사'}
      </Button>
      <pre className="overflow-x-auto rounded-xl border bg-muted/40 p-3 pt-12 font-mono text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function CurlToCodePage() {
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Lang>('fetch');

  const parsed = useMemo(() => (input.trim() ? parseCurl(input) : null), [input]);
  const error = parsed !== null && !parsed.url ? 'cURL 명령에서 URL 을 찾을 수 없습니다.' : null;

  const code = useMemo(() => {
    if (!parsed || !parsed.url) return '';
    if (tab === 'fetch') return buildFetch(parsed);
    if (tab === 'axios') return buildAxios(parsed);
    return buildPython(parsed);
  }, [parsed, tab]);

  function reset() {
    setInput('');
    setTab('fetch');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="cURL 변환" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <TerminalSquare className="h-4 w-4 text-primary" aria-hidden />
          cURL 명령을 fetch·axios·Python requests 코드로 변환합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">cURL 명령</span>
          <textarea
            className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={"curl -X POST https://api.example.com/users \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"kim\"}'"}
            aria-label="cURL 명령 입력"
          />
        </label>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {code && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((item) => (
                <Button
                  key={item.id}
                  variant={tab === item.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <CodeBlock code={code} />
          </div>
        )}
      </main>
    </div>
  );
}
