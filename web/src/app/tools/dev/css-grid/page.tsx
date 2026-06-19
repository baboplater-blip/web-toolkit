'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const DEFAULT_COLUMNS = 3;
const DEFAULT_ROWS = 2;
const DEFAULT_GAP = 8;
const MIN_TRACKS = 1;
const MAX_TRACKS = 12;
const MAX_PREVIEW_CELLS = 144;

/** 사용자가 트랙 사이징을 비웠을 때 repeat(N, 1fr) 로 채운다. */
function resolveTemplate(sizing: string, count: number): string {
  const trimmed = sizing.trim();
  if (trimmed) return trimmed;
  return `repeat(${count}, 1fr)`;
}

export default function CssGridPage() {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [gap, setGap] = useState(DEFAULT_GAP);
  const [columnSizing, setColumnSizing] = useState('');
  const [rowSizing, setRowSizing] = useState('');
  const [copied, setCopied] = useState(false);

  const columnTemplate = useMemo(() => resolveTemplate(columnSizing, columns), [columnSizing, columns]);
  const rowTemplate = useMemo(() => resolveTemplate(rowSizing, rows), [rowSizing, rows]);

  const cssCode = useMemo(
    () =>
      [
        'display: grid;',
        `grid-template-columns: ${columnTemplate};`,
        `grid-template-rows: ${rowTemplate};`,
        `gap: ${gap}px;`,
      ].join('\n'),
    [columnTemplate, rowTemplate, gap],
  );

  // 미리보기 셀 수는 안전 상한으로 가둔다(트랙 입력은 1~12 로 클램프).
  const cellCount = Math.min(columns * rows, MAX_PREVIEW_CELLS);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setColumns(DEFAULT_COLUMNS);
    setRows(DEFAULT_ROWS);
    setGap(DEFAULT_GAP);
    setColumnSizing('');
    setRowSizing('');
    setCopied(false);
  };

  const clampTrack = (value: string) => Math.max(MIN_TRACKS, Math.min(MAX_TRACKS, Number(value) || MIN_TRACKS));
  const clampGap = (value: string) => Math.max(0, Math.min(200, Number(value) || 0));

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS Grid 생성기" widthClass="max-w-xl" onReset={handleReset} />
      <main className="mx-auto max-w-xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutGrid className="h-4 w-4 text-primary" aria-hidden />
          열·행·간격을 정해 grid 레이아웃 CSS를 만들고 바로 미리봅니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">열 개수</span>
              <Input
                type="number"
                min={MIN_TRACKS}
                max={MAX_TRACKS}
                value={columns}
                onChange={(e) => setColumns(clampTrack(e.target.value))}
                aria-label="열 개수"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">행 개수</span>
              <Input
                type="number"
                min={MIN_TRACKS}
                max={MAX_TRACKS}
                value={rows}
                onChange={(e) => setRows(clampTrack(e.target.value))}
                aria-label="행 개수"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">간격(px)</span>
              <Input
                type="number"
                min={0}
                max={200}
                value={gap}
                onChange={(e) => setGap(clampGap(e.target.value))}
                aria-label="간격(px)"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">열 사이징(선택)</span>
              <Input
                value={columnSizing}
                onChange={(e) => setColumnSizing(e.target.value)}
                placeholder="예: 1fr 2fr 또는 repeat(3, 1fr)"
                className="font-mono text-xs"
                spellCheck={false}
                autoComplete="off"
                aria-label="열 사이징"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">행 사이징(선택)</span>
              <Input
                value={rowSizing}
                onChange={(e) => setRowSizing(e.target.value)}
                placeholder="예: auto 1fr 또는 repeat(2, 80px)"
                className="font-mono text-xs"
                spellCheck={false}
                autoComplete="off"
                aria-label="행 사이징"
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            사이징을 비우면 입력한 개수만큼 <code className="font-mono">1fr</code> 로 채웁니다.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <span className="mb-2 block text-sm font-medium">미리보기</span>
          <div
            className="rounded-lg border bg-muted/40 p-3"
            style={{
              display: 'grid',
              gridTemplateColumns: columnTemplate,
              gridTemplateRows: rowTemplate,
              gap: `${gap}px`,
            }}
          >
            {Array.from({ length: cellCount }, (_, i) => (
              <div
                key={i}
                className="flex min-h-10 items-center justify-center rounded-md bg-primary/15 text-xs font-medium text-primary"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">CSS 코드</span>
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-muted px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all">
            {cssCode}
          </pre>
        </div>
      </main>
    </div>
  );
}
