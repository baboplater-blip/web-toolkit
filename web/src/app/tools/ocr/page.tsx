'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  ScanText,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { isPdfFile, stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type Language = 'kor' | 'eng' | 'kor+eng' | 'jpn' | 'chi_sim';

const LANGUAGE_LABEL: Record<Language, string> = {
  kor: '한국어',
  eng: 'English',
  'kor+eng': '한국어+영어',
  jpn: '日本語',
  chi_sim: '中文(简)',
};

async function pdfPagesToCanvases(file: File): Promise<HTMLCanvasElement[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    canvases.push(canvas);
    page.cleanup();
  }
  pdf.destroy();
  return canvases;
}

export default function OcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<Language>('kor+eng');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recognized, setRecognized] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const accept = (f: File) => {
    if (!f.type.startsWith('image/') && !isPdfFile(f)) {
      setError('이미지 또는 PDF 파일만 지원합니다.');
      return;
    }
    setError(null);
    setRecognized(null);
    setFile(f);
  };

  const reset = () => {
    setFile(null);
    setRecognized(null);
    setError(null);
    setProgressText('');
    setProgress(0);
  };

  const runOcr = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setRecognized(null);
    setProgress(0);

    try {
      setProgressText('Tesseract 엔진 로드 중 (~5MB)');
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(language, undefined, {
        logger: (m) => {
          if (typeof m.progress === 'number') {
            setProgress(Math.round(m.progress * 100));
            setProgressText(`${m.status ?? '처리 중'}`);
          }
        },
      });

      try {
        if (isPdfFile(file)) {
          setProgressText('PDF 페이지 렌더링');
          const canvases = await pdfPagesToCanvases(file);
          const allText: string[] = [];
          for (let i = 0; i < canvases.length; i++) {
            setProgressText(`페이지 ${i + 1}/${canvases.length} 인식 중`);
            const { data } = await worker.recognize(canvases[i]);
            allText.push(`--- 페이지 ${i + 1} ---\n${data.text.trim()}`);
          }
          setRecognized(allText.join('\n\n'));
        } else {
          const { data } = await worker.recognize(file);
          setRecognized(data.text.trim());
        }
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  const copyToClipboard = async () => {
    if (!recognized) return;
    try {
      await navigator.clipboard.writeText(recognized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('클립보드 복사 실패');
    }
  };

  const downloadTxt = () => {
    if (!recognized || !file) return;
    const blob = new Blob([recognized], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, `${stripExtension(file.name)}.txt`);
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
            <ScanText className="h-5 w-5" />
            <h1 className="font-semibold text-base">OCR (문자 인식)</h1>
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
            accept="image/*,application/pdf"
            description="이미지 또는 PDF 에서 텍스트를 추출합니다"
            hint="최초 실행 시 언어별 모델(5~15MB)을 다운로드합니다. 이후는 캐시."
            onFiles={(files) => accept(files[0])}
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

            <div>
              <label className="text-xs font-medium mb-1.5 block">인식 언어</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(LANGUAGE_LABEL) as Language[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      language === l
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {LANGUAGE_LABEL[l]}
                  </button>
                ))}
              </div>
            </div>

            {processing && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Button onClick={runOcr} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  인식 중...
                </>
              ) : (
                <>
                  <ScanText className="h-4 w-4" />
                  텍스트 인식
                </>
              )}
            </Button>
          </div>
        )}

        {recognized !== null && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                인식 결과 ({recognized.length.toLocaleString()}자)
              </h2>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      복사
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={downloadTxt}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  TXT 저장
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={recognized}
              className="w-full h-80 p-3 text-xs font-mono rounded-lg border bg-background resize-y"
            />
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Tesseract.js (Apache 2.0) 기반. 모든 처리는 브라우저에서 실행됩니다.
        </p>
      </main>
    </div>
  );
}
