'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Smile, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';
import { loadBitmap } from '@/lib/tools/image-common';

/**
 * 주어진 텍스트를 maxWidth 안에 들어가도록 단어 단위로 줄바꿈한다.
 * 단어 하나가 maxWidth 보다 길면 글자 단위로 강제 분리한다.
 */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split('\n')) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
      // 단어 자체가 너무 길면 글자 단위로 쪼갠다.
      while (ctx.measureText(current).width > maxWidth && current.length > 1) {
        let cut = current.length - 1;
        while (cut > 1 && ctx.measureText(current.slice(0, cut)).width > maxWidth) {
          cut--;
        }
        lines.push(current.slice(0, cut));
        current = current.slice(cut);
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

interface MemeRenderOpts {
  bitmap: ImageBitmap;
  topText: string;
  bottomText: string;
}

function drawMeme(canvas: HTMLCanvasElement, opts: MemeRenderOpts) {
  const { bitmap, topText, bottomText } = opts;
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

  ctx.drawImage(bitmap, 0, 0);

  // Impact 풍: 이미지 짧은 변에 비례한 폰트 크기.
  const fontSize = Math.max(16, Math.round(Math.min(canvas.width, canvas.height) * 0.1));
  ctx.font = `bold ${fontSize}px Impact, "Arial Black", "Anton", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(2, fontSize * 0.08);
  ctx.lineJoin = 'round';

  const lineHeight = fontSize * 1.1;
  const margin = fontSize * 0.3;
  const maxTextWidth = canvas.width * 0.94;

  const paint = (lines: string[], yStart: number, dir: 'down' | 'up') => {
    lines.forEach((line, idx) => {
      const y =
        dir === 'down'
          ? yStart + idx * lineHeight
          : yStart - (lines.length - 1 - idx) * lineHeight;
      ctx.strokeText(line, canvas.width / 2, y);
      ctx.fillText(line, canvas.width / 2, y);
    });
  };

  if (topText.trim()) {
    ctx.textBaseline = 'top';
    const lines = wrapLines(ctx, topText.toUpperCase(), maxTextWidth);
    paint(lines, margin, 'down');
  }
  if (bottomText.trim()) {
    ctx.textBaseline = 'bottom';
    const lines = wrapLines(ctx, bottomText.toUpperCase(), maxTextWidth);
    paint(lines, canvas.height - margin, 'up');
  }
}

export default function MemeGenPage() {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [fileName, setFileName] = useState('meme');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => () => bitmap?.close(), [bitmap]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    try {
      drawMeme(canvas, { bitmap, topText, bottomText });
    } catch (e) {
      // 미리보기 렌더 실패는 비치명적(다운로드 경로에서 별도 처리). 콘솔에만 남긴다.
      console.error('[meme] preview render failed', e);
    }
  }, [bitmap, topText, bottomText]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('이미지 파일을 업로드해주세요.');
      return;
    }
    setError(null);
    try {
      const next = await loadBitmap(file);
      setBitmap((prev) => {
        prev?.close();
        return next;
      });
      const dot = file.name.lastIndexOf('.');
      setFileName(dot > 0 ? file.name.slice(0, dot) : file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 로드에 실패했습니다.');
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('PNG 인코딩에 실패했습니다.');
        return;
      }
      triggerDownload(blob, `${fileName}-meme.png`);
    }, 'image/png');
  }

  function handleReset() {
    setBitmap((prev) => {
      prev?.close();
      return null;
    });
    setTopText('');
    setBottomText('');
    setFileName('meme');
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="밈 생성기" widthClass="max-w-2xl" onReset={bitmap ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지에 상단·하단 텍스트를 Impact 스타일(흰색 글자 + 검은 테두리)로 얹어 클래식 밈을 만듭니다.
        </p>

      {!bitmap && (
        <FileDropZone
          accept="image/*"
          onFiles={handleFiles}
          onError={setError}
          description="밈으로 만들 이미지를 올려주세요."
          maxBytes={50 * 1024 * 1024}
        />
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {bitmap && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="meme-top" className="text-xs font-medium">
                상단 텍스트
              </label>
              <Input
                id="meme-top"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="ONE DOES NOT SIMPLY"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="meme-bottom" className="text-xs font-medium">
                하단 텍스트
              </label>
              <Input
                id="meme-bottom"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="MAKE A MEME"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted p-3">
            <canvas
              ref={canvasRef}
              className="mx-auto h-auto max-h-[60vh] w-full max-w-full object-contain"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              PNG 다운로드
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                bitmap.close();
                setBitmap(null);
                setTopText('');
                setBottomText('');
              }}
            >
              다른 이미지
            </Button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
