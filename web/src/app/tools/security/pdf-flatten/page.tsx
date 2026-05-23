'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  isPdfFile,
  loadPdfFromFile,
  saveAsBlob,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

interface FlattenStats {
  formFields: number;
  annotations: number;
}

export default function PdfFlattenPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [stats, setStats] = useState<FlattenStats | null>(null);
  const [flattenForm, setFlattenForm] = useState(true);
  const [removeAnnots, setRemoveAnnots] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    originalSize: number;
    outputSize: number;
  } | null>(null);

  const acceptFile = async (f: File) => {
    if (!isPdfFile(f)) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResult(null);
    try {
      const doc = await loadPdfFromFile(f);
      setFile(f);
      setPageCount(doc.getPageCount());

      const form = doc.getForm();
      const formFields = form.getFields().length;
      let annotations = 0;
      for (const page of doc.getPages()) {
        const node = page.node;
        const annots = node.Annots();
        if (annots) annotations += annots.size();
      }
      setStats({ formFields, annotations });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 로드 실패');
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setStats(null);
    setResult(null);
    setError(null);
  };

  const runFlatten = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const doc = await loadPdfFromFile(file);

      if (flattenForm) {
        const form = doc.getForm();
        if (form.getFields().length > 0) {
          form.flatten();
        }
      }

      if (removeAnnots) {
        const { PDFName } = await import('pdf-lib');
        for (const page of doc.getPages()) {
          page.node.delete(PDFName.of('Annots'));
        }
      }

      const blob = await saveAsBlob(doc);
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        fileName: `${baseName}-flattened.pdf`,
        originalSize: file.size,
        outputSize: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 처리 실패');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Layers className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF Flatten (양식·주석 고정)</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-3">
        {!file && (
          <FileDropZone
            accept="application/pdf"
            description="양식·주석을 정적인 페이지 내용으로 고정합니다"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && stats && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {pageCount}페이지
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">양식 필드</p>
                <p className="text-base font-semibold mt-0.5">{stats.formFields}개</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">주석/링크</p>
                <p className="text-base font-semibold mt-0.5">{stats.annotations}개</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label
                className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer ${
                  flattenForm
                    ? 'bg-primary/5 border-primary/40'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={flattenForm}
                  onChange={(e) => setFlattenForm(e.target.checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-xs font-medium">양식 필드 평탄화</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    체크박스·텍스트 입력·드롭다운 등 채워진 값을 이미지처럼 고정. 더 이상 수정
                    불가.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer ${
                  removeAnnots
                    ? 'bg-primary/5 border-primary/40'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={removeAnnots}
                  onChange={(e) => setRemoveAnnots(e.target.checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-xs font-medium">주석·링크 제거</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    하이라이트·메모·외부 링크 등을 제거. 시각적인 페이지 내용은 그대로.
                  </p>
                </div>
              </label>
            </div>

            <Button
              onClick={runFlatten}
              disabled={processing || (!flattenForm && !removeAnnots)}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Flatten 적용
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              완료
            </h2>
            <p className="text-xs text-muted-foreground text-center">
              원본 {formatBytes(result.originalSize)} → 처리 후 {formatBytes(result.outputSize)}
            </p>
            <Button
              className="w-full"
              onClick={() => triggerDownload(result.blob, result.fileName)}
            >
              <Download className="h-4 w-4" />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
