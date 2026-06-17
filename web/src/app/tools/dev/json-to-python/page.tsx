'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type OutputFormat = 'dataclass' | 'typeddict';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface ClassDef {
  name: string;
  fields: Array<{ name: string; type: string }>;
}

/** 식별자를 PascalCase 클래스명으로 정규화. */
function toClassName(raw: string): string {
  const tokens = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const name = tokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join('');
  return /^[A-Za-z]/.test(name) ? name : `Class${name}`;
}

/** 두 타입을 병합해 Optional/혼합 타입을 처리. */
function unifyTypes(left: string, right: string): string {
  if (left === right) return left;
  if (left === 'Any' || right === 'Any') return 'Any';
  const leftIsNone = left === 'None';
  const rightIsNone = right === 'None';
  if (leftIsNone) return wrapOptional(right);
  if (rightIsNone) return wrapOptional(left);
  return 'Any';
}

function wrapOptional(type: string): string {
  if (type === 'Any' || type.startsWith('Optional[')) return type;
  return `Optional[${type}]`;
}

/**
 * JSON 값에서 Python 타입을 추론하고, 중첩 객체는 별도 클래스로 등록한다.
 * @param value 추론 대상 값
 * @param suggestedName 객체일 때 사용할 클래스명 후보
 * @param classes 누적되는 클래스 정의 목록(부수 효과로 추가)
 * @param seenNames 클래스명 중복 방지 집합
 */
function inferType(
  value: JsonValue,
  suggestedName: string,
  classes: ClassDef[],
  seenNames: Set<string>,
): string {
  if (value === null) return 'None';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (typeof value === 'string') return 'str';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'list[Any]';
    const elementType = value
      .map((item) => inferType(item, suggestedName, classes, seenNames))
      .reduce((acc, type) => unifyTypes(acc, type));
    return `list[${elementType}]`;
  }

  // 객체 → 전용 클래스 생성.
  let className = toClassName(suggestedName);
  let suffix = 2;
  while (seenNames.has(className)) {
    className = `${toClassName(suggestedName)}${suffix}`;
    suffix += 1;
  }
  seenNames.add(className);

  const fields = Object.entries(value).map(([key, fieldValue]) => ({
    name: key,
    type: inferType(fieldValue, key, classes, seenNames),
  }));
  classes.push({ name: className, fields });
  return className;
}

function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

function renderDataclass(def: ClassDef): string {
  const lines = ['@dataclass', `class ${def.name}:`];
  if (def.fields.length === 0) {
    lines.push('    pass');
    return lines.join('\n');
  }
  for (const field of def.fields) {
    const fieldName = isValidIdentifier(field.name) ? field.name : `# 잘못된 식별자: ${field.name}`;
    lines.push(`    ${fieldName}: ${field.type}`);
  }
  return lines.join('\n');
}

function renderTypedDict(def: ClassDef): string {
  const allValid = def.fields.every((field) => isValidIdentifier(field.name));
  if (def.fields.length > 0 && allValid) {
    const lines = [`class ${def.name}(TypedDict):`];
    for (const field of def.fields) {
      lines.push(`    ${field.name}: ${field.type}`);
    }
    return lines.join('\n');
  }
  // 잘못된 식별자가 있으면 함수형 문법으로 대체.
  if (def.fields.length === 0) return `${def.name} = TypedDict('${def.name}', {})`;
  const entries = def.fields.map((field) => `    '${field.name}': ${field.type},`).join('\n');
  return `${def.name} = TypedDict('${def.name}', {\n${entries}\n})`;
}

/** import 문에서 실제로 사용된 타입만 수집. */
function buildImports(code: string, format: OutputFormat): string {
  const imports: string[] = [];
  const typingNames: string[] = [];
  if (/\bOptional\[/.test(code)) typingNames.push('Optional');
  if (/\bAny\b/.test(code)) typingNames.push('Any');
  if (format === 'typeddict') typingNames.push('TypedDict');
  if (typingNames.length > 0) imports.push(`from typing import ${typingNames.join(', ')}`);
  if (format === 'dataclass') imports.unshift('from dataclasses import dataclass');
  return imports.join('\n');
}

function generate(jsonText: string, rootName: string, format: OutputFormat): string {
  const parsed = JSON.parse(jsonText) as JsonValue;
  const classes: ClassDef[] = [];
  const seenNames = new Set<string>();
  const rootType = inferType(parsed, rootName || 'Root', classes, seenNames);

  if (classes.length === 0) {
    // 루트가 객체가 아닌 경우.
    return `# 루트 값 타입: ${rootType}`;
  }

  // 의존 클래스가 먼저 오도록 역순(중첩이 나중에 push 되므로) 렌더.
  const render = format === 'dataclass' ? renderDataclass : renderTypedDict;
  const body = classes
    .slice()
    .reverse()
    .map(render)
    .join('\n\n\n');
  const imports = buildImports(body, format);
  return imports ? `${imports}\n\n\n${body}` : body;
}

export default function JsonToPythonPage() {
  const [input, setInput] = useState('');
  const [rootName, setRootName] = useState('Root');
  const [format, setFormat] = useState<OutputFormat>('dataclass');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null };
    try {
      return { output: generate(input, rootName.trim() || 'Root', format), error: null };
    } catch (e) {
      const message = e instanceof SyntaxError ? `JSON 파싱 오류: ${e.message}` : 'JSON 을 변환할 수 없습니다.';
      return { output: '', error: message };
    }
  }, [input, rootName, format]);

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed', e);
    }
  }

  function reset() {
    setInput('');
    setRootName('Root');
    setFormat('dataclass');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON → Python" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">JSON 을 Python dataclass 또는 TypedDict 코드로 변환합니다.</p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1.5">
            <Button size="sm" variant={format === 'dataclass' ? 'default' : 'outline'} onClick={() => setFormat('dataclass')}>
              dataclass
            </Button>
            <Button size="sm" variant={format === 'typeddict' ? 'default' : 'outline'} onClick={() => setFormat('typeddict')}>
              TypedDict
            </Button>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">루트 클래스 이름</span>
            <Input value={rootName} onChange={(e) => setRootName(e.target.value)} placeholder="Root" className="w-40 font-mono" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"id": 1, "name": "Ada"}'
            aria-label="JSON 입력"
            spellCheck={false}
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="Python 코드"
            aria-label="Python 코드"
            spellCheck={false}
          />
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button onClick={copy} disabled={!output}>
          {copied ? '복사됨' : '복사'}
        </Button>
      </main>
    </div>
  );
}
