'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';

/** 메모리 보호: 파일 전체를 텍스트로 읽으므로 과대 파일은 사전 거부. */
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

type CsvRecord = Record<string, string>;

interface ParsedFile {
  headers: string[];
  records: CsvRecord[];
}

/** 한 CSV 파일을 header:true 로 파싱해 헤더 순서와 레코드를 얻는다. */
async function parseCsvFile(file: File): Promise<ParsedFile> {
  const Papa = (await import('papaparse')).default;
  const text = await file.text();
  return new Promise<ParsedFile>((resolve, reject) => {
    Papa.parse<CsvRecord>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        resolve({ headers: result.meta.fields ?? [], records: result.data });
      },
      error: (err: Error) => reject(err),
    });
  });
}

export default function CsvMergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // 병합 결과 CSV 텍스트를 보관했다가 다운로드 버튼에서 내보낸다.
  const resultCsvRef = useRef<string | null>(null);

  const clearResult = useCallback(() => {
    resultCsvRef.current = null;
    setDone(false);
  }, []);

  useEffect(() => clearResult, [clearResult]);

  function reset() {
    clearResult();
    setFiles([]);
    setProgress(0);
    setProcessing(false);
    setError(null);
  }

  function addFiles(picked: File[]) {
    setError(null);
    clearResult();
    // 같은 이름의 파일 중복 추가를 막는다.
    setFiles((current) => {
      const existing = new Set(current.map((f) => f.name));
      const merged = [...current];
      for (const file of picked) {
        if (!existing.has(file.name)) merged.push(file);
      }
      return merged;
    });
  }

  function removeFile(name: string) {
    clearResult();
    setFiles((current) => current.filter((f) => f.name !== name));
  }

  async function handleProcess() {
    if (files.length === 0) {
      setError('CSV 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    clearResult();
    setProcessing(true);
    setProgress(0);
    try {
      const Papa = (await import('papaparse')).default;

      // 1) 모든 파일 파싱 + 헤더 합집합(첫 등장 순서 유지) 계산
      const unionHeaders: string[] = [];
      const seenHeaders = new Set<string>();
      const allRecords: CsvRecord[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const parsed = await parseCsvFile(files[i]);
        for (const header of parsed.headers) {
          if (header !== '' && !seenHeaders.has(header)) {
            seenHeaders.add(header);
            unionHeaders.push(header);
          }
        }
        allRecords.push(...parsed.records);
        setProgress(Math.round(((i + 1) / files.length) * 90));
      }

      if (unionHeaders.length === 0) {
        setError('헤더를 가진 CSV 내용을 찾지 못했습니다.');
        return;
      }

      // 2) 합집합 헤더 기준으로 각 레코드를 정렬, 없는 칸은 빈 문자열
      const normalized = allRecords.map((record) => {
        const row: CsvRecord = {};
        for (const header of unionHeaders) {
          row[header] = record[header] ?? '';
        }
        return row;
      });

      // 3) CSV 직렬화
      const csv = Papa.unparse({ fields: unionHeaders, data: normalized });
      setProgress(100);
      resultCsvRef.current = csv;
      setDone(true);
    } catch (e) {
      console.error('CSV merge failed:', e);
      setError(e instanceof Error ? e.message : 'CSV 병합에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    const csv = resultCsvRef.current;
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, 'merged.csv');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSV 병합" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <FileDropZone
          accept=".csv,text/csv"
          multiple
          maxBytes={MAX_BYTES}
          onFiles={addFiles}
          onError={setError}
          description="CSV 파일 여러 개(.csv, 파일당 최대 25MB)를 선택하세요"
        />

        {files.length > 0 && (
          <ul className="space-y-1 rounded-xl border p-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1 truncate">
                  {file.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.name)}
                  aria-label={`${file.name} 제거`}
                  disabled={processing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={handleProcess} disabled={processing || files.length === 0}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            병합 시작
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

        {done && (
          <Button onClick={download}>결과 다운로드 (merged.csv)</Button>
        )}
      </main>
    </div>
  );
}
