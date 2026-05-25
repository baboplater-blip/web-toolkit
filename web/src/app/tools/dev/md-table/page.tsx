'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Minus,
  Plus,
  Table as TableIcon,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Align = 'left' | 'center' | 'right';

interface State {
  headers: string[];
  aligns: Align[];
  rows: string[][];
}

function emptyState(cols: number, rows: number): State {
  return {
    headers: Array.from({ length: cols }, (_, i) => `열${i + 1}`),
    aligns: Array.from({ length: cols }, () => 'left' as Align),
    rows: Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')),
  };
}

function escapePipe(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function maxWidth(values: string[]): number {
  let m = 1;
  for (const v of values) {
    const len = [...v].length;
    if (len > m) m = len;
  }
  return m;
}

function buildMarkdown(state: State): string {
  const cols = state.headers.length;
  if (cols === 0) return '';
  const colWidths: number[] = [];
  for (let c = 0; c < cols; c++) {
    const colVals = [state.headers[c], ...state.rows.map((r) => r[c] ?? '')];
    colWidths[c] = Math.max(3, maxWidth(colVals));
  }
  const pad = (s: string, w: number, align: Align): string => {
    const escaped = escapePipe(s);
    const len = [...escaped].length;
    if (len >= w) return escaped;
    const pad = w - len;
    if (align === 'center') {
      const left = Math.floor(pad / 2);
      const right = pad - left;
      return ' '.repeat(left) + escaped + ' '.repeat(right);
    }
    if (align === 'right') return ' '.repeat(pad) + escaped;
    return escaped + ' '.repeat(pad);
  };
  const sep = (w: number, align: Align): string => {
    if (align === 'center') return ':' + '-'.repeat(Math.max(1, w - 2)) + ':';
    if (align === 'right') return '-'.repeat(Math.max(1, w - 1)) + ':';
    return ':' + '-'.repeat(Math.max(1, w - 1));
  };
  const headerRow =
    '| ' +
    state.headers.map((h, i) => pad(h, colWidths[i], state.aligns[i])).join(' | ') +
    ' |';
  const sepRow =
    '| ' +
    state.aligns.map((a, i) => sep(colWidths[i], a)).join(' | ') +
    ' |';
  const dataRows = state.rows.map(
    (r) =>
      '| ' +
      r.map((cell, i) => pad(cell ?? '', colWidths[i], state.aligns[i])).join(' | ') +
      ' |',
  );
  return [headerRow, sepRow, ...dataRows].join('\n');
}

function parseTsv(text: string): State | null {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  const sep = lines[0].includes('\t') ? '\t' : ',';
  const rows = lines.map((l) => l.split(sep).map((c) => c.trim()));
  const cols = Math.max(...rows.map((r) => r.length));
  const headers = (rows[0] ?? []).concat(
    Array.from({ length: cols - (rows[0]?.length ?? 0) }, () => ''),
  );
  const aligns: Align[] = headers.map(() => 'left');
  const data = rows.slice(1).map((r) => {
    const padded = [...r];
    while (padded.length < cols) padded.push('');
    return padded;
  });
  return { headers, aligns, rows: data.length > 0 ? data : [Array(cols).fill('')] };
}

export default function MdTablePage() {
  const [state, setState] = useState<State>(() => emptyState(3, 2));
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => buildMarkdown(state), [state]);

  const setHeader = useCallback((col: number, value: string) => {
    setState((s) => {
      const headers = [...s.headers];
      headers[col] = value;
      return { ...s, headers };
    });
  }, []);

  const setAlign = useCallback((col: number, align: Align) => {
    setState((s) => {
      const aligns = [...s.aligns];
      aligns[col] = align;
      return { ...s, aligns };
    });
  }, []);

  const setCell = useCallback((row: number, col: number, value: string) => {
    setState((s) => {
      const rows = s.rows.map((r) => [...r]);
      rows[row][col] = value;
      return { ...s, rows };
    });
  }, []);

  const addRow = () => {
    setState((s) => ({
      ...s,
      rows: [...s.rows, Array(s.headers.length).fill('')],
    }));
  };
  const addColumn = () => {
    setState((s) => ({
      headers: [...s.headers, `열${s.headers.length + 1}`],
      aligns: [...s.aligns, 'left'],
      rows: s.rows.map((r) => [...r, '']),
    }));
  };
  const removeRow = (idx: number) => {
    setState((s) => ({ ...s, rows: s.rows.filter((_, i) => i !== idx) }));
  };
  const removeColumn = (idx: number) => {
    setState((s) => ({
      headers: s.headers.filter((_, i) => i !== idx),
      aligns: s.aligns.filter((_, i) => i !== idx),
      rows: s.rows.map((r) => r.filter((_, i) => i !== idx)),
    }));
  };

  const importTsv = () => {
    const parsed = parseTsv(importText);
    if (parsed) {
      setState(parsed);
      setImportText('');
    }
  };

  const copyMd = async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'h-8 w-8',
              })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <TableIcon className="h-5 w-5" />
            <h1 className="font-semibold text-base">마크다운 표 생성기</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            편집
          </h2>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {state.headers.map((h, i) => (
                    <th key={i} className="p-1 align-top min-w-[100px]">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => setHeader(i, e.target.value)}
                        className="w-full rounded border bg-background px-2 py-1 text-xs font-semibold"
                        aria-label={`헤더 ${i + 1}`}
                      />
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <select
                          value={state.aligns[i]}
                          onChange={(e) => setAlign(i, e.target.value as Align)}
                          className="h-7 text-[10px] rounded border bg-background px-1"
                          aria-label={`열 ${i + 1} 정렬`}
                        >
                          <option value="left">⇐ 왼쪽</option>
                          <option value="center">⇔ 가운데</option>
                          <option value="right">⇒ 오른쪽</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeColumn(i)}
                          disabled={state.headers.length <= 1}
                          aria-label={`열 ${i + 1} 삭제`}
                          title="열 삭제"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  ))}
                  <th className="p-1 align-top w-8" />
                </tr>
              </thead>
              <tbody>
                {state.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c} className="p-1">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => setCell(r, c, e.target.value)}
                          className="w-full rounded border bg-background px-2 py-1 text-xs"
                          aria-label={`${r + 1}행 ${c + 1}열`}
                        />
                      </td>
                    ))}
                    <td className="p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeRow(r)}
                        disabled={state.rows.length <= 1}
                        aria-label={`행 ${r + 1} 삭제`}
                        title="행 삭제"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              행 추가
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={addColumn}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />열 추가
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            CSV·TSV 일괄 가져오기
          </h2>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
            placeholder={'붙여넣기 (CSV 또는 TSV)\n예:\n이름,나이,직업\n홍길동,25,개발자'}
            className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y"
            spellCheck={false}
            aria-label="CSV·TSV 가져오기"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={importTsv}
            disabled={!importText.trim()}
          >
            가져오기
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과 (Markdown)
            </h2>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyMd}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  복사
                </>
              )}
            </Button>
          </div>
          <Separator />
          <textarea
            readOnly
            value={markdown}
            rows={Math.max(6, state.rows.length + 4)}
            className="w-full rounded-lg border bg-muted px-3 py-2 text-xs font-mono resize-y"
            aria-label="Markdown 결과"
          />
        </div>

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            GitHub·GitLab·Notion·Obsidian 등 대부분의 마크다운 환경에서 호환됩니다.
            셀 안의 줄바꿈은 <code className="font-mono">&lt;br&gt;</code>, 파이프
            문자는 <code className="font-mono">\|</code> 로 자동 이스케이프합니다.
          </p>
        </div>
      </main>
    </div>
  );
}
