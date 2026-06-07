'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Check, Copy, Download, FileCode2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

type Direction = 'toml-to-json' | 'json-to-toml';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const SAMPLE_TOML = `title = "web-toolkit"
version = 1

[owner]
name = "alice"
active = true

[database]
ports = [8000, 8001, 8002]
enabled = true

[servers.alpha]
ip = "10.0.0.1"`;

/* ------------------------------------------------------------------ */
/* TOML 파서 (의존성 없는 합리적 부분집합)                              */
/* 지원: [table] / [a.b.c] 테이블, key = value,                        */
/*       문자열("..." / '...'), 정수·실수, true/false, 배열,           */
/*       기본 인라인 테이블({ a = 1, b = 2 }), # 주석.                 */
/* 미지원: 배열 테이블([[..]]), 다중행 문자열, 날짜 타입 → 안내 문구.  */
/* ------------------------------------------------------------------ */

function parseToml(text: string): Record<string, JsonValue> {
  const root: Record<string, JsonValue> = {};
  let current: Record<string, JsonValue> = root;

  const lines = text.split(/\r?\n/);
  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const raw = stripComment(lines[lineNo]);
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('[[')) {
      throw new Error(`${lineNo + 1}번째 줄: 배열 테이블([[ ]])은 지원하지 않습니다.`);
    }

    if (line.startsWith('[')) {
      if (!line.endsWith(']')) {
        throw new Error(`${lineNo + 1}번째 줄: 테이블 헤더의 닫는 대괄호가 없습니다.`);
      }
      const path = line.slice(1, -1).trim();
      if (!path) throw new Error(`${lineNo + 1}번째 줄: 빈 테이블 이름입니다.`);
      current = resolveTable(root, splitDottedKey(path), lineNo + 1);
      continue;
    }

    const eq = findAssignmentEquals(line);
    if (eq === -1) {
      throw new Error(`${lineNo + 1}번째 줄: '키 = 값' 형식이 아닙니다.`);
    }
    const keyPart = line.slice(0, eq).trim();
    const valuePart = line.slice(eq + 1).trim();
    if (!keyPart) throw new Error(`${lineNo + 1}번째 줄: 키가 비어 있습니다.`);

    const keys = splitDottedKey(keyPart);
    const lastKey = keys[keys.length - 1];
    const target = keys.length > 1 ? resolveTable(current, keys.slice(0, -1), lineNo + 1) : current;
    target[lastKey] = parseTomlValue(valuePart, lineNo + 1);
  }

  return root;
}

/** 따옴표 밖의 첫 '#' 이후를 주석으로 제거. */
function stripComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '#' && !inSingle && !inDouble) return line.slice(0, i);
  }
  return line;
}

/** 따옴표·괄호 밖의 첫 '=' 위치를 찾는다(인라인 테이블 안의 '='는 무시). */
function findAssignmentEquals(line: string): number {
  let inSingle = false;
  let inDouble = false;
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (!inSingle && !inDouble) {
      if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') depth--;
      else if (ch === '=' && depth === 0) return i;
    }
  }
  return -1;
}

/** 점으로 구분된 키 경로를 분리(따옴표 내 점은 보존). */
function splitDottedKey(path: string): string[] {
  const keys: string[] = [];
  let buffer = '';
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < path.length; i++) {
    const ch = path[i];
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "'" && !inDouble) inSingle = !inSingle;
    if (ch === '.' && !inSingle && !inDouble) {
      keys.push(unquoteKey(buffer.trim()));
      buffer = '';
    } else {
      buffer += ch;
    }
  }
  keys.push(unquoteKey(buffer.trim()));
  if (keys.some((k) => k === '')) throw new Error('키 경로에 빈 구간이 있습니다.');
  return keys;
}

function unquoteKey(key: string): string {
  if (
    (key.startsWith('"') && key.endsWith('"') && key.length >= 2) ||
    (key.startsWith("'") && key.endsWith("'") && key.length >= 2)
  ) {
    return key.slice(1, -1);
  }
  return key;
}

/** 점 경로를 따라 중첩 테이블을 생성·반환. */
function resolveTable(
  base: Record<string, JsonValue>,
  keys: string[],
  lineNo: number,
): Record<string, JsonValue> {
  let node = base;
  for (const key of keys) {
    const existing = node[key];
    if (existing === undefined) {
      const created: Record<string, JsonValue> = {};
      node[key] = created;
      node = created;
    } else if (isPlainObject(existing)) {
      node = existing;
    } else {
      throw new Error(`${lineNo}번째 줄: '${key}' 키가 테이블이 아닌 값과 충돌합니다.`);
    }
  }
  return node;
}

function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTomlValue(raw: string, lineNo: number): JsonValue {
  const text = raw.trim();
  if (!text) throw new Error(`${lineNo}번째 줄: 값이 비어 있습니다.`);

  if (text.startsWith('"') || text.startsWith("'")) {
    return parseTomlString(text, lineNo);
  }
  if (text.startsWith('[')) {
    return parseTomlArray(text, lineNo);
  }
  if (text.startsWith('{')) {
    return parseTomlInlineTable(text, lineNo);
  }
  if (text === 'true') return true;
  if (text === 'false') return false;

  if (/^[+-]?(\d[\d_]*)(\.\d[\d_]*)?([eE][+-]?\d+)?$/.test(text)) {
    const num = Number(text.replace(/_/g, ''));
    if (Number.isNaN(num)) throw new Error(`${lineNo}번째 줄: 숫자 '${text}' 를 해석할 수 없습니다.`);
    return num;
  }

  throw new Error(
    `${lineNo}번째 줄: 값 '${text}' 를 해석할 수 없습니다(날짜·다중행 문자열은 미지원).`,
  );
}

function parseTomlString(text: string, lineNo: number): string {
  const quote = text[0];
  if (text.length < 2 || text[text.length - 1] !== quote) {
    throw new Error(`${lineNo}번째 줄: 문자열의 닫는 따옴표가 없습니다.`);
  }
  const body = text.slice(1, -1);
  // 리터럴 문자열('...')은 이스케이프 미적용.
  if (quote === "'") return body;
  return body.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_m, esc: string) => {
    switch (esc[0]) {
      case 'n':
        return '\n';
      case 't':
        return '\t';
      case 'r':
        return '\r';
      case '"':
        return '"';
      case '\\':
        return '\\';
      case 'b':
        return '\b';
      case 'f':
        return '\f';
      case 'u':
        return String.fromCharCode(parseInt(esc.slice(1), 16));
      default:
        return esc;
    }
  });
}

/** 인라인 배열·인라인 테이블 내부를 최상위 ','로 분리. */
function splitTopLevel(inner: string): string[] {
  const parts: string[] = [];
  let buffer = '';
  let inSingle = false;
  let inDouble = false;
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "'" && !inDouble) inSingle = !inSingle;
    if (!inSingle && !inDouble) {
      if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') depth--;
      if (ch === ',' && depth === 0) {
        parts.push(buffer);
        buffer = '';
        continue;
      }
    }
    buffer += ch;
  }
  if (buffer.trim() !== '') parts.push(buffer);
  return parts;
}

function parseTomlArray(text: string, lineNo: number): JsonValue[] {
  if (text[text.length - 1] !== ']') {
    throw new Error(`${lineNo}번째 줄: 배열의 닫는 대괄호가 없습니다.`);
  }
  const inner = text.slice(1, -1).trim();
  if (!inner) return [];
  return splitTopLevel(inner).map((item) => parseTomlValue(item.trim(), lineNo));
}

function parseTomlInlineTable(text: string, lineNo: number): { [key: string]: JsonValue } {
  if (text[text.length - 1] !== '}') {
    throw new Error(`${lineNo}번째 줄: 인라인 테이블의 닫는 중괄호가 없습니다.`);
  }
  const inner = text.slice(1, -1).trim();
  const table: { [key: string]: JsonValue } = {};
  if (!inner) return table;
  for (const pair of splitTopLevel(inner)) {
    const segment = pair.trim();
    const eq = findAssignmentEquals(segment);
    if (eq === -1) throw new Error(`${lineNo}번째 줄: 인라인 테이블 항목이 '키 = 값' 형식이 아닙니다.`);
    const keys = splitDottedKey(segment.slice(0, eq).trim());
    const lastKey = keys[keys.length - 1];
    const target = keys.length > 1 ? resolveTable(table, keys.slice(0, -1), lineNo) : table;
    target[lastKey] = parseTomlValue(segment.slice(eq + 1).trim(), lineNo);
  }
  return table;
}

/* ------------------------------------------------------------------ */
/* TOML 직렬화                                                         */
/* ------------------------------------------------------------------ */

function stringifyToml(value: JsonValue): string {
  if (!isPlainObject(value)) {
    throw new Error('최상위 JSON 값은 객체여야 TOML 로 변환할 수 있습니다.');
  }
  const lines: string[] = [];
  emitTable(value, [], lines);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function emitTable(table: { [key: string]: JsonValue }, path: string[], lines: string[]): void {
  const scalarKeys: string[] = [];
  const tableKeys: string[] = [];

  for (const key of Object.keys(table)) {
    if (isPlainObject(table[key])) tableKeys.push(key);
    else scalarKeys.push(key);
  }

  if (path.length > 0 && scalarKeys.length > 0) {
    lines.push(`[${path.map(formatTomlKey).join('.')}]`);
  }
  for (const key of scalarKeys) {
    lines.push(`${formatTomlKey(key)} = ${formatTomlValue(table[key])}`);
  }
  if (scalarKeys.length > 0) lines.push('');

  for (const key of tableKeys) {
    const nextPath = [...path, key];
    const child = table[key] as { [key: string]: JsonValue };
    // 자식이 스칼라를 안 가진 순수 중첩이면 헤더만 부모 경로로 묶인다.
    if (Object.keys(child).length === 0) {
      lines.push(`[${nextPath.map(formatTomlKey).join('.')}]`);
      lines.push('');
      continue;
    }
    emitTable(child, nextPath, lines);
  }
}

function formatTomlKey(key: string): string {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : `"${key.replace(/"/g, '\\"')}"`;
}

function formatTomlValue(value: JsonValue): string {
  if (value === null) {
    throw new Error('TOML 은 null 값을 표현할 수 없습니다.');
  }
  if (typeof value === 'string') return formatTomlString(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('TOML 은 NaN·Infinity 를 표현할 수 없습니다.');
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatTomlValue).join(', ')}]`;
  }
  // 인라인 테이블.
  const entries = Object.keys(value).map(
    (key) => `${formatTomlKey(key)} = ${formatTomlValue(value[key])}`,
  );
  return `{ ${entries.join(', ')} }`;
}

function formatTomlString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

/* ------------------------------------------------------------------ */

export default function TomlJsonPage() {
  const [dir, setDir] = useState<Direction>('toml-to-json');
  const [input, setInput] = useState(SAMPLE_TOML);
  const [output, setOutput] = useState('');
  const [prettyJson, setPrettyJson] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      if (dir === 'toml-to-json') {
        const parsed = parseToml(input);
        setOutput(JSON.stringify(parsed, null, prettyJson ? 2 : 0));
      } else {
        const parsed = JSON.parse(input) as JsonValue;
        setOutput(stringifyToml(parsed));
      }
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : '변환에 실패했습니다.');
    }
  }, [input, dir, prettyJson]);

  const swap = () => {
    setInput(output);
    setDir(dir === 'toml-to-json' ? 'json-to-toml' : 'toml-to-json');
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const ext = dir === 'toml-to-json' ? 'json' : 'toml';
    triggerDownload(new Blob([output], { type: 'text/plain;charset=utf-8' }), `converted.${ext}`);
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
            <FileCode2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">TOML ↔ JSON</h1>
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
            onClick={() => setDir('toml-to-json')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'toml-to-json'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            TOML → JSON
          </button>
          <button
            type="button"
            onClick={() => setDir('json-to-toml')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'json-to-toml'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            JSON → TOML
          </button>
        </div>

        {dir === 'toml-to-json' && (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={prettyJson}
              onChange={(e) => setPrettyJson(e.target.checked)}
            />
            JSON 정렬 (들여쓰기 2)
          </label>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">
              입력 ({dir === 'toml-to-json' ? 'TOML' : 'JSON'})
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false}
              aria-label="입력"
            />
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">출력</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={18}
              className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y"
              aria-label="결과"
            />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          자체 구현 파서 — 테이블·점 키·문자열·숫자·불리언·배열·인라인 테이블 지원. 배열 테이블([[ ]])·다중행
          문자열·날짜 타입은 미지원.
        </p>
      </main>
    </div>
  );
}
