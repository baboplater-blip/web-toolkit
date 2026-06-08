'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

type Direction = 'xlsx-to-csv' | 'xlsx-to-json' | 'csv-to-xlsx' | 'json-to-xlsx';

interface SheetMeta {
  name: string;
  rows: number;
  cols: number;
}

export default function XlsxConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [direction, setDirection] = useState<Direction>('xlsx-to-csv');
  const [sheets, setSheets] = useState<SheetMeta[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  useEffect(() => {
    if (!file) {
      setSheets([]);
      setSelectedSheet('');
      return;
    }
    const isXlsx = /\.(xlsx|xls|ods)$/i.test(file.name);
    if (!isXlsx) {
      setSheets([]);
      return;
    }
    (async () => {
      try {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const meta: SheetMeta[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const ref = ws['!ref'] ?? 'A1';
          const range = XLSX.utils.decode_range(ref);
          return { name, rows: range.e.r - range.s.r + 1, cols: range.e.c - range.s.c + 1 };
        });
        setSheets(meta);
        setSelectedSheet(meta[0]?.name ?? '');
      } catch {
        setSheets([]);
      }
    })();
  }, [file]);

  async function handleProcess() {
    if (!file) {
      setError('파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const XLSX = await import('xlsx');
      let blob: Blob;
      let filename: string;
      const baseName = file.name.replace(/\.[^.]+$/i, '');

      if (direction === 'xlsx-to-csv' || direction === 'xlsx-to-json') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheetName = selectedSheet || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) throw new Error('시트를 찾을 수 없습니다.');

        if (direction === 'xlsx-to-csv') {
          const csv = XLSX.utils.sheet_to_csv(ws);
          blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          filename = `${baseName}-${sheetName}.csv`;
        } else {
          const json = XLSX.utils.sheet_to_json(ws, { defval: null });
          const out = JSON.stringify(json, null, 2);
          blob = new Blob([out], { type: 'application/json;charset=utf-8' });
          filename = `${baseName}-${sheetName}.json`;
        }
      } else if (direction === 'csv-to-xlsx') {
        const text = await file.text();
        const wb = XLSX.read(text, { type: 'string', raw: false });
        const xlsxBytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        blob = new Blob([new Uint8Array(xlsxBytes)], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        filename = `${baseName}.xlsx`;
      } else {
        // json-to-xlsx
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('JSON 은 객체 배열이어야 합니다. 예: [{...}, {...}]');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        const xlsxBytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        blob = new Blob([new Uint8Array(xlsxBytes)], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        filename = `${baseName}.xlsx`;
      }

      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  const fileAccept =
    direction === 'csv-to-xlsx'
      ? '.csv,text/csv'
      : direction === 'json-to-xlsx'
        ? '.json,application/json'
        : '.xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="XLSX ↔ CSV ↔ JSON" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Excel · CSV · JSON 사이를 자유롭게 변환합니다.
        </p>

      </header>

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <p className="text-xs font-medium">변환 방향</p>
        <div className="flex flex-wrap gap-2">
          <Button variant={direction === 'xlsx-to-csv' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('xlsx-to-csv')}>XLSX → CSV</Button>
          <Button variant={direction === 'xlsx-to-json' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('xlsx-to-json')}>XLSX → JSON</Button>
          <Button variant={direction === 'csv-to-xlsx' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('csv-to-xlsx')}>CSV → XLSX</Button>
          <Button variant={direction === 'json-to-xlsx' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('json-to-xlsx')}>JSON → XLSX</Button>
        </div>
      </div>

      <FileDropZone
        accept={fileAccept}
        onFiles={(files) => setFile(files[0] ?? null)}
        title="파일을 끌어다 놓거나 클릭"
      />

      {sheets.length > 1 && direction.startsWith('xlsx-') && (
        <div className="space-y-1">
          <label className="text-xs font-medium">시트 선택</label>
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {sheets.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.rows.toLocaleString()}행 × {s.cols}열)
              </option>
            ))}
          </select>
        </div>
      )}

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        변환
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <ResultCard
          fileName={result.filename}
          originalSize={result.originalSize}
          compressedSize={result.compressedSize}
          blobUrl={result.blobUrl}
        />
      )}
    </main>
    </div>
  );
}
