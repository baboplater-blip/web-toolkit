'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

const MAX_BYTES = 50 * 1024 * 1024;
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_WIDTH = 60;
const MIN_WIDTH = 10;
const MAX_WIDTH = 200;
const DEFAULT_THRESHOLD = 128;
const BRAILLE_BASE = 0x2800;

// 2×4 점자 셀에서 (dx, dy) 위치 → 점 비트값. U+2800 의 도트 순서를 따른다.
const DOT_BITS: number[][] = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

/**
 * 그레이스케일 픽셀 버퍼를 유니코드 점자 아트로 변환한다.
 * 2×4 픽셀 블록마다 8개 도트의 on/off 를 임계값으로 결정하고,
 * invert 면 명암을 뒤집는다. 빈(모든 도트 off) 셀도 U+2800(공백 점자)로 보존한다.
 */
function pixelsToBraille(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
  invert: boolean,
): string {
  const lines: string[] = [];
  for (let y = 0; y < height; y += 4) {
    let line = '';
    for (let x = 0; x < width; x += 2) {
      let pattern = 0;
      for (let dy = 0; dy < 4; dy += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          const px = x + dx;
          const py = y + dy;
          if (px >= width || py >= height) continue;
          const value = gray[py * width + px];
          // 어두운 픽셀을 점으로 켠다(invert 면 밝은 픽셀).
          const isDot = invert ? value > threshold : value <= threshold;
          if (isDot) pattern |= DOT_BITS[dy][dx];
        }
      }
      line += String.fromCharCode(BRAILLE_BASE + pattern);
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export default function ImageAsciiBraillePage() {
  const [file, setFile] = useState<File | null>(null);
  const [charWidth, setCharWidth] = useState(DEFAULT_WIDTH);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [invert, setInvert] = useState(false);
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 파일·옵션 변경 시 디바운스 후 재처리. 이미지는 로드 이후에만 처리(하이드레이션 안전).
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => {
      void render(file);
    }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, charWidth, threshold, invert]);

  async function render(source: File): Promise<void> {
    setBusy(true);
    setError(null);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(source);
      // 점자 셀은 가로 2px·세로 4px → 셀 종횡비 보정을 위해 세로 픽셀을 2배로 잡는다.
      const cols = Math.max(2, charWidth * 2);
      const scale = cols / bitmap.width;
      // 셀 1행=4px 이므로 4의 배수로 맞춰 잘림을 최소화한다.
      const rows = Math.max(4, Math.round(bitmap.height * scale * 0.5) * 2);
      assertCanvasSize(cols, rows);

      const canvas = document.createElement('canvas');
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
      ctx.drawImage(bitmap, 0, 0, cols, rows);

      const { data } = ctx.getImageData(0, 0, cols, rows);
      const gray = new Uint8ClampedArray(cols * rows);
      for (let i = 0; i < gray.length; i += 1) {
        const o = i * 4;
        const alpha = data[o + 3] / 255;
        // 투명 영역은 흰 배경에 합성(밝게)해 배경이 점으로 채워지지 않게 한다.
        const lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
        gray[i] = Math.round(lum * alpha + 255 * (1 - alpha));
      }

      setOutput(pixelsToBraille(gray, cols, rows, threshold, invert));
    } catch (e) {
      setError(e instanceof Error ? e.message : '점자 아트 변환에 실패했습니다.');
      setOutput('');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset(): void {
    setFile(null);
    setCharWidth(DEFAULT_WIDTH);
    setThreshold(DEFAULT_THRESHOLD);
    setInvert(false);
    setOutput('');
    setError(null);
    setBusy(false);
  }

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="점자 아트 변환" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지를 유니코드 점자(⠿) 블록으로 변환합니다. 2×4 픽셀을 점자 한 글자로 매핑해
          ASCII 아트보다 촘촘한 텍스트 이미지를 만듭니다. 모든 처리는 브라우저 안에서 이루어집니다.
        </p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          title="이미지 1장을 끌어다 놓거나 클릭"
          maxBytes={MAX_BYTES}
        />

        {file && (
          <div className="space-y-3 rounded-xl border bg-card p-3">
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="braille-width">
                가로 글자 수 ({charWidth})
              </label>
              <input
                id="braille-width"
                type="range"
                min={MIN_WIDTH}
                max={MAX_WIDTH}
                value={charWidth}
                onChange={(e) => setCharWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="braille-threshold">
                임계값 ({threshold})
              </label>
              <input
                id="braille-threshold"
                type="range"
                min={0}
                max={255}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                값이 높을수록 더 많은 영역이 점으로 채워집니다.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => setInvert(e.target.checked)}
                className="h-4 w-4"
              />
              명암 반전
            </label>
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

        {output && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={copy}>
                {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                복사
              </Button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={16}
              wrap="off"
              spellCheck={false}
              className="w-full overflow-auto rounded-lg border bg-muted px-2.5 py-2 font-mono text-[10px] leading-[1.05]"
              aria-label="점자 아트 결과"
            />
          </div>
        )}
      </main>
    </div>
  );
}
