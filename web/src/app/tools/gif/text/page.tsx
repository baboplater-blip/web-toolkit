'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
  RotateCcw,
  Type,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

type Position = 'top' | 'middle' | 'bottom';

export default function GifTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState<{ w: number; h: number } | null>(null);
  const [text, setText] = useState('Hello!');
  const [fontSize, setFontSize] = useState(40);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [position, setPosition] = useState<Position>('bottom');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const acceptFile = async (f: File) => {
    if (!/\.gif$/i.test(f.name) && f.type !== 'image/gif') {
      setError('GIF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    const url = URL.createObjectURL(f);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('GIF 로드 실패'));
        i.src = url;
      });
      setFile(f);
      setPreviewUrl(url);
      setOrigSize({ w: img.naturalWidth, h: img.naturalHeight });
      // 폰트 크기 기본값: GIF 높이의 10%
      setFontSize(Math.max(20, Math.round(img.naturalHeight * 0.1)));
    } catch (err) {
      URL.revokeObjectURL(url);
      setError(err instanceof Error ? err.message : 'GIF 로드 실패');
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setOrigSize(null);
    setResult(null);
    setError(null);
  };

  /**
   * Canvas 에서 텍스트 오버레이 PNG 생성 (투명 배경 + 외곽선).
   * 한글·이모지도 Canvas 시스템 폰트로 자연스럽게 렌더.
   */
  const buildOverlay = async (): Promise<Uint8Array> => {
    if (!origSize) throw new Error('크기 미확정');
    const c = document.createElement('canvas');
    c.width = origSize.w;
    c.height = origSize.h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas 컨텍스트 생성 실패');

    ctx.font = `bold ${fontSize}px "Pretendard", "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, fontSize / 15);
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fontColor;

    const x = origSize.w / 2;
    let y: number;
    if (position === 'top') y = fontSize;
    else if (position === 'middle') y = origSize.h / 2;
    else y = origSize.h - fontSize * 0.7;

    // 줄바꿈 처리 (\n 또는 단순 글자 수 기준 줄 분할)
    const lines = text.split(/\n/);
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    let startY: number;
    if (position === 'top') startY = fontSize;
    else if (position === 'middle') startY = origSize.h / 2 - totalHeight / 2 + lineHeight / 2;
    else startY = origSize.h - totalHeight + lineHeight / 2 - 10;

    for (let i = 0; i < lines.length; i++) {
      const ly = startY + i * lineHeight;
      ctx.strokeText(lines[i], x, ly);
      ctx.fillText(lines[i], x, ly);
    }
    void y; // 단일 라인용 변수 (사용 안 하지만 로직 참고 유지)

    const blob: Blob = await new Promise((resolve, reject) => {
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('오버레이 생성 실패'))), 'image/png');
    });
    return new Uint8Array(await blob.arrayBuffer());
  };

  const runApply = async () => {
    if (!file || !origSize) return;
    if (!text.trim()) {
      setError('텍스트를 입력하세요.');
      return;
    }
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('텍스트 오버레이 생성');

    const created = ['input.gif', 'overlay.png', 'palette.png', 'output.gif'];
    try {
      const overlayPng = await buildOverlay();
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress }: { progress: number }) => {
        if (Number.isFinite(progress)) {
          setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);
      try {
        setProgressText('입력 준비');
        await writeFile(ffmpeg, 'input.gif', file);
        await ffmpeg.writeFile('overlay.png', overlayPng);

        // overlay 필터로 합성 후 팔레트로 GIF 재인코딩
        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-i',
          'overlay.png',
          '-filter_complex',
          '[0:v][1:v]overlay=0:0,palettegen=stats_mode=diff',
          '-y',
          'palette.png',
        ]);

        setProgressText('GIF 인코딩 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-i',
          'overlay.png',
          '-i',
          'palette.png',
          '-filter_complex',
          '[0:v][1:v]overlay=0:0[ov];[ov][2:v]paletteuse=dither=bayer:bayer_scale=3',
          '-loop',
          '0',
          '-y',
          'output.gif',
        ]);

        const blob = await readOutput(ffmpeg, 'output.gif', 'image/gif');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(file.name, '-text', 'gif'),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '텍스트 삽입 실패');
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
            <Link
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Type className="h-5 w-5" />
            <h1 className="font-semibold text-base">GIF 텍스트 삽입</h1>
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
            accept="image/gif"
            description="텍스트를 넣을 GIF 를 업로드하세요 (한글 지원)"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && origSize && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {origSize.w}×{origSize.h}
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="원본"
                className="max-w-full max-h-[30vh] object-contain"
              />
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">
                텍스트 (줄바꿈: 엔터)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="텍스트를 입력하세요 (한글 가능)"
                disabled={processing}
                rows={2}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm resize-y"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">위치</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['top', '상단'],
                    ['middle', '중앙'],
                    ['bottom', '하단'],
                  ] as const
                ).map(([p, label]) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPosition(p)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      position === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">글자 크기</label>
                <span className="text-xs text-muted-foreground">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={Math.max(40, Math.round(origSize.h * 0.3))}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">글자색</label>
                <Input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  disabled={processing}
                  className="h-9 cursor-pointer p-0"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">외곽선 색</label>
                <Input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  disabled={processing}
                  className="h-9 cursor-pointer p-0"
                />
              </div>
            </div>

            {processing && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <Separator />

            <Button onClick={runApply} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Type className="h-4 w-4" />
                  텍스트 삽입
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              💡 텍스트는 Canvas 로 렌더링되어 한글·이모지도 자연스럽게 표시됩니다.
            </p>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과
            </h2>
            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
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
      </main>
    </div>
  );
}
