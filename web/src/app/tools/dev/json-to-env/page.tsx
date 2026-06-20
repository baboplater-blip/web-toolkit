'use client';

import { useMemo, useState } from 'react';
import { FileKey, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface ConvertResult {
  output: string;
  error: string | null;
}

/** 키 조각을 .env 키 규칙(대문자 + 비영숫자→`_`)으로 정규화한다. */
function normalizeKeyPart(part: string): string {
  return part
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // camelCase → camel_Case
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

/** .env 값으로 따옴표가 필요한지 판단(공백·#·따옴표·역슬래시·개행 포함 또는 빈 값). */
function needsQuotes(value: string): boolean {
  return value === '' || /[\s#"'\\]/.test(value);
}

function formatValue(value: string | number | boolean): string {
  const text = String(value);
  if (!needsQuotes(text)) return text;
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  return `"${escaped}"`;
}

/**
 * 중첩 JSON 을 평탄화해 `PARENT_CHILD=value` 형태의 .env 라인 배열로 누적한다.
 * 객체는 키를 잇고, 배열은 인덱스를 키 조각으로 사용한다.
 */
function flatten(value: unknown, prefix: string, lines: string[]): void {
  if (value === null) {
    lines.push(`${prefix}=`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${prefix}=`);
      return;
    }
    value.forEach((item, index) => {
      flatten(item, prefix === '' ? String(index) : `${prefix}_${index}`, lines);
    });
    return;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      lines.push(`${prefix}=`);
      return;
    }
    for (const [rawKey, child] of entries) {
      const part = normalizeKeyPart(rawKey);
      const nextPrefix = prefix === '' ? part : `${prefix}_${part}`;
      flatten(child, nextPrefix, lines);
    }
    return;
  }
  lines.push(`${prefix}=${formatValue(value as string | number | boolean)}`);
}

function jsonToEnv(text: string): ConvertResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { output: '', error: `JSON 파싱 오류: ${message}` };
  }

  if (parsed === null || typeof parsed !== 'object') {
    return { output: '', error: '객체 또는 배열 형태의 JSON 만 변환할 수 있습니다.' };
  }

  const lines: string[] = [];
  flatten(parsed, '', lines);
  if (lines.length === 0) {
    return { output: '', error: '변환할 키가 없습니다.' };
  }
  return { output: lines.join('\n'), error: null };
}

const PLACEHOLDER = '{\n  "database": {\n    "host": "localhost",\n    "port": 5432\n  },\n  "apiKey": "abc 123"\n}';

export default function JsonToEnvPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo<ConvertResult>(() => {
    if (!input.trim()) return { output: '', error: null };
    return jsonToEnv(input);
  }, [input]);

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '.env';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setInput('');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON → .env" onReset={input !== '' ? reset : undefined} />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileKey className="h-4 w-4 text-primary" aria-hidden />
          중첩 JSON 을 대문자 키의 .env 환경변수로 평탄화합니다. 중첩은 <code>PARENT_CHILD</code> 로 이어집니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">JSON 입력</span>
            <textarea
              className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDER}
              aria-label="JSON 입력"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">.env 결과</span>
            <textarea
              className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
              value={output}
              readOnly
              placeholder="결과"
              aria-label=".env 결과"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!output}>다운로드</Button>
        </div>
      </main>
    </div>
  );
}
