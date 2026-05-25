'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  ShieldOff,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  isPdfFile,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/file-utils';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import { formatBytes } from '@/lib/compress/format';

/**
 * PDF 잠금 해제 전략:
 * 1) pdf-lib 로 `ignoreEncryption: true` 로드 → 재저장
 *    - 소유자 암호 (편집/인쇄 제한) 는 대부분 해제됨
 *    - 사용자 암호 (열람 암호) 는 실패할 수 있음
 * 2) 실패 시 pdfjs-dist 로 암호와 함께 로드 → 각 페이지 렌더 → pdf-lib 로 래스터 재조립
 *    - 콘텐츠는 이미지로 변환되어 텍스트 선택 불가 (fallback)
 */

type UnlockMode = 'auto' | 'rasterize';

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjs;
}

export default function PdfUnlockPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<UnlockMode>('auto');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; size: number } | null>(
    null,
  );

  const acceptFile = (f: File) => {
    if (!isPdfFile(f)) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setWarning(null);
    setResult(null);
    setFile(f);
  };

  const reset = () => {
    setFile(null);
    setPassword('');
    setResult(null);
    setError(null);
    setWarning(null);
  };

  const runUnlock = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setWarning(null);
    setResult(null);
    setProgressText('');

    try {
      const { PDFDocument } = await loadPdfLib();
      const arrayBuffer = await file.arrayBuffer();

      if (mode === 'auto') {
        setProgressText('잠금 제거 시도 중');
        try {
          const doc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
            updateMetadata: false,
          });
          const bytes = await doc.save({ useObjectStreams: true });
          const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
          const baseName = stripExtension(file.name);
          setResult({
            blob,
            fileName: `${baseName}-unlocked.pdf`,
            size: blob.size,
          });
          setWarning(
            '소유자 암호(편집/인쇄 제한)는 제거됐습니다. 내용이 여전히 암호화된 경우 "래스터화" 모드로 재시도하세요.',
          );
        } catch (err) {
          setError(
            `자동 해제 실패. 열람 암호가 걸린 PDF 는 "래스터화" 모드로 전환 후 비밀번호를 입력하세요. (${
              err instanceof Error ? err.message : ''
            })`,
          );
        }
      } else {
        // rasterize: pdfjs 로 열어서 각 페이지 → 이미지 → 새 PDF
        setProgressText('PDF 로드 중');
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer),
          password: password || undefined,
        }).promise;

        const outDoc = await PDFDocument.create();
        outDoc.setProducer('');
        outDoc.setCreator('');

        const total = pdf.numPages;
        for (let i = 1; i <= total; i++) {
          setProgressText(`페이지 변환 중 ${i}/${total}`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 컨텍스트 생성 실패');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const jpegBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('변환 실패'))), 'image/jpeg', 0.85);
          });
          const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
          const img = await outDoc.embedJpg(jpegBytes);
          const pgOut = outDoc.addPage([canvas.width, canvas.height]);
          pgOut.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
          page.cleanup();
        }

        setProgressText('PDF 저장 중');
        const bytes = await outDoc.save({ useObjectStreams: true });
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const baseName = stripExtension(file.name);
        setResult({
          blob,
          fileName: `${baseName}-unlocked.pdf`,
          size: blob.size,
        });
        setWarning(
          '래스터화 모드로 변환되었습니다. 텍스트 선택/검색이 불가합니다.',
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '잠금 해제 실패';
      if (msg.toLowerCase().includes('password')) {
        setError('비밀번호가 올바르지 않거나 누락되었습니다.');
      } else {
        setError(msg);
      }
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
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <ShieldOff className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 잠금 해제</h1>
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
            description="잠금을 해제할 PDF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {warning && (
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-600 dark:text-yellow-400">
            {warning}
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

            <div>
              <label className="text-xs font-medium mb-1.5 block">해제 방식</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode('auto')}
                  disabled={processing}
                  className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
                    mode === 'auto'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium">자동 (권장)</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    편집/인쇄 제한 해제. 원본 구조 유지.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('rasterize')}
                  disabled={processing}
                  className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
                    mode === 'rasterize'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium">래스터화</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    열람 암호 해제. 이미지 변환 (텍스트 손실).
                  </div>
                </button>
              </div>
            </div>

            {mode === 'rasterize' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  비밀번호 (있는 경우)
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PDF 비밀번호"
                  disabled={processing}
                  className="h-9" aria-label="비밀번호 (있는 경우)" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  비밀번호는 브라우저에서만 사용되며 저장되지 않습니다.
                </p>
              </div>
            )}

            <Separator />

            <Button onClick={runUnlock} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '처리 중...'}
                </>
              ) : (
                <>
                  <ShieldOff className="h-4 w-4" />
                  잠금 해제
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              본 도구는 본인이 권한을 가진 PDF 에만 사용하세요. 타인의 문서 암호를 무단 해제하는
              행위는 법률에 저촉될 수 있습니다.
            </p>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              완료
            </h2>
            <p className="text-xs text-muted-foreground text-center">
              크기: {formatBytes(result.size)}
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
