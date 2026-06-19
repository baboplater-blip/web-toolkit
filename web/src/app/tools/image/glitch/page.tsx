'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download, Shuffle } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 슬라이더/재생성 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_SHIFT = 8;
const MAX_SHIFT = 60;
const DEFAULT_SCANLINE = 40;
const MAX_SCANLINE = 100;
const SCANLINE_PERIOD = 3; // 매 N 번째 행을 어둡게 한다.
const MAX_BYTES = 50 * 1024 * 1024;

/**
 * 행 번호를 시드와 섞어 0~1 사이 의사난수를 만든다(결정적 지터).
 * Math.random 과 달리 같은 (row, seed) 면 항상 같은 값이라, 한 번의
 * 렌더 안에서 R/B 채널이 같은 지터를 공유하도록 보장한다.
 */
function jitter(row: number, seed: number): number {
  const x = Math.sin(row * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * R 채널을 왼쪽으로, B 채널을 오른쪽으로 행마다 다른 양만큼 수평 이동하고,
 * 매 SCANLINE_PERIOD 번째 행을 어둡게 해 글리치(RGB 분리 + 스캔라인) 효과를 만든다.
 * src 는 원본 픽셀(읽기 전용), dst 는 결과를 쓸 버퍼다. 알파는 보존한다.
 *
 * @param maxShift   채널 수평 이동 최대 픽셀(0 이면 분리 없음)
 * @param scanline   스캔라인 어둡기 0~100(%)
 * @param seed       행별 지터 시드(재생성 버튼으로 바뀜)
 */
function applyGlitch(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  maxShift: number,
  scanline: number,
  seed: number,
): void {
  const darken = 1 - Math.min(100, Math.max(0, scanline)) / 100;
  for (let y = 0; y < height; y += 1) {
    // 행마다 −maxShift..+maxShift 범위에서 흔들리는 이동량(정수 px).
    const wobble = (jitter(y, seed) - 0.5) * 2;
    const shift = Math.round(wobble * maxShift);
    const rowDark = y % SCANLINE_PERIOD === 0 ? darken : 1;
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const i = rowStart + x * 4;
      // R 은 왼쪽(−shift), B 는 오른쪽(+shift)에서 샘플링해 색을 분리한다.
      const rx = Math.min(width - 1, Math.max(0, x - shift));
      const bx = Math.min(width - 1, Math.max(0, x + shift));
      const ri = rowStart + rx * 4;
      const bi = rowStart + bx * 4;
      dst[i] = src[ri] * rowDark;
      dst[i + 1] = src[i + 1] * rowDark;
      dst[i + 2] = src[bi + 2] * rowDark;
      dst[i + 3] = src[i + 3];
    }
  }
}

export default function ImageGlitchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [shift, setShift] = useState(DEFAULT_SHIFT);
  const [scanline, setScanline] = useState(DEFAULT_SCANLINE);
  const [seed, setSeed] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 파일·이동량·스캔라인·시드 변경 시 디바운스 후 재처리.
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, shift, scanline, seed]);

  async function render() {
    if (!file) return;
    setBusy(true);
    setError(null);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(file);
      const { width, height } = bitmap;
      assertCanvasSize(width, height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
      ctx.drawImage(bitmap, 0, 0);

      const image = ctx.getImageData(0, 0, width, height);
      // 채널 이동은 원본 픽셀을 읽어야 하므로 입력 사본을 따로 둔다.
      const source = new Uint8ClampedArray(image.data);
      applyGlitch(source, image.data, width, height, shift, scanline, seed);
      ctx.putImageData(image, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '글리치 변환에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  // 새 시드로 행별 지터를 다시 굴려 다른 글리치 패턴을 만든다.
  // 클릭(마운트 후)에서만 호출되므로 Math.random 사용이 하이드레이션에 안전하다.
  function reroll() {
    setSeed(Math.floor(Math.random() * 1_000_000) + 1);
  }

  function handleReset() {
    setFile(null);
    setShift(DEFAULT_SHIFT);
    setScanline(DEFAULT_SCANLINE);
    setSeed(1);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 글리치 효과" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          RGB 채널을 좌우로 분리하고 스캔라인을 입혀 글리치 느낌으로 변환합니다.
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
              <label className="text-xs font-medium" htmlFor="glitch-shift">
                RGB 시프트 ({shift}px)
              </label>
              <input
                id="glitch-shift"
                type="range"
                min={0}
                max={MAX_SHIFT}
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                빨강·파랑 채널을 좌우로 분리하는 최대 거리입니다.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="glitch-scanline">
                스캔라인 강도 ({scanline}%)
              </label>
              <input
                id="glitch-scanline"
                type="range"
                min={0}
                max={MAX_SCANLINE}
                value={scanline}
                onChange={(e) => setScanline(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                일정 간격의 가로줄을 어둡게 만드는 정도입니다.
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={reroll} disabled={busy}>
              <Shuffle className="h-4 w-4" aria-hidden /> 패턴 다시 생성
            </Button>
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
            <img src={previewUrl} alt="글리치 변환 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="glitch.png"
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
