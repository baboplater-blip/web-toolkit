'use client';

import { useMemo, useState } from 'react';
import { Regex } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 대상 텍스트 길이 상한(ReDoS·메모리 방어). */
const MAX_TEXT_LENGTH = 100_000;
/** 매치 개수 상한(무한 루프·메모리 방어). */
const MAX_MATCHES = 5_000;

interface MatchRow {
  index: number;
  full: string;
  /** 번호 캡처 그룹(1..n). 매칭 안 된 그룹은 undefined. */
  groups: (string | undefined)[];
  /** 명명 그룹. */
  named: Record<string, string | undefined>;
}

interface ExtractResult {
  rows: MatchRow[];
  /** 번호 그룹 개수(헤더 컬럼 수 결정용). */
  groupCount: number;
  /** 명명 그룹 키 목록(정렬). */
  namedKeys: string[];
  error: string | null;
  truncated: boolean;
}

const EMPTY_RESULT: ExtractResult = {
  rows: [],
  groupCount: 0,
  namedKeys: [],
  error: null,
  truncated: false,
};

function extract(pattern: string, flags: string, text: string): ExtractResult {
  if (!pattern || !text) return EMPTY_RESULT;

  if (text.length > MAX_TEXT_LENGTH) {
    return {
      ...EMPTY_RESULT,
      error: `대상 텍스트가 너무 깁니다(${text.length.toLocaleString()}자). ${MAX_TEXT_LENGTH.toLocaleString()}자 이하로 줄여 주세요.`,
    };
  }

  // 전 매치 추출을 위해 'g' 플래그는 항상 강제한다.
  const effectiveFlags = flags.includes('g') ? flags : `${flags}g`;

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, effectiveFlags);
  } catch (err) {
    return { ...EMPTY_RESULT, error: err instanceof Error ? err.message : '정규식이 올바르지 않습니다.' };
  }

  const rows: MatchRow[] = [];
  const namedKeySet = new Set<string>();
  let groupCount = 0;
  let truncated = false;

  try {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const [full, ...captures] = match;
      groupCount = Math.max(groupCount, captures.length);

      const named: Record<string, string | undefined> = {};
      if (match.groups) {
        for (const key of Object.keys(match.groups)) {
          named[key] = match.groups[key];
          namedKeySet.add(key);
        }
      }

      rows.push({ index: rows.length + 1, full, groups: captures, named });

      // 길이 0 매치는 lastIndex 가 전진하지 않아 무한 루프가 되므로 강제 전진.
      if (match.index === regex.lastIndex) {
        regex.lastIndex += 1;
      }

      if (rows.length >= MAX_MATCHES) {
        truncated = true;
        break;
      }
    }
  } catch (err) {
    return { ...EMPTY_RESULT, error: err instanceof Error ? err.message : '매치 중 오류가 발생했습니다.' };
  }

  return {
    rows,
    groupCount,
    namedKeys: [...namedKeySet],
    error: null,
    truncated,
  };
}

const FLAG_OPTIONS: readonly { flag: string; label: string }[] = [
  { flag: 'i', label: 'i (대소문자 무시)' },
  { flag: 'm', label: 'm (여러 줄)' },
  { flag: 's', label: 's (점이 줄바꿈 포함)' },
];

export default function RegexExtractPage() {
  const [pattern, setPattern] = useState('');
  const [text, setText] = useState('');
  const [flags, setFlags] = useState<Set<string>>(new Set());

  const flagString = useMemo(() => [...flags].join(''), [flags]);
  const result = useMemo(() => extract(pattern, flagString, text), [pattern, flagString, text]);

  const toggleFlag = (flag: string) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  };

  const handleReset = () => {
    setPattern('');
    setText('');
    setFlags(new Set());
  };

  const showTable = result.rows.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="정규식 그룹 추출" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Regex className="h-4 w-4 text-primary" aria-hidden />
          정규식의 전체 매치와 캡처·명명 그룹을 표로 추출합니다(<code>g</code> 플래그 자동 적용).
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">정규식 패턴</span>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="예: (?<year>\d{4})-(\d{2})-(\d{2})"
            className="font-mono"
            spellCheck={false}
            autoComplete="off"
            aria-label="정규식 패턴"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">플래그</span>
          <span className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs">/{flagString}g</span>
          {FLAG_OPTIONS.map(({ flag, label }) => (
            <label key={flag} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={flags.has(flag)}
                onChange={() => toggleFlag(flag)}
                className="h-4 w-4"
                aria-label={label}
              />
              <span className="font-mono">{flag}</span>
            </label>
          ))}
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">대상 텍스트</span>
          <textarea
            className="min-h-48 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="매치를 찾을 텍스트를 붙여넣으세요"
            spellCheck={false}
            aria-label="대상 텍스트"
          />
          <span className="text-xs text-muted-foreground">최대 {MAX_TEXT_LENGTH.toLocaleString()}자.</span>
        </label>

        {result.error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {result.error}
          </div>
        )}

        {!result.error && pattern && text && result.rows.length === 0 && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">매치가 없습니다.</div>
        )}

        {showTable && (
          <section className="space-y-2 rounded-xl border bg-card p-4">
            <p className="text-sm font-medium">
              매치 {result.rows.length.toLocaleString()}개
              {result.truncated && <span className="ml-2 text-xs text-muted-foreground">(상한 {MAX_MATCHES.toLocaleString()}개에서 잘림)</span>}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-1 pr-3 font-medium">#</th>
                    <th className="py-1 pr-3 font-medium">전체 매치</th>
                    {Array.from({ length: result.groupCount }, (_, i) => (
                      <th key={`g${i}`} className="py-1 pr-3 font-medium">
                        그룹 {i + 1}
                      </th>
                    ))}
                    {result.namedKeys.map((key) => (
                      <th key={`n-${key}`} className="py-1 pr-3 font-medium">
                        ?&lt;{key}&gt;
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.index} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3 text-muted-foreground">{row.index}</td>
                      <td className="py-2 pr-3 font-mono break-all">{row.full}</td>
                      {Array.from({ length: result.groupCount }, (_, i) => (
                        <td key={`g${i}`} className="py-2 pr-3 font-mono break-all">
                          {row.groups[i] ?? <span className="text-muted-foreground">∅</span>}
                        </td>
                      ))}
                      {result.namedKeys.map((key) => (
                        <td key={`n-${key}`} className="py-2 pr-3 font-mono break-all">
                          {row.named[key] ?? <span className="text-muted-foreground">∅</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
