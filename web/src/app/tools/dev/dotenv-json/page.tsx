'use client';

import { useMemo, useState } from 'react';
import { FileCode, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Direction = 'env-to-json' | 'json-to-env';

interface ConvertResult {
  output: string;
  error: string | null;
}

/** .env 값 양끝의 짝 맞는 따옴표 한 겹을 제거한다. */
function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' || first === "'") && first === last) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseDotenvToJson(text: string): ConvertResult {
  const result: Record<string, string> = {};
  const lines = text.split(/\r?\n/);

  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    let line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice('export '.length).trim();

    const eq = line.indexOf('=');
    if (eq === -1) {
      return { output: '', error: `${lineNo + 1}번째 줄: '=' 가 없는 항목입니다.` };
    }
    const key = line.slice(0, eq).trim();
    if (!key) {
      return { output: '', error: `${lineNo + 1}번째 줄: 키가 비어 있습니다.` };
    }
    result[key] = stripQuotes(line.slice(eq + 1));
  }

  return { output: JSON.stringify(result, null, 2), error: null };
}

/** .env 한 줄로 쓸 때 따옴표가 필요한 값인지 판단(공백·# 포함 등). */
function needsQuotes(value: string): boolean {
  return /[\s#"'\\]/.test(value) || value === '';
}

function escapeEnvValue(value: string): string {
  if (!needsQuotes(value)) return value;
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function parseJsonToDotenv(text: string): ConvertResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { output: '', error: `JSON 파싱 오류: ${message}` };
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { output: '', error: '평탄한 JSON 객체만 변환할 수 있습니다.' };
  }

  const lines: string[] = [];
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (value !== null && typeof value === 'object') {
      return { output: '', error: `'${key}' 값이 중첩 객체/배열입니다. 평탄한 객체만 지원합니다.` };
    }
    const stringValue = value === null ? '' : String(value);
    lines.push(`${key}=${escapeEnvValue(stringValue)}`);
  }

  return { output: lines.join('\n'), error: null };
}

export default function DotenvJsonPage() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('env-to-json');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo<ConvertResult>(() => {
    if (!input.trim()) return { output: '', error: null };
    return direction === 'env-to-json' ? parseDotenvToJson(input) : parseJsonToDotenv(input);
  }, [input, direction]);

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

  function reset() {
    setInput('');
    setDirection('env-to-json');
    setCopied(false);
  }

  const inputLabel = direction === 'env-to-json' ? '.env 입력' : 'JSON 입력';
  const inputPlaceholder =
    direction === 'env-to-json'
      ? 'export API_KEY="abc 123"\nPORT=3000\n# 주석'
      : '{\n  "API_KEY": "abc 123",\n  "PORT": "3000"\n}';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title=".env ↔ JSON" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCode className="h-4 w-4 text-primary" aria-hidden />
          .env 파일과 평탄한 JSON 객체를 상호 변환합니다.
        </p>

        <div className="flex gap-1.5">
          <Button
            variant={direction === 'env-to-json' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDirection('env-to-json')}
          >
            .env → JSON
          </Button>
          <Button
            variant={direction === 'json-to-env' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDirection('json-to-env')}
          >
            JSON → .env
          </Button>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">{inputLabel}</span>
          <textarea
            className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={inputPlaceholder}
            aria-label={inputLabel}
          />
        </label>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">결과</span>
              <Button variant="outline" size="sm" onClick={copy} aria-label="결과 복사">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-xl border bg-muted/40 p-3 font-mono text-sm">
              <code>{output}</code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
