'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 슬라이더/색상 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const MAX_BYTES = 50 * 1024 * 1024;

type BgMode = 'gradient' | 'solid';

const DEFAULTS = {
  padding: 80,
  cornerRadius: 16,
  shadow: 40,
  bgColor1: '#6366f1',
  bgColor2: '#ec4899',
  bgMode: 'gradient' as BgMode,
};

/** 모서리가 둥근 사각형 경로를 현재 컨텍스트에 그린다. */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  // 반경이 변 길이의 절반을 넘지 않도록 클램프(찌그러짐 방지).
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export default function ScreenshotShadowPage() {
  const [file, setFile] = useState<File | null>(null);
  const [padding, setPadding] = useState(DEFAULTS.padding);
  const [cornerRadius, setCornerRadius] = useState(DEFAULTS.cornerRadius);
  const [shadow, setShadow] = useState(DEFAULTS.shadow);
  const [bgMode, setBgMode] = useState<BgMode>(DEFAULTS.bgMode);
  const [bgColor1, setBgColor1] = useState(DEFAULTS.bgColor1);
  const [bgColor2, setBgColor2] = useState(DEFAULTS.bgColor2);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 옵션 변경 시 디바운스 후 재처리.
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, padding, cornerRadius, shadow, bgMode, bgColor1, bgColor2]);

  async function render() {
    if (!file) return;
    setBusy(true);
    setError(null);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(file);
      const imgW = bitmap.width;
      const imgH = bitmap.height;

      const canvasW = imgW + padding * 2;
      const canvasH = imgH + padding * 2;
      // 여백을 더한 최종 캔버스가 브라우저 한계 안에 있는지 검사.
      assertCanvasSize(canvasW, canvasH);

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');

      // 1) 배경 채우기 (그라디언트 또는 단색)
      if (bgMode === 'gradient') {
        const gradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        gradient.addColorStop(0, bgColor1);
        gradient.addColorStop(1, bgColor2);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = bgColor1;
      }
      ctx.fillRect(0, 0, canvasW, canvasH);

      // 2) 그림자 — 둥근 사각형 경로를 fill 할 때 shadow 속성이 적용된다.
      ctx.save();
      if (shadow > 0) {
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = shadow;
        ctx.shadowOffsetY = Math.round(shadow / 2);
      }
      roundedRectPath(ctx, padding, padding, imgW, imgH, cornerRadius);
      // 그림자를 드리울 불투명 형태가 필요 — 흰색으로 채운다(이미지로 덮임).
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // 3) 같은 둥근 경로로 클립한 뒤 이미지를 그려 모서리를 둥글게.
      ctx.save();
      roundedRectPath(ctx, padding, padding, imgW, imgH, cornerRadius);
      ctx.clip();
      ctx.drawImage(bitmap, padding, padding, imgW, imgH);
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '스크린샷 꾸미기에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPadding(DEFAULTS.padding);
    setCornerRadius(DEFAULTS.cornerRadius);
    setShadow(DEFAULTS.shadow);
    setBgMode(DEFAULTS.bgMode);
    setBgColor1(DEFAULTS.bgColor1);
    setBgColor2(DEFAULTS.bgColor2);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="스크린샷 꾸미기" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          스크린샷에 여백·둥근 모서리·그림자·배경을 더해 돋보이게 만듭니다.
        </p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          title="이미지 1장을 끌어다 놓거나 클릭"
          maxBytes={MAX_BYTES}
        />

        {file && (
          <div className="rounded-xl border bg-card p-3 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="ss-padding">
                여백 ({padding}px)
              </label>
              <input
                id="ss-padding"
                type="range"
                min={0}
                max={300}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="ss-radius">
                모서리 둥글기 ({cornerRadius}px)
              </label>
              <input
                id="ss-radius"
                type="range"
                min={0}
                max={80}
                value={cornerRadius}
                onChange={(e) => setCornerRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="ss-shadow">
                그림자 ({shadow}px)
              </label>
              <input
                id="ss-shadow"
                type="range"
                min={0}
                max={120}
                value={shadow}
                onChange={(e) => setShadow(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium">배경</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={bgMode === 'gradient' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBgMode('gradient')}
                >
                  그라디언트
                </Button>
                <Button
                  variant={bgMode === 'solid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBgMode('solid')}
                >
                  단색
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-medium">
                  {bgMode === 'gradient' ? '시작 색' : '배경 색'}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor1}
                    onChange={(e) => setBgColor1(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                    aria-label={bgMode === 'gradient' ? '시작 색' : '배경 색'}
                  />
                  <span className="font-mono text-xs text-muted-foreground">{bgColor1}</span>
                </div>
              </label>
              {bgMode === 'gradient' && (
                <label className="space-y-1">
                  <span className="text-xs font-medium">끝 색</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor2}
                      onChange={(e) => setBgColor2(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                      aria-label="끝 색"
                    />
                    <span className="font-mono text-xs text-muted-foreground">{bgColor2}</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {busy && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> 처리 중…
          </p>
        )}

        {previewUrl && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="스크린샷 꾸미기 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="screenshot-shadow.png"
              className={buttonVariants({ variant: 'default', className: 'w-full' })}
            >
              <Download className="h-4 w-4" aria-hidden /> PNG 다운로드
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
