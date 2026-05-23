'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileText,
  FilePlus,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { isPdfFile, stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

/**
 * PDF 복구 전략:
 * 1) pdf-lib 로 `throwOnInvalidObject: false` + `ignoreEncryption: true` 로드 후 재저장
 *    - 파싱 가능한 부분만 살려서 정상 PDF 로 재구성
 * 2) 실패 시 pdfjs-dist 로 강제 파싱 → 각 페이지 렌더 → 새 PDF 조립
 *    - 원본 구조는 잃지만 읽을 수 있는 형태로 복구
 */

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjs;
}

export default function PdfRepairPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    size: number;
    method: string;
    pageCount: number;
  } | null>(null);

  const appendLog = (line: string) => setLog((prev) => [...prev, line]);

  const acceptFile = (f: File) => {
    if (!isPdfFile(f)) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResult(null);
    setLog([]);
    setFile(f);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setLog([]);
  };

  const runRepair = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    setLog([]);
    setProgressText('');

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Step 1: pdf-lib 관대한 파싱
      appendLog('1단계: 관대한 파싱 모드로 로드 시도...');
      setProgressText('구조 복원 시도');
      try {
        const doc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
          throwOnInvalidObject: false,
          updateMetadata: false,
        });
        const pageCount = doc.getPageCount();
        appendLog(`  → ${pageCount}페이지 파싱 성공`);
        if (pageCount > 0) {
          setProgressText('재저장 중');
          const bytes = await doc.save({ useObjectStreams: true });
          const blob = new Blob([bytes as unknown as BlobPart], {
            type: 'application/pdf',
          });
          appendLog(`  → 재저장 완료 (${formatBytes(blob.size)})`);
          setResult({
            blob,
            fileName: `${stripExtension(file.name)}-repaired.pdf`,
            size: blob.size,
            method: '구조 복원',
            pageCount,
          });
          return;
        }
      } catch (err) {
        appendLog(
          `  → 실패: ${err instanceof Error ? err.message.slice(0, 80) : '알 수 없음'}`,
        );
      }

      // Step 2: pdfjs 강제 파싱 → 렌더 → 재조립
      appendLog('2단계: pdfjs 강제 파싱 + 래스터 재조립...');
      setProgressText('pdfjs 로 분석 중');
      const pdfjs = await loadPdfJs();
      const pdf = await pdfjs.getDocument({
        data: new Uint8Array(arrayBuffer),
        stopAtErrors: false,
      }).promise;

      const total = pdf.numPages;
      appendLog(`  → ${total}페이지 감지`);

      const outDoc = await PDFDocument.create();
      outDoc.setProducer('');
      outDoc.setCreator('');

      let success = 0;
      for (let i = 1; i <= total; i++) {
        setProgressText(`페이지 복원 ${i}/${total}`);
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 생성 실패');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const jpegBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('캔버스 변환 실패'))), 'image/jpeg', 0.85);
          });
          const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
          const img = await outDoc.embedJpg(jpegBytes);
          const pg = outDoc.addPage([canvas.width, canvas.height]);
          pg.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
          page.cleanup();
          success++;
        } catch (err) {
          appendLog(
            `  → 페이지 ${i} 실패: ${err instanceof Error ? err.message.slice(0, 60) : ''}`,
          );
        }
      }

      if (success === 0) {
        throw new Error('복구할 수 있는 페이지가 없습니다.');
      }

      appendLog(`  → ${success}/${total} 페이지 복구 성공`);
      setProgressText('PDF 저장 중');
      const bytes = await outDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], {
        type: 'application/pdf',
      });
      setResult({
        blob,
        fileName: `${stripExtension(file.name)}-repaired.pdf`,
        size: blob.size,
        method: `래스터 재조립 (${success}/${total})`,
        pageCount: success,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '복구 실패');
      appendLog(`오류: ${err instanceof Error ? err.message : ''}`);
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <FilePlus className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 복구</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {!file && (
          <FileDropZone
            accept="application/pdf"
            description="열리지 않거나 손상된 PDF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <Separator />

            <p className="text-xs text-muted-foreground leading-relaxed">
              2단계 복구: ① 관대한 파싱으로 구조 복원 → 실패 시 ② pdfjs 로 읽을 수 있는 페이지를
              래스터화하여 새 PDF 조립. 완전 손상된 파일은 복구 불가할 수 있습니다.
            </p>

            <Button onClick={runRepair} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '복구 중...'}
                </>
              ) : (
                <>
                  <FilePlus className="h-4 w-4" />
                  복구 시작
                </>
              )}
            </Button>
          </div>
        )}

        {log.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-1">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              진행 로그
            </h2>
            <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {log.join('\n')}
            </pre>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              복구 완료
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">방식</p>
                <p className="text-xs font-semibold mt-0.5">{result.method}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">페이지</p>
                <p className="text-sm font-semibold mt-0.5">{result.pageCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">크기</p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(result.size)}</p>
              </div>
            </div>
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
