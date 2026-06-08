'use client';

import { useState } from 'react';
import { ArrowLeft, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { openPdfDoc, extractPageLines } from '@/lib/tools/pdf-text';

interface Preview {
  fileName: string;
  pages: string[][][]; // [page][row][cell]
  rowCount: number;
}

/** 라인 텍스트를 2칸 이상 공백 기준으로 셀 분리. */
function splitRow(line: string): string[] {
  return line.split(/\s{2,}/).map((c) => c.trim());
}

export default function PdfToExcelPage() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const pdf = await openPdfDoc(file);
      const pages: string[][][] = [];
      let rowCount = 0;
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const lines = await extractPageLines(page);
        const rows = lines
          .map((l) => splitRow(l.text))
          .filter((r) => r.some((c) => c !== ''));
        pages.push(rows);
        rowCount += rows.length;
      }
      // 스캔본 등 텍스트가 전혀 없는 PDF 는 가짜 성공 대신 안내한다.
      if (rowCount === 0) {
        setError('표로 인식할 텍스트가 없습니다(스캔본일 수 있음). OCR 도구를 먼저 사용하세요.');
        return;
      }
      setPreview({ fileName: file.name.replace(/\.pdf$/i, ''), pages, rowCount });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF를 읽을 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function exportXlsx() {
    if (!preview) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    preview.pages.forEach((rows, i) => {
      const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [['(빈 페이지)']]);
      XLSX.utils.book_append_sheet(wb, ws, `Page ${i + 1}`.slice(0, 31));
    });
    const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    downloadBlob(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${preview.fileName}.xlsx`);
  }

  async function exportCsv() {
    if (!preview) return;
    const XLSX = await import('xlsx');
    const allRows = preview.pages.flat();
    const ws = XLSX.utils.aoa_to_sheet(allRows.length ? allRows : [['(빈 표)']]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `${preview.fileName}.csv`);
  }

  function downloadBlob(blob: Blob, name: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const firstRows = preview?.pages[0]?.slice(0, 8) ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <FileSpreadsheet className="h-5 w-5" />
          <h1 className="font-semibold text-base">PDF 표 → Excel</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <FileDropZone accept="application/pdf" maxBytes={100 * 1024 * 1024} onFiles={onFiles} onError={(m) => setError(m)} />
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> 표를 인식하는 중…
          </p>
        )}
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

        {preview && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm">
                  <strong>{preview.pages.length}</strong>페이지 · 약{' '}
                  <strong>{preview.rowCount}</strong>행 인식
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={exportXlsx} className={buttonVariants({ className: 'gap-1.5', size: 'sm' })}>
                    <Download className="h-4 w-4" />
                    .xlsx
                  </button>
                  <button type="button" onClick={exportCsv} className={buttonVariants({ variant: 'outline', className: 'gap-1.5', size: 'sm' })}>
                    <Download className="h-4 w-4" />
                    .csv
                  </button>
                </div>
              </div>

              {firstRows.length > 0 && (
                <div className="overflow-x-auto rounded border">
                  <table className="text-[12px] w-full">
                    <tbody>
                      {firstRows.map((row, ri) => (
                        <tr key={ri} className="border-b last:border-0">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1 border-r last:border-0 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">첫 페이지 미리보기 (최대 8행)</p>
            </div>
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            PDF 안 텍스트의 위치(열 간격)를 분석해 행·열을 추정하고 xlsx·csv 로 추출합니다.
            보고서·명세서·거래내역 등 <strong>텍스트 기반 PDF</strong>에서 잘 동작하며, 스캔
            이미지(텍스트가 없는) PDF는 인식되지 않습니다. 열 경계가 모호하면 결과를 엑셀에서
            다듬어 사용하세요. 모든 처리는 브라우저 안에서 이뤄지며 파일은 전송되지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
