'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileImage,
  Loader2,
  QrCode,
  RotateCcw,
  ScanLine,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { triggerDownload } from '@/lib/tools/pdf-common';

type Mode = 'generate' | 'read';
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

export default function QrCodePage() {
  const [mode, setMode] = useState<Mode>('generate');

  // ---- generate ----
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(512);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // ---- read ----
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // 옵션 변경 시 자동 재생성
  useEffect(() => {
    if (mode !== 'generate') return;
    if (!text.trim()) {
      setQrDataUrl(null);
      return;
    }
    setGenerating(true);
    setError(null);
    import('qrcode').then((QR) => {
      QR.toDataURL(
        text,
        {
          errorCorrectionLevel: errorLevel,
          width: size,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
        },
        (err, url) => {
          if (err) {
            setError(err.message);
            setQrDataUrl(null);
          } else {
            setQrDataUrl(url);
          }
          setGenerating(false);
        },
      );
    });
  }, [mode, text, size, fgColor, bgColor, errorLevel]);

  const downloadQr = async () => {
    if (!qrDataUrl) return;
    const res = await fetch(qrDataUrl);
    const blob = await res.blob();
    triggerDownload(blob, 'qr-code.png');
  };

  const acceptImage = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setDecodedText(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));

    setReading(true);
    try {
      const jsQR = (await import('jsqr')).default;
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('이미지 로드 실패'));
        i.src = URL.createObjectURL(f);
      });

      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트 생성 실패');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code) {
        setDecodedText(code.data);
      } else {
        setError('QR 코드를 찾지 못했습니다. 더 선명한 이미지를 시도해보세요.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QR 해독 실패');
    } finally {
      setReading(false);
    }
  };

  const resetRead = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setDecodedText(null);
    setError(null);
  };

  const copyDecoded = async () => {
    if (!decodedText) return;
    try {
      await navigator.clipboard.writeText(decodedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('복사 실패');
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
            <QrCode className="h-5 w-5" />
            <h1 className="font-semibold text-base">QR 코드 생성/읽기</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('generate')}
            className={`h-10 text-sm rounded-md border flex items-center justify-center gap-2 ${
              mode === 'generate'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            <QrCode className="h-4 w-4" />
            QR 생성
          </button>
          <button
            type="button"
            onClick={() => setMode('read')}
            className={`h-10 text-sm rounded-md border flex items-center justify-center gap-2 ${
              mode === 'read'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            <ScanLine className="h-4 w-4" />
            QR 읽기
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {mode === 'generate' && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">내용 (URL 또는 텍스트)</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="https://... 또는 텍스트"
                rows={3}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm font-mono resize-y" aria-label="내용 (URL 또는 텍스트)" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">크기</label>
                  <span className="text-xs text-muted-foreground">{size}px</span>
                </div>
                <input
                  type="range"
                  min={128}
                  max={1024}
                  step={32}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-primary" aria-label="크기" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">오류 복원</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['L', 'M', 'Q', 'H'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setErrorLevel(l)}
                      className={`h-7 text-[11px] rounded-md border ${
                        errorLevel === l
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                      title={
                        l === 'L'
                          ? '~7%'
                          : l === 'M'
                            ? '~15%'
                            : l === 'Q'
                              ? '~25%'
                              : '~30%'
                      }
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">전경색</label>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-9 w-full rounded-md border cursor-pointer" aria-label="전경색" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">배경색</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-9 w-full rounded-md border cursor-pointer" aria-label="배경색" />
              </div>
            </div>

            <Separator />

            {qrDataUrl && (
              <>
                <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR" className="max-w-full max-h-[50vh]" />
                </div>
                <Button onClick={downloadQr} className="w-full">
                  <Download className="h-4 w-4" />
                  PNG 다운로드
                </Button>
              </>
            )}
            {generating && (
              <p className="text-xs text-muted-foreground text-center">
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                생성 중...
              </p>
            )}
          </div>
        )}

        {mode === 'read' && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            {!imageFile && (
              <FileDropZone
                accept="image/*"
                description="QR 코드가 포함된 이미지를 업로드하세요"
                onFiles={(files) => acceptImage(files[0])}
              />
            )}

            {imageFile && imagePreview && (
              <>
                <div className="flex items-center gap-3">
                  <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium truncate flex-1">{imageFile.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={resetRead}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    다시
                  </Button>
                </div>
                <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="QR"
                    className="max-w-full max-h-[40vh] object-contain"
                  />
                </div>
                {reading && (
                  <p className="text-xs text-muted-foreground text-center">
                    <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                    해독 중...
                  </p>
                )}
                {decodedText !== null && (
                  <div className="rounded-lg border bg-background p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">해독 결과</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={copyDecoded}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            복사됨
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            복사
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-xs font-mono break-all whitespace-pre-wrap">
                      {decodedText}
                    </div>
                    {/^https?:\/\//i.test(decodedText) && (
                      <a
                        href={decodedText}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline"
                      >
                        링크 열기 →
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </main>
    </div>
  );
}
