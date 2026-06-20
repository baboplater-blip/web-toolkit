'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

const SAMPLE_JSON = `{
  "title": "TOML 예시",
  "owner": { "name": "Tom", "active": true },
  "ports": [8000, 8001, 8002],
  "servers": [
    { "host": "alpha", "ip": "10.0.0.1" },
    { "host": "beta", "ip": "10.0.0.2" }
  ]
}`;

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** TOML 베어 키로 쓸 수 있는지(영숫자·_·-) 판별. */
function isBareKey(key: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(key) && key.length > 0;
}

/** 문자열을 TOML 베이직 문자열로 이스케이프한다. */
function formatString(value: string): string {
  let escaped = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === '\\') escaped += '\\\\';
    else if (ch === '"') escaped += '\\"';
    else if (ch === '\n') escaped += '\\n';
    else if (ch === '\t') escaped += '\\t';
    else if (ch === '\r') escaped += '\\r';
    // 그 외 제어문자(U+0000~U+001F, U+007F)는 \uXXXX 로.
    else if (code < 0x20 || code === 0x7f) escaped += `\\u${code.toString(16).padStart(4, '0')}`;
    else escaped += ch;
  }
  return `"${escaped}"`;
}

/** TOML 키를 직렬화한다(필요 시 베이직 문자열 인용). */
function formatKey(key: string): string {
  return isBareKey(key) ? key : formatString(key);
}

function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 배열이 "객체들로만" 이뤄졌으면 array-of-tables [[...]] 로 표현 가능. */
function isTableArray(value: JsonValue[]): boolean {
  return value.length > 0 && value.every(isPlainObject);
}

/** 인라인(같은 줄) 값으로 직렬화 — 스칼라/스칼라 배열용. */
function formatInlineValue(value: JsonValue): string {
  if (value === null) {
    // TOML 에는 null 이 없다 → 빈 문자열로 대체(무손실은 아니나 안전).
    return '""';
  }
  if (typeof value === 'string') return formatString(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('TOML 은 Infinity·NaN 을 표현할 수 없습니다.');
    }
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => formatInlineValue(item)).join(', ')}]`;
  }
  // 인라인 테이블.
  const entries = Object.entries(value).map(
    ([k, v]) => `${formatKey(k)} = ${formatInlineValue(v)}`,
  );
  return `{ ${entries.join(', ')} }`;
}

/**
 * 객체를 TOML 로 직렬화한다. path 는 현재 테이블 경로(점 연결).
 * - 스칼라/스칼라 배열/혼합 배열 → 현재 테이블에 key = value
 * - 중첩 객체 → [table.path] 헤더 후 재귀
 * - 객체 배열 → [[table.path]] 헤더 반복
 */
function serializeTable(obj: { [key: string]: JsonValue }, path: string[], lines: string[]): void {
  const scalarKeys: string[] = [];
  const tableKeys: string[] = [];
  const tableArrayKeys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (isPlainObject(value)) {
      tableKeys.push(key);
    } else if (Array.isArray(value) && isTableArray(value)) {
      tableArrayKeys.push(key);
    } else {
      scalarKeys.push(key);
    }
  }

  // 스칼라류 먼저(TOML 관례: 테이블 헤더 전에 와야 한다).
  for (const key of scalarKeys) {
    lines.push(`${formatKey(key)} = ${formatInlineValue(obj[key])}`);
  }

  for (const key of tableKeys) {
    const childPath = [...path, key];
    lines.push('');
    lines.push(`[${childPath.map(formatKey).join('.')}]`);
    serializeTable(obj[key] as { [key: string]: JsonValue }, childPath, lines);
  }

  for (const key of tableArrayKeys) {
    const childPath = [...path, key];
    const header = `[[${childPath.map(formatKey).join('.')}]]`;
    for (const item of obj[key] as JsonValue[]) {
      lines.push('');
      lines.push(header);
      serializeTable(item as { [key: string]: JsonValue }, childPath, lines);
    }
  }
}

/** 최상위 JSON 값을 TOML 문서로 변환한다. 루트는 반드시 객체여야 한다. */
function jsonToToml(root: JsonValue): string {
  if (!isPlainObject(root)) {
    throw new Error('TOML 변환은 최상위가 JSON 객체({ ... })여야 합니다.');
  }
  const lines: string[] = [];
  serializeTable(root, [], lines);
  // 선행 빈 줄 정리.
  return lines.join('\n').replace(/^\n+/, '').trimEnd() + '\n';
}

export default function JsonToTomlPage() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo<{ output: string; error: string | null }>(() => {
    if (!input.trim()) return { output: '', error: null };
    let parsed: JsonValue;
    try {
      parsed = JSON.parse(input) as JsonValue;
    } catch (err) {
      return { output: '', error: err instanceof Error ? `JSON 파싱 오류: ${err.message}` : 'JSON 파싱 오류' };
    }
    try {
      return { output: jsonToToml(parsed), error: null };
    } catch (err) {
      return { output: '', error: err instanceof Error ? err.message : 'TOML 변환에 실패했습니다.' };
    }
  }, [input]);

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    triggerDownload(new Blob([output], { type: 'text/plain;charset=utf-8' }), 'config.toml');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="JSON → TOML"
        widthClass="max-w-5xl"
        onReset={input !== SAMPLE_JSON ? () => setInput(SAMPLE_JSON) : undefined}
      />
      <main className="mx-auto max-w-5xl space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          JSON 객체를 TOML 설정 형식으로 변환합니다. 중첩 객체는 [테이블], 객체 배열은 [[배열-테이블]]로 표현합니다.
          모든 처리는 브라우저 안에서 이루어집니다.
        </p>

        {error && (
          <div
            role="alert"
            className="whitespace-pre-line rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <label className="text-xs font-medium" htmlFor="json-input">
              입력 (JSON)
            </label>
            <textarea
              id="json-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full resize-y rounded-lg border bg-background px-2.5 py-2 font-mono text-xs"
              aria-label="입력"
            />
          </div>
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">출력 (TOML)</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy} disabled={!output}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download} disabled={!output}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={18}
              className="w-full resize-y rounded-lg border bg-muted px-2.5 py-2 font-mono text-xs"
              aria-label="결과"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
