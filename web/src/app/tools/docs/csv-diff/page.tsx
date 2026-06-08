'use client';

import { useMemo, useState } from 'react';
import { Loader2, Diff } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';

interface DiffRow {
  type: 'add' | 'remove' | 'change' | 'eq';
  a?: string[];
  b?: string[];
  changedCols?: Set<number>;
}

const INITIAL_VISIBLE = 100;
const LOAD_MORE_STEP = 200;

export default function CsvDiffPage() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [keyCol, setKeyCol] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<DiffRow[] | null>(null);
  const [headersA, setHeadersA] = useState<string[]>([]);
  const [headersB, setHeadersB] = useState<string[]>([]);
  const [showEq, setShowEq] = useState(false);
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  async function handleProcess() {
    if (!a || !b) {
      setError('두 CSV 파일을 모두 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setDiff(null);
    setDupWarning(null);
    setVisible(INITIAL_VISIBLE);
    try {
      const Papa = (await import('papaparse')).default;
      // worker: true 로 큰 파일 파싱을 별도 스레드에서 처리해 UI 블로킹을 막는다.
      const [resA, resB] = await Promise.all([
        new Promise<string[][]>((res, rej) =>
          Papa.parse<string[]>(a, { worker: true, complete: (r) => res(r.data), error: rej }),
        ),
        new Promise<string[][]>((res, rej) =>
          Papa.parse<string[]>(b, { worker: true, complete: (r) => res(r.data), error: rej }),
        ),
      ]);
      const hA = resA[0] ?? [];
      const hB = resB[0] ?? [];
      setHeadersA(hA);
      setHeadersB(hB);

      const dataA = resA.slice(1).filter((r) => r.length > 0 && r.some((c) => c !== ''));
      const dataB = resB.slice(1).filter((r) => r.length > 0 && r.some((c) => c !== ''));
      const mapA = new Map<string, string[]>();
      const mapB = new Map<string, string[]>();
      // 중복 키는 마지막 행만 남으므로(조용한 손실) 발견 시 경고를 표시한다.
      let dupA = 0;
      let dupB = 0;
      for (const row of dataA) {
        const key = row[keyCol] ?? '';
        if (mapA.has(key)) dupA += 1;
        mapA.set(key, row);
      }
      for (const row of dataB) {
        const key = row[keyCol] ?? '';
        if (mapB.has(key)) dupB += 1;
        mapB.set(key, row);
      }
      if (dupA > 0 || dupB > 0) {
        const parts: string[] = [];
        if (dupA > 0) parts.push(`A에 ${dupA}개`);
        if (dupB > 0) parts.push(`B에 ${dupB}개`);
        setDupWarning(
          `중복된 키가 발견되었습니다 (${parts.join(', ')}). 같은 키는 마지막 행만 비교에 사용됩니다.`,
        );
      }

      const out: DiffRow[] = [];
      const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);
      const sortedKeys = Array.from(allKeys).sort();
      for (const k of sortedKeys) {
        const ra = mapA.get(k);
        const rb = mapB.get(k);
        if (ra && !rb) out.push({ type: 'remove', a: ra });
        else if (!ra && rb) out.push({ type: 'add', b: rb });
        else if (ra && rb) {
          const changed = new Set<number>();
          const maxLen = Math.max(ra.length, rb.length);
          for (let i = 0; i < maxLen; i++) {
            if ((ra[i] ?? '') !== (rb[i] ?? '')) changed.add(i);
          }
          if (changed.size === 0) out.push({ type: 'eq', a: ra, b: rb });
          else out.push({ type: 'change', a: ra, b: rb, changedCols: changed });
        }
      }
      setDiff(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : '비교에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  const stats = useMemo(() => {
    if (!diff) return null;
    return {
      add: diff.filter((d) => d.type === 'add').length,
      remove: diff.filter((d) => d.type === 'remove').length,
      change: diff.filter((d) => d.type === 'change').length,
      eq: diff.filter((d) => d.type === 'eq').length,
    };
  }, [diff]);

  const displayDiff = useMemo(() => {
    if (!diff) return null;
    return showEq ? diff : diff.filter((d) => d.type !== 'eq');
  }, [diff, showEq]);

  // 전수 렌더 시 대용량에서 멈추므로 보이는 행만 잘라서 렌더(csv-viewer 패턴).
  const visibleDiff = displayDiff ? displayDiff.slice(0, visible) : null;

  const headers = headersA.length >= headersB.length ? headersA : headersB;

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Diff className="h-5 w-5" />
          <h1 className="text-xl font-semibold">CSV 비교</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          두 CSV 를 키 컬럼 기준으로 행 단위 비교합니다. 추가·삭제·변경 셀을 색으로 표시.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold">기준 CSV (A)</p>
          <FileDropZone accept=".csv,text/csv" onFiles={(files) => setA(files[0] ?? null)} title="A" />
          {a && <p className="text-xs text-muted-foreground truncate">{a.name}</p>}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">비교 CSV (B)</p>
          <FileDropZone accept=".csv,text/csv" onFiles={(files) => setB(files[0] ?? null)} title="B" />
          {b && <p className="text-xs text-muted-foreground truncate">{b.name}</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 flex items-center gap-2">
        <label className="text-xs">키 컬럼 인덱스 (0부터)</label>
        <input
          type="number"
          min={0}
          value={keyCol}
          onChange={(e) => setKeyCol(Math.max(0, Number(e.target.value)))}
          className="w-20 rounded-md border bg-background px-2 py-1 text-sm" aria-label="키 컬럼 인덱스 (0부터)" />
      </div>

      <Button onClick={handleProcess} disabled={busy || !a || !b}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        비교
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {dupWarning && (
        <div role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          {dupWarning}
        </div>
      )}

      {stats && (
        <div className="flex flex-wrap gap-2 text-xs items-center">
          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1">+{stats.add}</span>
          <span className="rounded-full bg-destructive/10 text-destructive px-2 py-1">−{stats.remove}</span>
          <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1">변경 {stats.change}</span>
          <span className="rounded-full bg-muted text-muted-foreground px-2 py-1">동일 {stats.eq}</span>
          <label className="ml-2 flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={showEq}
              onChange={(e) => {
                setShowEq(e.target.checked);
                setVisible(INITIAL_VISIBLE);
              }}
            />
            동일 행도 보기
          </label>
        </div>
      )}

      {displayDiff && visibleDiff && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-2 py-1 text-left w-16">상태</th>
                  {headers.map((h, i) => (
                    <th key={i} className="px-2 py-1 text-left">{h || `col${i}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleDiff.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      row.type === 'add' ? 'bg-emerald-500/5' : row.type === 'remove' ? 'bg-destructive/5' : row.type === 'change' ? 'bg-amber-500/5' : ''
                    }
                  >
                    <td className="px-2 py-1 align-top">
                      {row.type === 'add' ? <span className="text-emerald-600">+</span> : row.type === 'remove' ? <span className="text-destructive">−</span> : row.type === 'change' ? <span className="text-amber-600">~</span> : '='}
                    </td>
                    {headers.map((_, ci) => {
                      const aCell = row.a?.[ci] ?? '';
                      const bCell = row.b?.[ci] ?? '';
                      if (row.type === 'change') {
                        const changed = row.changedCols?.has(ci);
                        if (changed) {
                          return (
                            <td key={ci} className="px-2 py-1 align-top max-w-[18rem] break-words">
                              <span className="text-destructive line-through">{aCell}</span>
                              {' → '}
                              <span className="text-emerald-600">{bCell}</span>
                            </td>
                          );
                        }
                        return <td key={ci} className="px-2 py-1 align-top max-w-[18rem] truncate text-muted-foreground">{aCell || bCell}</td>;
                      }
                      return <td key={ci} className="px-2 py-1 align-top max-w-[18rem] truncate">{aCell || bCell}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visible < displayDiff.length && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + LOAD_MORE_STEP)}
                className="h-9 rounded-md border bg-background px-4 text-xs hover:bg-muted"
              >
                더보기 ({displayDiff.length - visible}행 남음)
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
