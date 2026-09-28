'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Check, Copy, Download, Table } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

type Direction = 'csv-to-json' | 'json-to-csv';

const SAMPLE_CSV = `name,age,city
Alice,30,Seoul
Bob,25,Busan
Charlie,35,Incheon`;

/** CSV 셀 문자열 → JSON 값 추론. 숫자·불리언·빈 값(null)을 변환하되 선행 0 값은 문자열로 둔다. */
function inferCell(value: string): unknown {
  const v = value.trim();
  if (v === '') return null;
  if (v === 'true' || v === 'TRUE' || v === 'True') return true;
  if (v === 'false' || v === 'FALSE' || v === 'False') return false;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(v)) {
    const n = Number(v);
    if (Number.isFinite(n) && Math.abs(n) <= Number.MAX_SAFE_INTEGER) return n;
  }
  return value;
}

export default function CsvJsonPage() {
  const [dir, setDir] = useState<Direction>('csv-to-json');
  const [input, setInput] = useState(SAMPLE_CSV);
  const [output, setOutput] = useState('');
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
  const [header, setHeader] = useState(true);
  const [prettyJson, setPrettyJson] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      if (!input.trim()) {
        setOutput('');
        setRowCount(0);
        return;
      }
      try {
        const Papa = (await import('papaparse')).default;
        if (dir === 'csv-to-json') {
          const result = Papa.parse(input, {
            header,
            delimiter,
            skipEmptyLines: true,
            // Papa 의 dynamicTyping 은 "007"·"01012345678" 같은 선행 0 값을 숫자로 바꿔 0 을 잃는다.
            // 직접 타입을 추론해 선행 0 값은 문자열로 보존한다.
            transform: inferCell,
          });
          if (result.errors.length > 0) {
            if (!cancelled) setError(result.errors.map((e) => e.message).join('\n'));
          }
          if (!cancelled) {
            setOutput(JSON.stringify(result.data, null, prettyJson ? 2 : 0));
            setRowCount(Array.isArray(result.data) ? result.data.length : 0);
          }
        } else {
          const parsed = JSON.parse(input);
          if (!Array.isArray(parsed)) {
            if (!cancelled) setError('배열 형태의 JSON 이 필요합니다.');
            return;
          }
          // 행마다 키가 다를 수 있으므로 모든 행의 키 합집합을 열로 쓴다(첫 행 키만 쓰면 열 누락).
          // 중첩 객체·배열은 JSON 문자열로 넣어 "[object Object]" 가 되지 않게 한다.
          const isRecord = (v: unknown): v is Record<string, unknown> =>
            typeof v === 'object' && v !== null && !Array.isArray(v);
          let csv: string;
          if (parsed.every(isRecord)) {
            const fields: string[] = [];
            const seen = new Set<string>();
            for (const row of parsed) {
              for (const key of Object.keys(row)) {
                if (!seen.has(key)) {
                  seen.add(key);
                  fields.push(key);
                }
              }
            }
            const data = parsed.map((row) =>
              fields.map((key) => {
                const v = row[key];
                if (v === undefined || v === null) return '';
                return typeof v === 'object' ? JSON.stringify(v) : v;
              }),
            );
            csv = Papa.unparse({ fields, data }, { delimiter });
          } else {
            csv = Papa.unparse(parsed, { delimiter });
          }
          if (!cancelled) {
            setOutput(csv);
            setRowCount(parsed.length);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '변환 실패');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [input, dir, delimiter, header, prettyJson]);

  const swap = () => {
    setInput(output);
    setDir(dir === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const ext = dir === 'csv-to-json' ? 'json' : 'csv';
    const mime = dir === 'csv-to-json' ? 'application/json' : 'text/csv';
    triggerDownload(new Blob([output], { type: mime }), `converted.${ext}`);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Table className="h-5 w-5" />
            <h1 className="font-semibold text-base">CSV ↔ JSON</h1>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={swap}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            방향 전환
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDir('csv-to-json')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'csv-to-json'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            CSV → JSON
          </button>
          <button
            type="button"
            onClick={() => setDir('json-to-csv')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'json-to-csv'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            JSON → CSV
          </button>
        </div>

        <div className="rounded-xl border bg-card p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">구분자</span>
            {(
              [
                [',', ','],
                [';', ';'],
                ['\t', 'TAB'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setDelimiter(v)}
                className={`h-7 px-3 text-[11px] rounded-md border ${
                  delimiter === v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {dir === 'csv-to-json' && (
            <>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={header}
                  onChange={(e) => setHeader(e.target.checked)}
                />
                첫 줄을 헤더로
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={prettyJson}
                  onChange={(e) => setPrettyJson(e.target.checked)}
                />
                JSON 정렬
              </label>
            </>
          )}
          {rowCount > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              레코드 {rowCount}개
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">
              입력 ({dir === 'csv-to-json' ? 'CSV' : 'JSON 배열'})
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false} aria-label="입력" />
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">출력</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={18}
              className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y" aria-label="결과" />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          PapaParse (MIT) · 대용량 CSV 파싱 지원
        </p>
      </main>
    </div>
  );
}
