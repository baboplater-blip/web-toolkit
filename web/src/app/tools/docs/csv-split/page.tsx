'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerDownload, stripExtension } from '@/lib/tools/file-utils';

/** 메모리 보호: 파일 전체를 텍스트로 읽으므로 과대 파일은 사전 거부. */
const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const DEFAULT_CHUNK_ROWS = 1000;
const MIN_CHUNK_ROWS = 1;
const MAX_CHUNK_ROWS = 1_000_000;

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** CSV 파일을 헤더 + 데이터 행으로 파싱한다(header 없이 2차원 배열). */
async function parseCsv(file: File): Promise<ParsedCsv> {
  const Papa = (await import('papaparse')).default;
  const text = await file.text();
  return new Promise<ParsedCsv>((resolve, reject) => {
    Papa.parse<string[]>(text, {
      skipEmptyLines: true,
      complete: (result) => {
        const all = result.data;
        if (all.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }
        const [headers, ...rows] = all;
        resolve({ headers, rows });
      },
      error: (err: Error) => reject(err),
    });
  });
}

/** 행 수와 청크 크기로 분할될 파일 개수를 계산. */
function chunkCount(rowCount: number, chunkRows: number): number {
  if (rowCount <= 0 || chunkRows <= 0) return 0;
  return Math.ceil(rowCount / chunkRows);
}

export default function CsvSplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [chunkRows, setChunkRows] = useState(DEFAULT_CHUNK_ROWS);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 다운로드용 zip blob 을 보관하고 교체·언마운트 시 revoke.
  const [done, setDone] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const baseNameRef = useRef<string>('split');

  // 파싱된 행 수 미리보기(분할 개수 표시용).
  const [rowCount, setRowCount] = useState<number | null>(null);

  const clearResult = useCallback(() => {
    blobRef.current = null;
    setDone(false);
  }, []);

  useEffect(() => clearResult, [clearResult]);

  function reset() {
    clearResult();
    setFile(null);
    setChunkRows(DEFAULT_CHUNK_ROWS);
    setProgress(0);
    setProcessing(false);
    setError(null);
    setRowCount(null);
  }

  async function handleFiles(picked: File[]) {
    setError(null);
    clearResult();
    setRowCount(null);
    const next = picked[0];
    if (!next) return;
    setFile(next);
    baseNameRef.current = stripExtension(next.name) || 'split';
    // 분할 개수 미리보기를 위해 행 수만 파싱한다.
    try {
      const { rows } = await parseCsv(next);
      setRowCount(rows.length);
    } catch (e) {
      console.error('CSV preview parse failed:', e);
      setError(e instanceof Error ? e.message : 'CSV 파일을 읽을 수 없습니다.');
      setFile(null);
    }
  }

  async function handleProcess() {
    if (!file) {
      setError('CSV 파일을 먼저 선택해주세요.');
      return;
    }
    if (chunkRows < MIN_CHUNK_ROWS) {
      setError(`청크 행 수는 ${MIN_CHUNK_ROWS} 이상이어야 합니다.`);
      return;
    }
    setError(null);
    clearResult();
    setProcessing(true);
    setProgress(0);
    try {
      const Papa = (await import('papaparse')).default;
      const JSZip = (await import('jszip')).default;

      const { headers, rows } = await parseCsv(file);
      if (rows.length === 0) {
        setError('분할할 데이터 행이 없습니다.');
        return;
      }

      const total = chunkCount(rows.length, chunkRows);
      const zip = new JSZip();

      for (let part = 0; part < total; part += 1) {
        const start = part * chunkRows;
        const slice = rows.slice(start, start + chunkRows);
        // 각 청크는 헤더를 유지한다.
        const csv = Papa.unparse([headers, ...slice]);
        zip.file(`part-${part + 1}.csv`, csv);
        setProgress(Math.round(((part + 1) / total) * 90));
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      blobRef.current = blob;
      setProgress(100);
      setDone(true);
    } catch (e) {
      console.error('CSV split failed:', e);
      setError(e instanceof Error ? e.message : 'CSV 분할에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    const blob = blobRef.current;
    if (!blob) return;
    triggerDownload(blob, `${baseNameRef.current}-split.zip`);
  }

  const previewParts =
    rowCount != null ? chunkCount(rowCount, chunkRows) : null;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSV 분할" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <FileDropZone
          accept=".csv,text/csv"
          maxBytes={MAX_BYTES}
          onFiles={handleFiles}
          onError={setError}
          description="CSV 파일(.csv, 최대 25MB)을 선택하세요"
        />

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="chunk-rows" className="text-sm">
            조각당 행 수
          </label>
          <Input
            id="chunk-rows"
            type="number"
            min={MIN_CHUNK_ROWS}
            max={MAX_CHUNK_ROWS}
            value={chunkRows}
            onChange={(e) => {
              const value = Number(e.target.value);
              setChunkRows(Number.isFinite(value) ? value : DEFAULT_CHUNK_ROWS);
              clearResult();
            }}
            className="w-32"
          />
          {previewParts != null && (
            <span className="text-xs text-muted-foreground">
              {rowCount}행 → {previewParts}개 파일로 분할
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleProcess} disabled={processing || !file}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            분할 시작
          </Button>
          {processing && (
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {done && <Button onClick={download}>ZIP 다운로드</Button>}
      </main>
    </div>
  );
}
