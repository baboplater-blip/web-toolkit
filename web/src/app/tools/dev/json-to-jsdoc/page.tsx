'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, FileCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

interface GenerateResult {
  output: string;
  error: string | null;
}

/** 유효한 JS 식별자만 점 표기로 쓰고, 나머지는 따옴표 키로 감싼다. */
const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function sanitizeTypedefName(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_$]/g, '');
  if (!cleaned) return 'Root';
  // 숫자로 시작하면 접두사를 붙인다.
  return /^[0-9]/.test(cleaned) ? `T${cleaned}` : cleaned;
}

/** PascalCase 변환(중첩 객체의 typedef 이름 생성용). */
function toPascalCase(key: string): string {
  const parts = key.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length === 0) return 'Object';
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

/**
 * JSON 값을 JSDoc 타입 문자열로 변환한다.
 * 중첩 객체는 별도 @typedef 로 분리하고(typedefs 에 push), 배열은 `요소타입[]` 로 표기한다.
 *
 * @param value 변환할 값
 * @param suggestedName 객체일 때 사용할 typedef 이름 후보
 * @param typedefs 누적되는 typedef 블록 배열(부수효과)
 * @param usedNames 이미 사용한 typedef 이름 집합(충돌 회피)
 * @returns 해당 값의 JSDoc 타입 표현
 */
function valueToType(
  value: JsonValue,
  suggestedName: string,
  typedefs: string[],
  usedNames: Set<string>,
): string {
  if (value === null) return '*';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'Array<*>';
    // 요소 타입은 첫 요소를 대표로 추론한다(혼합 배열은 단순화).
    const elementType = valueToType(value[0], suggestedName, typedefs, usedNames);
    // 유니온/객체 타입은 괄호로 감싸 `[]` 우선순위 모호성을 피한다.
    return /[|&]/.test(elementType) ? `(${elementType})[]` : `${elementType}[]`;
  }

  switch (typeof value) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'object':
      return objectToTypedef(value as Record<string, JsonValue>, suggestedName, typedefs, usedNames);
    default:
      return '*';
  }
}

/** 객체를 @typedef 블록으로 만들고 그 이름을 반환한다. */
function objectToTypedef(
  obj: Record<string, JsonValue>,
  suggestedName: string,
  typedefs: string[],
  usedNames: Set<string>,
): string {
  let name = sanitizeTypedefName(suggestedName);
  // 이름 충돌 시 숫자 접미사.
  if (usedNames.has(name)) {
    let suffix = 2;
    while (usedNames.has(`${name}${suffix}`)) suffix += 1;
    name = `${name}${suffix}`;
  }
  usedNames.add(name);

  const lines: string[] = [`/**`, ` * @typedef {Object} ${name}`];
  for (const [key, child] of Object.entries(obj)) {
    const childName = toPascalCase(key);
    const childType = valueToType(child, childName, typedefs, usedNames);
    const propName = IDENTIFIER_RE.test(key) ? key : `'${key.replace(/'/g, "\\'")}'`;
    lines.push(` * @property {${childType}} ${propName}`);
  }
  lines.push(` */`);

  typedefs.push(lines.join('\n'));
  return name;
}

function generate(jsonText: string, rootName: string): GenerateResult {
  const trimmed = jsonText.trim();
  if (!trimmed) return { output: '', error: null };

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(trimmed) as JsonValue;
  } catch (err) {
    return { output: '', error: err instanceof Error ? `JSON 파싱 오류: ${err.message}` : 'JSON을 파싱할 수 없습니다.' };
  }

  const safeRoot = sanitizeTypedefName(rootName || 'Root');
  const typedefs: string[] = [];
  const usedNames = new Set<string>();

  if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    objectToTypedef(parsed as Record<string, JsonValue>, safeRoot, typedefs, usedNames);
    // 루트가 마지막에 push 되므로, 정의 순서를 자연스럽게(루트 먼저) 보이도록 뒤집는다.
    return { output: typedefs.reverse().join('\n\n') + '\n', error: null };
  }

  // 루트가 객체가 아니면(배열·원시값) 단일 @typedef 별칭으로 표현.
  const aliasType = valueToType(parsed, safeRoot, typedefs, usedNames);
  const aliasBlock = [`/**`, ` * @typedef {${aliasType}} ${safeRoot}`, ` */`].join('\n');
  const all = [...typedefs.reverse(), aliasBlock];
  return { output: all.join('\n\n') + '\n', error: null };
}

export default function JsonToJsdocPage() {
  const [input, setInput] = useState('');
  const [rootName, setRootName] = useState('Root');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => generate(input, rootName), [input, rootName]);

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setInput('');
    setRootName('Root');
    setCopied(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON to JSDoc 타입" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCode className="h-4 w-4 text-primary" aria-hidden />
          JSON 샘플에서 <code>@typedef</code> JSDoc 타입을 생성합니다. 중첩 객체는 별도 typedef로 분리됩니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">루트 타입 이름</span>
          <Input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder="예: User"
            className="w-48 font-mono"
            spellCheck={false}
            autoComplete="off"
            aria-label="루트 타입 이름"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">JSON 입력</span>
            <textarea
              className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'{\n  "id": 1,\n  "name": "Ada",\n  "profile": { "age": 36 }\n}'}
              spellCheck={false}
              aria-label="JSON 입력"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">JSDoc 결과</span>
            <textarea
              className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
              value={output}
              readOnly
              placeholder="결과"
              aria-label="JSDoc 결과"
            />
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
      </main>
    </div>
  );
}
