'use client';

import { useMemo, useState } from 'react';
import { GitCompare } from 'lucide-react';

type DiffKind = 'added' | 'removed' | 'changed';

interface DiffEntry {
  /** 점/대괄호 표기 경로 (예: user.profile.name, items[0]) */
  path: string;
  kind: DiffKind;
  /** 좌측(원본) 값의 표시용 문자열 — added 인 경우 없음 */
  leftPreview?: string;
  /** 우측(비교) 값의 표시용 문자열 — removed 인 경우 없음 */
  rightPreview?: string;
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** JSON 값을 한 줄 미리보기 문자열로 직렬화한다(긴 경우 잘라냄). */
function previewValue(value: Json): string {
  let text: string;
  try {
    text = JSON.stringify(value);
  } catch {
    text = String(value);
  }
  if (text === undefined) return 'undefined';
  const MAX_LENGTH = 80;
  return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH)}…` : text;
}

/** 객체(배열 제외, null 제외) 여부 판정. */
function isPlainObject(value: Json): value is { [key: string]: Json } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 자식 경로를 부모 경로에 이어붙인다. 배열 인덱스는 대괄호 표기. */
function joinPath(parent: string, key: string, isIndex: boolean): string {
  if (isIndex) return `${parent}[${key}]`;
  return parent ? `${parent}.${key}` : key;
}

/**
 * 두 JSON 값을 재귀 비교해 차이 목록을 누적한다.
 * 동일 타입의 객체/배열은 키 단위로 내려가고, 그 외에는 값 동등성으로 판정한다.
 */
function collectDiff(left: Json, right: Json, path: string, out: DiffEntry[]): void {
  if (left === right) return;

  const bothObjects = isPlainObject(left) && isPlainObject(right);
  const bothArrays = Array.isArray(left) && Array.isArray(right);

  if (bothObjects) {
    const keys = new Set<string>([...Object.keys(left), ...Object.keys(right)]);
    // 안정적 출력을 위해 키를 정렬한다.
    for (const key of Array.from(keys).sort()) {
      const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
      const hasRight = Object.prototype.hasOwnProperty.call(right, key);
      const childPath = joinPath(path, key, false);
      if (hasLeft && !hasRight) {
        out.push({ path: childPath, kind: 'removed', leftPreview: previewValue(left[key]) });
      } else if (!hasLeft && hasRight) {
        out.push({ path: childPath, kind: 'added', rightPreview: previewValue(right[key]) });
      } else {
        collectDiff(left[key], right[key], childPath, out);
      }
    }
    return;
  }

  if (bothArrays) {
    const maxLength = Math.max(left.length, right.length);
    for (let index = 0; index < maxLength; index += 1) {
      const hasLeft = index < left.length;
      const hasRight = index < right.length;
      const childPath = joinPath(path, String(index), true);
      if (hasLeft && !hasRight) {
        out.push({ path: childPath, kind: 'removed', leftPreview: previewValue(left[index]) });
      } else if (!hasLeft && hasRight) {
        out.push({ path: childPath, kind: 'added', rightPreview: previewValue(right[index]) });
      } else {
        collectDiff(left[index], right[index], childPath, out);
      }
    }
    return;
  }

  // 타입이 다르거나 원시값이 다른 경우: 값 변경.
  out.push({
    path: path || '(루트)',
    kind: 'changed',
    leftPreview: previewValue(left),
    rightPreview: previewValue(right),
  });
}

interface ParseResult {
  value: Json | null;
  error: string | null;
}

/** 텍스트를 JSON 으로 파싱한다. 빈 입력과 오류를 한국어로 구분해 반환. */
function parseJson(text: string, label: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { value: null, error: `${label} JSON을 입력하세요.` };
  }
  try {
    return { value: JSON.parse(trimmed) as Json, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return { value: null, error: `${label} JSON 파싱 오류: ${message}` };
  }
}

const KIND_STYLE: Record<DiffKind, { label: string; row: string; badge: string }> = {
  added: {
    label: '추가됨',
    row: 'border-l-2 border-l-emerald-500 bg-emerald-500/5',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  removed: {
    label: '삭제됨',
    row: 'border-l-2 border-l-rose-500 bg-rose-500/5',
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
  changed: {
    label: '변경됨',
    row: 'border-l-2 border-l-amber-500 bg-amber-500/5',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
};

export default function JsonDiffPage() {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');

  const result = useMemo(() => {
    if (!leftText.trim() && !rightText.trim()) {
      return { diffs: [] as DiffEntry[], error: null as string | null, ready: false };
    }
    const left = parseJson(leftText, '왼쪽(원본)');
    if (left.error) return { diffs: [], error: left.error, ready: false };
    const right = parseJson(rightText, '오른쪽(비교)');
    if (right.error) return { diffs: [], error: right.error, ready: false };

    const diffs: DiffEntry[] = [];
    collectDiff(left.value as Json, right.value as Json, '', diffs);
    return { diffs, error: null, ready: true };
  }, [leftText, rightText]);

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <GitCompare className="h-5 w-5 text-primary" aria-hidden />
          JSON 비교(구조적 diff)
        </h1>
        <p className="text-sm text-muted-foreground">두 JSON을 구조적으로 비교해 추가·삭제·변경된 키를 표시합니다.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">왼쪽(원본)</span>
          <textarea
            className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder='{"name": "홍길동", "age": 30}'
            aria-label="왼쪽 원본 JSON"
            spellCheck={false}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">오른쪽(비교)</span>
          <textarea
            className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            placeholder='{"name": "홍길동", "age": 31}'
            aria-label="오른쪽 비교 JSON"
            spellCheck={false}
          />
        </label>
      </div>

      {result.error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {result.error}
        </p>
      )}

      {result.ready && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">결과</span>
            {result.diffs.length === 0 ? (
              <span className="text-muted-foreground">두 JSON이 동일합니다.</span>
            ) : (
              <span className="text-muted-foreground">{result.diffs.length}개의 차이</span>
            )}
          </div>

          {result.diffs.length > 0 && (
            <ul className="space-y-1.5">
              {result.diffs.map((diff) => {
                const style = KIND_STYLE[diff.kind];
                return (
                  <li key={`${diff.kind}:${diff.path}`} className={`rounded-md px-3 py-2 ${style.row}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${style.badge}`}>{style.label}</span>
                      <code className="font-mono text-sm break-all">{diff.path}</code>
                    </div>
                    {diff.kind === 'changed' && (
                      <div className="mt-1 space-y-0.5 font-mono text-xs">
                        <div className="text-rose-600 dark:text-rose-400 break-all">- {diff.leftPreview}</div>
                        <div className="text-emerald-600 dark:text-emerald-400 break-all">+ {diff.rightPreview}</div>
                      </div>
                    )}
                    {diff.kind === 'removed' && (
                      <div className="mt-1 font-mono text-xs text-rose-600 dark:text-rose-400 break-all">- {diff.leftPreview}</div>
                    )}
                    {diff.kind === 'added' && (
                      <div className="mt-1 font-mono text-xs text-emerald-600 dark:text-emerald-400 break-all">+ {diff.rightPreview}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
