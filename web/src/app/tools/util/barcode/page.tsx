'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Barcode as BarcodeIcon,
  Download,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';

type Format =
  | 'CODE128'
  | 'CODE39'
  | 'EAN13'
  | 'EAN8'
  | 'UPC'
  | 'ITF14'
  | 'MSI'
  | 'pharmacode'
  | 'codabar';

export default function BarcodePage() {
  const [text, setText] = useState('123456789012');
  const [format, setFormat] = useState<Format>('CODE128');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const [displayValue, setDisplayValue] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!text.trim()) {
      setError(null);
      return;
    }
    import('jsbarcode').then((mod) => {
      const JsBarcode = mod.default;
      try {
        if (!svgRef.current) return;
        JsBarcode(svgRef.current, text, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          lineColor: fgColor,
          background: bgColor,
          margin: 10,
        });
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `${format} 포맷에 맞지 않는 값입니다.`,
        );
      }
    });
  }, [text, format, width, height, displayValue, fontSize, fgColor, bgColor]);

  const reset = () => {
    setText('');
    setError(null);
  };

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    triggerDownload(blob, `barcode-${format}.svg`);
  };

  const downloadPng = async () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('렌더 실패'));
        i.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `barcode-${format}.png`);
      }, 'image/png');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const placeholder = (f: Format) => {
    if (f === 'EAN13') return '13자리 숫자';
    if (f === 'EAN8') return '8자리 숫자';
    if (f === 'UPC') return '12자리 숫자';
    if (f === 'ITF14') return '14자리 숫자';
    return '텍스트 또는 숫자';
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
            <BarcodeIcon className="h-5 w-5" />
            <h1 className="font-semibold text-base">바코드 생성</h1>
          </div>
          {text && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">내용</label>
            <Input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder(format)}
              className="h-9 font-mono" aria-label="내용" />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">포맷</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
              {(
                ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC', 'ITF14', 'MSI', 'codabar', 'pharmacode'] as const
              ).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`h-8 text-[11px] rounded-md border ${
                    format === f
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">바 두께</label>
                <span className="text-xs text-muted-foreground">{width}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full accent-primary" aria-label="바 두께" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">높이</label>
                <span className="text-xs text-muted-foreground">{height}px</span>
              </div>
              <input
                type="range"
                min={40}
                max={200}
                step={5}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-primary" aria-label="높이" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">폰트</label>
                <span className="text-xs text-muted-foreground">{fontSize}</span>
              </div>
              <input
                type="range"
                min={10}
                max={30}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-primary" aria-label="폰트" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={displayValue}
              onChange={(e) => setDisplayValue(e.target.checked)}
            />
            하단에 값 표시
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            미리보기
          </h2>
          <div className="rounded-lg border bg-white p-4 flex items-center justify-center overflow-auto">
            <svg ref={svgRef} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full" onClick={downloadSvg}>
              <Download className="h-4 w-4" />
              SVG 다운로드
            </Button>
            <Button className="w-full" onClick={downloadPng}>
              <Download className="h-4 w-4" />
              PNG 다운로드
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
