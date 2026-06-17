'use client';

import { useMemo, useState } from 'react';
import { ListTree } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';

type Mode = 'flatten' | 'unflatten';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** 점 표기 평탄 객체 — 값은 임의의 JSON 원시/구조값. */
type FlatObject = Record<string, JsonValue>;

/** 평탄화 결과가 점 표기 키를 만들기에 부적합한지 (원시값·null 단독 등). */
function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 중첩 객체·배열을 "a.b.0.c" 형태의 점 표기 키를 가진 평탄 객체로 펼친다.
 * 빈 객체/빈 배열은 키를 만들 하위가 없으므로 그 자체를 값으로 보존한다.
 */
function flatten(value: JsonValue, prefix: string, target: FlatObject): void {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      target[prefix] = [];
      return;
    }
    value.forEach((item, index) => {
      const key = prefix ? `${prefix}.${index}` : String(index);
      flatten(item, key, target);
    });
    return;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      target[prefix] = {};
      return;
    }
    for (const key of keys) {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      flatten(value[key], nextKey, target);
    }
    return;
  }
  // 원시값(문자열·숫자·불리언·null)
  target[prefix] = value;
}

/** 점 표기 키 세그먼트가 배열 인덱스(정수 문자열)인지 판별. */
function isArrayIndex(segment: string): boolean {
  return /^\d+$/.test(segment);
}

/**
 * 점 표기 키를 가진 평탄 객체를 중첩 구조로 복원한다.
 * 다음 세그먼트가 정수면 배열, 아니면 객체로 컨테이너를 만든다.
 */
function unflatten(flat: FlatObject): JsonValue {
  const root: { [key: string]: JsonValue } = {};
  for (const flatKey of Object.keys(flat)) {
    const segments = flatKey.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cursor: any = root;
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      const isLast = i === segments.length - 1;
      if (isLast) {
        cursor[segment] = flat[flatKey];
        continue;
      }
      const nextSegment = segments[i + 1];
      const container = isArrayIndex(nextSegment) ? [] : {};
      if (cursor[segment] === undefined) {
        cursor[segment] = container;
      }
      cursor = cursor[segment];
    }
  }
  return root;
}

interface ConvertResult {
  output: string;
  error: string | null;
}

function convert(input: string, mode: Mode): ConvertResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: '', error: null };

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(trimmed) as JsonValue;
  } catch (e) {
    const detail = e instanceof Error ? e.message : '알 수 없는 오류';
    return { output: '', error: `JSON 구문 오류: ${detail}` };
  }

  if (mode === 'flatten') {
    if (!isPlainObject(parsed) && !Array.isArray(parsed)) {
      return {
        output: '',
        error: '평탄화하려면 객체 또는 배열 형태의 JSON 이어야 합니다.',
      };
    }
    const flat: FlatObject = {};
    flatten(parsed, '', flat);
    return { output: JSON.stringify(flat, null, 2), error: null };
  }

  // unflatten: 입력은 점 표기 키의 평탄 객체여야 한다.
  if (!isPlainObject(parsed)) {
    return {
      output: '',
      error: '복원하려면 점 표기 키를 가진 평탄한 객체여야 합니다.',
    };
  }
  const restored = unflatten(parsed as FlatObject);
  return { output: JSON.stringify(restored, null, 2), error: null };
}

export default function JsonFlattenPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('flatten');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => convert(input, mode), [input, mode]);

  function reset() {
    setInput('');
    setMode('flatten');
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed:', e);
    }
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json;charset=utf-8' });
    triggerDownload(blob, mode === 'flatten' ? 'flattened.json' : 'unflattened.json');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON 평탄화" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <ListTree className="h-5 w-5 text-primary" aria-hidden />
            JSON 평탄화
          </h1>
          <p className="text-sm text-muted-foreground">
            중첩 JSON 을 점 표기 키로 펼치거나(평탄화) 다시 중첩 구조로 되돌립니다(복원).
          </p>
        </header>

        <div
          className="inline-flex rounded-lg border p-1"
          role="radiogroup"
          aria-label="변환 모드"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'flatten'}
            onClick={() => setMode('flatten')}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === 'flatten'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            평탄화
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'unflatten'}
            onClick={() => setMode('unflatten')}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === 'unflatten'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            복원
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'flatten'
                ? '중첩 JSON 을 붙여넣으세요\n예: {"a": {"b": [1, 2]}}'
                : '점 표기 키의 평탄 JSON 을 붙여넣으세요\n예: {"a.b.0": 1, "a.b.1": 2}'
            }
            aria-label="입력"
            spellCheck={false}
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="결과"
            aria-label="결과"
            spellCheck={false}
          />
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
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!output}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
