'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Eraser,
  FileText,
  Loader2,
  PenTool,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  allPages,
  isPdfFile,
  loadPdfFromFile,
  parsePageRanges,
  saveAsBlob,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type Position = 'tl' | 'tr' | 'bl' | 'br' | 'center';
type TargetMode = 'all' | 'range' | 'last';

const POSITION_LABEL: Record<Position, string> = {
  tl: '좌상',
  tr: '우상',
  bl: '좌하',
  br: '우하',
  center: '중앙',
};

export default function PdfSignPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(3);
  const [position, setPosition] = useState<Position>('br');
  const [signatureScale, setSignatureScale] = useState(20);
  const [targetMode, setTargetMode] = useState<TargetMode>('last');
  const [rangeSpec, setRangeSpec] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; size: number } | null>(
    null,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

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
      setRangeSpec(`${doc.getPageCount()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 로드 실패');
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setResult(null);
    setError(null);
    clearSignature();
  };

  const getCanvasPoint = (e: PointerEvent | React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    drawingRef.current = true;
    const pt = getCanvasPoint(e);
    lastPointRef.current = pt;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPointRef.current = pt;
    setHasSignature(true);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setHasSignature(false);
  };

  // 서명 이미지를 투명 배경 PNG 로 export (흰색 픽셀 제거)
  const exportSignatureBytes = async (): Promise<Uint8Array> => {
    const src = canvasRef.current!;
    const ctx = src.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, src.width, src.height);
    const data = imgData.data;
    // 거의 흰색에 가까운 픽셀을 투명 처리
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const min = Math.min(r, g, b);
      if (min > 230) {
        data[i + 3] = 0;
      } else {
        // 반투명 처리로 자연스러운 잉크 느낌
        data[i + 3] = Math.min(255, 255 - min);
      }
    }
    const out = document.createElement('canvas');
    out.width = src.width;
    out.height = src.height;
    const octx = out.getContext('2d')!;
    octx.putImageData(imgData, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      out.toBlob((b) => (b ? resolve(b) : reject(new Error('서명 변환 실패'))), 'image/png');
    });
    return new Uint8Array(await blob.arrayBuffer());
  };

  const runApply = async () => {
    if (!file) return;
    if (!hasSignature) {
      setError('서명을 먼저 그려주세요.');
      return;
    }
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const doc = await loadPdfFromFile(file);
      const total = doc.getPageCount();
      let targets: number[];
      if (targetMode === 'all') targets = allPages(total);
      else if (targetMode === 'last') targets = [total];
      else targets = parsePageRanges(rangeSpec, total);
      if (targets.length === 0) {
        setError('서명을 삽입할 페이지가 없습니다.');
        setProcessing(false);
        return;
      }

      const pngBytes = await exportSignatureBytes();
      const image = await doc.embedPng(pngBytes);
      const imgRatio = image.width / image.height;

      const pages = doc.getPages();
      for (const pn of targets) {
        const page = pages[pn - 1];
        const { width: pw, height: ph } = page.getSize();
        const baseDim = Math.min(pw, ph) * (signatureScale / 100);
        const drawW = baseDim;
        const drawH = baseDim / imgRatio;
        const margin = 30;
        let x = 0;
        let y = 0;
        switch (position) {
          case 'tl':
            x = margin;
            y = ph - margin - drawH;
            break;
          case 'tr':
            x = pw - margin - drawW;
            y = ph - margin - drawH;
            break;
          case 'bl':
            x = margin;
            y = margin;
            break;
          case 'br':
            x = pw - margin - drawW;
            y = margin;
            break;
          case 'center':
            x = (pw - drawW) / 2;
            y = (ph - drawH) / 2;
            break;
        }
        page.drawImage(image, { x, y, width: drawW, height: drawH });
      }

      const blob = await saveAsBlob(doc);
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        fileName: `${baseName}-signed.pdf`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '서명 삽입 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
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
            <PenTool className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 서명</h1>
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
            description="서명을 삽입할 PDF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && (
          <>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {pageCount}페이지
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  여기에 서명 (마우스/터치)
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearSignature}
                  disabled={processing}
                >
                  <Eraser className="h-3.5 w-3.5 mr-1" />
                  지우기
                </Button>
              </div>

              <canvas
                ref={canvasRef}
                className="w-full h-48 bg-white rounded-lg border touch-none cursor-crosshair"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">펜 색상</label>
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    disabled={processing}
                    className="h-9 w-full rounded-md border cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">펜 굵기</label>
                    <span className="text-xs text-muted-foreground">{penWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    disabled={processing}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                삽입 설정
              </h2>

              <div>
                <label className="text-xs font-medium mb-1.5 block">위치</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['tl', 'tr', 'center', 'bl', 'br'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPosition(p)}
                      disabled={processing}
                      className={`h-9 text-[11px] rounded-md border ${
                        position === p
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      {POSITION_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">서명 크기 (페이지 대비)</label>
                  <span className="text-xs text-muted-foreground">{signatureScale}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={signatureScale}
                  onChange={(e) => setSignatureScale(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">대상 페이지</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetMode('last')}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      targetMode === 'last'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    마지막 페이지
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('all')}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      targetMode === 'all'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    모든 페이지
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('range')}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      targetMode === 'range'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    페이지 지정
                  </button>
                </div>
                {targetMode === 'range' && (
                  <Input
                    type="text"
                    value={rangeSpec}
                    onChange={(e) => setRangeSpec(e.target.value)}
                    placeholder="예: 1, 3"
                    disabled={processing}
                    className="h-9 mt-2"
                  />
                )}
              </div>

              <Separator />

              <Button
                onClick={runApply}
                disabled={processing || !hasSignature}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    적용 중...
                  </>
                ) : (
                  <>
                    <PenTool className="h-4 w-4" />
                    서명 삽입
                  </>
                )}
              </Button>
            </div>
          </>
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
