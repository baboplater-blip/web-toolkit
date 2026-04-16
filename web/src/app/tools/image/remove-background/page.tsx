'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Eraser,
  FileImage,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

type Quality = 'fast' | 'medium' | 'high';

export default function RemoveBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>('medium');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [previewUrl, result]);

  const accept = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 지원합니다.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const runRemove = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProgressText('AI 모델 로드 중 (최초 실행 시 ~40MB)');

    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const outBlob = await removeBackground(file, {
        model:
          quality === 'fast'
            ? 'isnet_fp16'
            : quality === 'high'
              ? 'isnet'
              : 'isnet_quint8',
        output: { format: 'image/png', quality: 0.9 },
        progress: (key, current, total) => {
          const pct = total > 0 ? (current / total) * 100 : 0;
          setProgress(Math.round(pct));
          setProgressText(key);
        },
      });

      const url = URL.createObjectURL(outBlob);
      const fileName = renameWithSuffix(file.name, '-no-bg', 'png');
      setResult({ blob: outBlob, url, fileName });
    } catch (err) {
      setError(err instanceof Error ? err.message : '배경 제거 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Eraser className="h-5 w-5" />
            <h1 className="font-semibold text-base">AI 배경 제거</h1>
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
            accept="image/*"
            description="인물·상품·오브젝트 이미지를 업로드하세요"
            hint="최초 실행 시 AI 모델을 다운로드합니다 (약 40MB, 이후 캐시). 모든 처리는 브라우저 내."
            onFiles={(files) => accept(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="원본"
                className="max-w-full max-h-[40vh] object-contain"
              />
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">모델 품질</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['fast', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    disabled={processing}
                    className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
                      quality === q
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    <div className="font-medium">
                      {q === 'fast' ? '빠름' : q === 'medium' ? '보통' : '정확'}
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      {q === 'fast' ? 'FP16 · 20MB' : q === 'medium' ? 'Quint8 · 40MB' : 'FP32 · 80MB'}
                    </div>
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

            <Button onClick={runRemove} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Eraser className="h-4 w-4" />
                  배경 제거
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과 (투명 배경 PNG)
            </h2>
            <div
              className="rounded-lg border p-3 flex items-center justify-center"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="결과"
                className="max-w-full max-h-[40vh] object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              크기: {formatBytes(result.blob.size)}
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

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          @imgly/background-removal (AGPL-3.0) 기반. 모델은 로컬에 캐시되며 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
