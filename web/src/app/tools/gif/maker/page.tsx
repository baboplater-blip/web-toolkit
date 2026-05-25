'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  FileImage,
  Images,
  Loader2,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function GifMakerPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [frameMs, setFrameMs] = useState(200);
  const [width, setWidth] = useState(480);
  const [loop, setLoop] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const addFiles = (files: File[]) => {
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    const imgs = files.filter(
      (f) => f.type === 'image/png' || f.type === 'image/jpeg' || /\.(png|jpe?g)$/i.test(f.name),
    );
    if (imgs.length === 0) {
      setError('PNG 또는 JPG 이미지만 추가할 수 있습니다.');
      return;
    }
    const newItems: QueueItem[] = imgs.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const reset = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    if (result) URL.revokeObjectURL(result.url);
    setItems([]);
    setResult(null);
    setError(null);
  };

  const runMake = async () => {
    if (items.length < 2) {
      setError('최소 2장 이상의 이미지가 필요합니다.');
      return;
    }
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const inputNames: string[] = [];
    const created: string[] = ['palette.png', 'output.gif'];

    try {
      const ffmpeg = await getFFmpeg();

      const onProgress = ({ progress }: { progress: number }) => {
        if (Number.isFinite(progress)) {
          setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);

      try {
        setProgressText('이미지 준비 중');
        const digits = String(items.length).length;
        for (let i = 0; i < items.length; i++) {
          const ext = items[i].file.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
          const name = `img_${String(i + 1).padStart(digits, '0')}.${ext}`;
          inputNames.push(name);
          created.push(name);
          await writeFile(ffmpeg, name, items[i].file);
        }

        // 모든 파일명을 일관되게 만들기 위해 concat 입력 파일 사용
        const concatName = 'concat.txt';
        created.push(concatName);
        const frameDurSec = Math.max(0.02, frameMs / 1000);
        const concatLines = inputNames
          .map((n) => `file '${n}'\nduration ${frameDurSec}`)
          .join('\n');
        // FFmpeg concat demuxer 는 마지막 파일을 한 번 더 써야 함
        const concatContent = `${concatLines}\nfile '${inputNames[inputNames.length - 1]}'\n`;
        await ffmpeg.writeFile(concatName, new TextEncoder().encode(concatContent));

        const vf = `scale=${width}:-1:flags=lanczos`;

        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          concatName,
          '-vf',
          `${vf},palettegen=stats_mode=full`,
          '-y',
          'palette.png',
        ]);

        setProgressText('GIF 인코딩 중');
        await ffmpeg.exec([
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          concatName,
          '-i',
          'palette.png',
          '-lavfi',
          `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
          '-loop',
          loop ? '0' : '-1',
          '-y',
          'output.gif',
        ]);

        const blob = await readOutput(ffmpeg, 'output.gif', 'image/gif');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: 'animation.gif',
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GIF 생성 실패');
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
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Images className="h-5 w-5" />
            <h1 className="font-semibold text-base">GIF 만들기</h1>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <FileDropZone
          accept="image/png,image/jpeg"
          multiple
          title="PNG 또는 JPG 이미지 여러 장을 추가"
          description="순서대로 애니메이션 GIF 로 묶입니다"
          onFiles={addFiles}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {items.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              프레임 순서 ({items.length}장)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map((it, idx) => (
                <div key={it.id} className="relative rounded-lg border overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.previewUrl}
                      alt={`${idx + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="absolute top-1 left-1 bg-background/90 rounded px-1.5 py-0.5 text-[10px] font-mono">
                    {idx + 1}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-1 bg-background/90 flex items-center justify-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveItem(it.id, -1)}
                      disabled={idx === 0 || processing}
                      aria-label="앞으로"
                    >
                      <ArrowUp className="h-3 w-3" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveItem(it.id, 1)}
                      disabled={idx === items.length - 1 || processing}
                      aria-label="뒤로"
                    >
                      <ArrowDown className="h-3 w-3" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive"
                      onClick={() => removeItem(it.id)}
                      disabled={processing}
                      aria-label="삭제"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">프레임 표시 시간</label>
                <span className="text-xs text-muted-foreground">
                  {frameMs}ms ({(1000 / frameMs).toFixed(1)} FPS)
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={2000}
                step={20}
                value={frameMs}
                onChange={(e) => setFrameMs(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary" aria-label="프레임 표시 시간" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">너비 (px)</label>
                <span className="text-xs text-muted-foreground">{width}</span>
              </div>
              <input
                type="range"
                min={120}
                max={1280}
                step={10}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary" aria-label="너비 (px)" />
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
                disabled={processing}
              />
              무한 반복
            </label>

            {processing && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Separator />

            <Button
              onClick={runMake}
              disabled={processing || items.length < 2}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  GIF 생성 중...
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4" />
                  GIF 만들기 ({items.length}장)
                </>
              )}
            </Button>
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
                alt="GIF"
                className="max-w-full max-h-[50vh] object-contain"
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
