'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, IdCard } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';

interface Spec {
  id: string;
  label: string;
  mm: string;
  w: number;
  h: number;
}

// 픽셀 = mm / 25.4 * 300dpi (인쇄 품질)
const SPECS: Spec[] = [
  { id: 'id34', label: '증명사진 3×4cm', mm: '30×40mm', w: 354, h: 472 },
  { id: 'passport', label: '여권 35×45mm', mm: '35×45mm', w: 413, h: 531 },
  { id: 'large', label: '명함판 5×7cm', mm: '50×70mm', w: 591, h: 827 },
  { id: 'visa', label: '미국비자 2×2in', mm: '51×51mm', w: 600, h: 600 },
];

export default function IdPhotoPage() {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [spec, setSpec] = useState<Spec>(SPECS[0]);
  const [bg, setBg] = useState('#ffffff');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function onFiles(files: File[]) {
    setError(null);
    const file = files[0];
    if (!file) return;
    try {
      const bmp = await createImageBitmap(file);
      setBitmap(bmp);
    } catch {
      setError('이미지를 불러올 수 없습니다. 다른 파일을 시도해 주세요.');
    }
  }

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !bitmap) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    c.width = spec.w;
    c.height = spec.h;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, spec.w, spec.h);

    // cover: 대상 비율을 덮도록 스케일 후 중앙 크롭
    const scale = Math.max(spec.w / bitmap.width, spec.h / bitmap.height);
    const dw = bitmap.width * scale;
    const dh = bitmap.height * scale;
    const dx = (spec.w - dw) / 2;
    const dy = (spec.h - dh) / 2;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  }, [bitmap, spec, bg]);

  function download() {
    const c = canvasRef.current;
    if (!c || !bitmap) return;
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `증명사진-${spec.mm}.jpg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      },
      'image/jpeg',
      0.92,
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <IdCard className="h-5 w-5" />
          <h1 className="font-semibold text-base">증명사진 규격 변환</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <FileDropZone
          accept="image/*"
          onFiles={onFiles}
          onError={(m) => setError(m)}
        />
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

        {bitmap && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div>
                <span className="text-xs font-medium block mb-1.5">규격</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SPECS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSpec(s)}
                      aria-pressed={spec.id === s.id}
                      className={`h-12 text-xs rounded-md border px-1 ${
                        spec.id === s.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      <div className="font-semibold leading-tight">{s.label}</div>
                      <div className={`text-[10px] ${spec.id === s.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {s.w}×{s.h}px
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" htmlFor="bg">배경색</label>
                <input
                  id="bg"
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-8 w-12 rounded border bg-background"
                  aria-label="배경색"
                />
                <div className="flex gap-1">
                  {['#ffffff', '#dbe9f4', '#e8e8e8'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBg(c)}
                      className="h-6 w-6 rounded border"
                      style={{ background: c }}
                      aria-label={`배경 ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 flex flex-col items-center gap-3">
              <canvas
                ref={canvasRef}
                className="max-h-80 w-auto rounded border shadow-sm"
                style={{ aspectRatio: `${spec.w} / ${spec.h}` }}
                aria-label="증명사진 미리보기"
              />
              <button type="button" onClick={download} className={buttonVariants({ className: 'gap-1.5' })}>
                <Download className="h-4 w-4" />
                JPG 저장 (300dpi)
              </button>
            </div>
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            업로드한 사진을 선택한 규격 비율로 중앙 크롭·리사이즈해 인쇄 품질(300dpi)
            JPG로 저장합니다. 얼굴이 중앙에 오도록 미리 잘라 올리면 결과가 좋습니다.
            배경색은 단색으로 채워지며(투명/여백 영역에 적용), 모든 처리는 브라우저 안에서
            이뤄집니다 — 사진은 어디로도 전송되지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
