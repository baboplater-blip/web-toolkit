'use client';

import { useMemo, useState } from 'react';
import { Braces, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  [key: string]: unknown;
}

/** 원시값의 JSON Schema 타입 문자열을 반환한다. */
function primitiveType(value: number | boolean | string): string {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'string';
  return Number.isInteger(value) ? 'integer' : 'number';
}

/** 두 스키마가 구조적으로 동일한지(배열 item 병합 판단용) 비교한다. */
function sameSchema(a: JsonSchema, b: JsonSchema): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** 배열 원소 스키마들을 병합한다. 모두 같으면 단일, 다르면 anyOf 로 묶는다. */
function mergeItemSchemas(schemas: JsonSchema[]): JsonSchema {
  if (schemas.length === 0) return {};
  const unique: JsonSchema[] = [];
  for (const schema of schemas) {
    if (!unique.some((existing) => sameSchema(existing, schema))) unique.push(schema);
  }
  return unique.length === 1 ? unique[0] : { anyOf: unique };
}

/** 임의의 JSON 값에서 draft-07 스키마를 추론한다. 객체 모든 키를 required 로 본다. */
function inferSchema(value: JsonValue): JsonSchema {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    const itemSchemas = value.map((item) => inferSchema(item));
    return { type: 'array', items: mergeItemSchemas(itemSchemas) };
  }
  if (typeof value === 'object') {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const key of Object.keys(value)) {
      properties[key] = inferSchema(value[key]);
      required.push(key);
    }
    const schema: JsonSchema = { type: 'object', properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }
  return { type: primitiveType(value) };
}

interface InferOutput {
  schema: string;
  error: null;
}
interface InferError {
  schema: null;
  error: string;
}

function buildSchema(input: string): InferOutput | InferError {
  const trimmed = input.trim();
  if (trimmed === '') return { schema: null, error: '' };

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(trimmed) as JsonValue;
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { schema: null, error: `JSON 파싱 실패: ${message}` };
  }

  const root: JsonSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...inferSchema(parsed),
  };
  return { schema: JSON.stringify(root, null, 2), error: null };
}

export default function JsonSchemaPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => buildSchema(input), [input]);
  const output = result.schema ?? '';

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setInput('');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON 스키마 생성기" onReset={input ? reset : undefined} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Braces className="h-4 w-4 text-primary" aria-hidden />
          JSON 예시에서 JSON Schema(draft-07)를 추론·생성합니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{ "name": "홍길동", "age": 30, "tags": ["a", "b"] }'
            aria-label="JSON 입력"
            spellCheck={false}
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="추론된 JSON Schema"
            aria-label="JSON Schema 결과"
          />
        </div>

        {result.error && (
          <p className="text-xs text-destructive">{result.error}</p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} disabled={!output}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" size="sm" onClick={download} disabled={!output}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
