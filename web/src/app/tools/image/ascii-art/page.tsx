'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { triggerDownload } from '@/lib/tools/pdf-common';

type Ramp = 'detailed' | 'simple' | 'blocks' | 'binary';

const RAMPS: Record<Ramp, string> = {
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
  simple: '@%#*+=-:. ',
  blocks: '█▓▒░ ',
  binary: '#. ',
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없습니다.'));
    };
    img.src = url;
  });
}

function convertToAscii(
  img: HTMLImageElement,
  width: number,
  ramp: string,
  invert: boolean,
): string {
  const aspect = img.height / img.width;
  const charAspect = 0.5;
  const height = Math.max(1, Math.round(width * aspect * charAspect));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('캔버스 컨텍스트를 만들 수 없습니다.');
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const chars = ramp;
  const lastIdx = chars.length - 1;
  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      let lum = (0.299 * r + 0.587 * g + 0.114 * b) * (a / 255);
      if (invert) lum = 255 - lum;
      const ci = Math.min(
        lastIdx,
        Math.max(0, Math.round((lum / 255) * lastIdx)),
      );
      line += chars[ci];
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function asciiToPng(ascii: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const lines = ascii.split('\n');
    const fontSize = 12;
    const lineHeight = fontSize;
    const charWidth = fontSize * 0.6;
    const width = Math.ceil((lines[0]?.length ?? 0) * charWidth);
    const height = Math.ceil(lines.length * lineHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('캔버스 생성 실패'));
      return;
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = `${fontSize}px ui-monospace, monospace`;
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 0, i * lineHeight);
    }
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('PNG 생성 실패'));
    }, 'image/png');
  });
}

export default function AsciiArtPage() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState(100);
  const [ramp, setRamp] = useState<Ramp>('detailed');
  const [invert, setInvert] = useState(false);
  const [ascii, setAscii] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const accept = useCallback(async (f: File) => {
    setError(null);
    setFile(f);
    try {
      const i = await loadImage(f);
      setImg(i);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드 실패');
      setImg(null);
    }
  }, []);

  useEffect(() => {
    if (!img) {
      setAscii('');
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setBusy(true);
      try {
        const out = convertToAscii(img, width, RAMPS[ramp], invert);
        setAscii(out);
      } catch (err) {
        setError(err instanceof Error ? err.message : '변환 실패');
      } finally {
        setBusy(false);
      }
    }, 80);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [img, width, ramp, invert]);

  const reset = () => {
    setFile(null);
    setImg(null);
    setAscii('');
    setError(null);
  };

  const copyAscii = async () => {
    if (!ascii) return;
    try {
      await navigator.clipboard.writeText(ascii);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const downloadTxt = () => {
    if (!ascii) return;
    const blob = new Blob([ascii], { type: 'text/plain;charset=utf-8' });
    const base = file?.name.replace(/\.[^.]+$/, '') ?? 'ascii';
    triggerDownload(blob, `${base}-ascii.txt`);
  };

  const downloadPng = async () => {
    if (!ascii) return;
    try {
      const blob = await asciiToPng(ascii);
      const base = file?.name.replace(/\.[^.]+$/, '') ?? 'ascii';
      triggerDownload(blob, `${base}-ascii.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNG 변환 실패');
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'h-8 w-8',
              })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <ImageIcon className="h-5 w-5" />
            <h1 className="font-semibold text-base">이미지 → ASCII 아트</h1>
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
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!file && (
          <FileDropZone
            accept="image/*"
            description="이미지를 업로드하세요 (PNG·JPG·WEBP·GIF)"
            hint="작은 이미지일수록 빠르게 변환됩니다. 사람·얼굴 사진은 대비 강한 것이 잘 나옵니다."
            onFiles={(files) => accept(files[0])}
          />
        )}

        {file && img && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center justify-between" htmlFor="ascii-width">
                  <span>가로 문자 수</span>
                  <span className="text-muted-foreground tabular-nums">{width}</span>
                </label>
                <input
                  id="ascii-width"
                  type="range"
                  min={40}
                  max={240}
                  step={4}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full"
                  aria-label="가로 문자 수"
                />
              </div>

              <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="text-xs font-medium block mb-1" htmlFor="ascii-ramp">
                    문자 셋
                  </label>
                  <select
                    id="ascii-ramp"
                    value={ramp}
                    onChange={(e) => setRamp(e.target.value as Ramp)}
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                    aria-label="문자 셋"
                  >
                    <option value="detailed">상세 (70자)</option>
                    <option value="simple">단순 (10자)</option>
                    <option value="blocks">블록</option>
                    <option value="binary">이진 (# .)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer pb-1">
                  <input
                    type="checkbox"
                    checked={invert}
                    onChange={(e) => setInvert(e.target.checked)}
                    className="h-4 w-4"
                    aria-label="명암 반전"
                  />
                  명암 반전
                </label>
              </div>
            </div>

            {ascii && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    결과 {busy && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}
                  </h2>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={copyAscii}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={downloadTxt}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      .txt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={downloadPng}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      .png
                    </Button>
                  </div>
                </div>
                <Separator />
                <pre
                  className="overflow-auto rounded-lg border bg-black text-white p-2 text-[6px] leading-[6px] font-mono whitespace-pre"
                  aria-label="ASCII 결과"
                >
                  {ascii}
                </pre>
              </div>
            )}
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            이미지의 픽셀 밝기를 문자의 두께·밀도로 표현합니다. 결과는 등폭(monospace)
            글꼴에서 가장 잘 보입니다. 처리는 브라우저 캔버스에서만 일어나며 이미지가
            서버로 전송되지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
