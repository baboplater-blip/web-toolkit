'use client';

import { useMemo, useState } from 'react';
import { Tags } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build: string[];
}

/** SemVer 2.0.0 정규식 — major.minor.patch[-prerelease][+build]. */
const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** 입력 문자열을 파싱한다. 유효하지 않으면 null. 선행 v 접두사는 허용한다. */
function parseVersion(raw: string): ParsedVersion | null {
  const trimmed = raw.trim().replace(/^v/i, '');
  if (trimmed === '') return null;
  const match = SEMVER_RE.exec(trimmed);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
    build: match[5] ? match[5].split('.') : [],
  };
}

const NUMERIC_RE = /^(0|[1-9]\d*)$/;

/** 단일 prerelease 식별자 비교: 숫자 < 영숫자, 숫자끼리는 수치, 영숫자끼리는 사전식. */
function comparePrereleaseIdentifier(a: string, b: string): number {
  const aNumeric = NUMERIC_RE.test(a);
  const bNumeric = NUMERIC_RE.test(b);
  if (aNumeric && bNumeric) return Number(a) - Number(b);
  if (aNumeric) return -1; // 숫자 식별자가 영숫자 식별자보다 낮다
  if (bNumeric) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** SemVer 우선순위 비교. 음수=a<b, 0=동등, 양수=a>b. build 메타데이터는 무시한다. */
function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  // prerelease 가 있는 버전은 없는 버전보다 낮다
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;

  const len = Math.min(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < len; i += 1) {
    const diff = comparePrereleaseIdentifier(a.prerelease[i], b.prerelease[i]);
    if (diff !== 0) return diff;
  }
  // 앞부분이 모두 같으면 식별자가 더 많은 쪽이 높다
  return a.prerelease.length - b.prerelease.length;
}

function VersionCard({ label, raw, parsed }: { label: string; raw: string; parsed: ParsedVersion | null }) {
  const isEmpty = raw.trim() === '';
  return (
    <div className="space-y-1.5 rounded-xl border bg-card p-4">
      <p className="text-sm font-semibold">{label}</p>
      {isEmpty ? (
        <p className="text-xs text-muted-foreground">버전을 입력하세요.</p>
      ) : parsed ? (
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">major</dt>
            <dd className="font-mono tabular-nums">{parsed.major}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">minor</dt>
            <dd className="font-mono tabular-nums">{parsed.minor}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">patch</dt>
            <dd className="font-mono tabular-nums">{parsed.patch}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">prerelease</dt>
            <dd className="font-mono">{parsed.prerelease.length ? parsed.prerelease.join('.') : '—'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">build</dt>
            <dd className="font-mono">{parsed.build.length ? parsed.build.join('.') : '—'}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-xs font-medium text-destructive">유효하지 않은 SemVer 형식입니다.</p>
      )}
    </div>
  );
}

export default function SemverCheckerPage() {
  const [rawA, setRawA] = useState('');
  const [rawB, setRawB] = useState('');

  const parsedA = useMemo(() => parseVersion(rawA), [rawA]);
  const parsedB = useMemo(() => parseVersion(rawB), [rawB]);

  const verdict = useMemo(() => {
    if (!parsedA || !parsedB) return null;
    const cmp = compareVersions(parsedA, parsedB);
    if (cmp < 0) return { symbol: 'A < B', text: 'A 가 B 보다 낮은 버전입니다.' };
    if (cmp > 0) return { symbol: 'A > B', text: 'A 가 B 보다 높은 버전입니다.' };
    return { symbol: 'A = B', text: '두 버전은 동등합니다 (빌드 메타데이터 제외).' };
  }, [parsedA, parsedB]);

  function reset() {
    setRawA('');
    setRawB('');
  }

  const hasInput = rawA.trim() !== '' || rawB.trim() !== '';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="Semver 버전 비교" onReset={hasInput ? reset : undefined} />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Tags className="h-4 w-4 text-primary" aria-hidden />
          두 시맨틱 버전을 파싱하고 SemVer 우선순위 규칙으로 비교합니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">버전 A</span>
            <Input
              value={rawA}
              onChange={(event) => setRawA(event.target.value)}
              placeholder="예: 1.2.0-rc.1+build.5"
              aria-label="버전 A"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">버전 B</span>
            <Input
              value={rawB}
              onChange={(event) => setRawB(event.target.value)}
              placeholder="예: 1.2.0"
              aria-label="버전 B"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <VersionCard label="버전 A" raw={rawA} parsed={parsedA} />
          <VersionCard label="버전 B" raw={rawB} parsed={parsedB} />
        </div>

        {verdict && (
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="font-mono text-2xl font-bold">{verdict.symbol}</p>
            <p className="mt-1 text-sm text-muted-foreground">{verdict.text}</p>
          </div>
        )}
      </main>
    </div>
  );
}
