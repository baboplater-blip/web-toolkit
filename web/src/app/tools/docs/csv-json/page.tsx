'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, Check, Copy, Download, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';

type Direction = 'csv-to-json' | 'json-to-csv';

const SAMPLE_CSV = `name,age,city
Alice,30,Seoul
Bob,25,Busan
Charlie,35,Incheon`;

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
            dynamicTyping: true,
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
          const csv = Papa.unparse(parsed, { delimiter });
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
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
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
              spellCheck={false}
            />
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
              className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y"
            />
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
