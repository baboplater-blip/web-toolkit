'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  canvasToBlob,
  detectFormatFromFile,
  drawToCanvas,
  formatExtension,
  loadImageFile,
  type ImageFormat,
  type LoadedImage,
} from '@/lib/tools/image-common';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes, compressionRatio, renameWithSuffix } from '@/lib/compress/format';

type Mode = 'pixel' | 'percent' | 'target-kb';

export default function ImageResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [mode, setMode] = useState<Mode>('pixel');
  const [targetW, setTargetW] = useState(1920);
  const [targetH, setTargetH] = useState(1080);
  const [keepRatio, setKeepRatio] = useState(true);
  const [percent, setPercent] = useState(50);
  const [targetKb, setTargetKb] = useState(200);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; w: number; h: number } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      loaded?.cleanup();
    };
  }, [loaded]);

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResult(null);
    loaded?.cleanup();
    try {
      const info = await loadImageFile(f);
      setFile(f);
      setLoaded(info);
      setTargetW(info.width);
      setTargetH(info.height);
      const fmt = detectFormatFromFile(f) ?? 'jpeg';
      setOutputFormat(fmt);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드 실패');
    }
  };

  const reset = () => {
    loaded?.cleanup();
    setFile(null);
    setLoaded(null);
    setResult(null);
    setError(null);
  };

  const ratio = loaded ? loaded.width / loaded.height : 1;

  const onWChange = (v: number) => {
    setTargetW(v);
    if (keepRatio && loaded) setTargetH(Math.max(1, Math.round(v / ratio)));
  };
  const onHChange = (v: number) => {
    setTargetH(v);
    if (keepRatio && loaded) setTargetW(Math.max(1, Math.round(v * ratio)));
  };

  const runResize = async () => {
    if (!file || !loaded) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    setProgressText('');

    try {
      let finalW: number;
      let finalH: number;

      if (mode === 'percent') {
        finalW = Math.max(1, Math.round((loaded.width * percent) / 100));
        finalH = Math.max(1, Math.round((loaded.height * percent) / 100));
      } else if (mode === 'pixel') {
        finalW = Math.max(1, targetW);
        finalH = Math.max(1, targetH);
      } else {
        // target-kb: 반복적으로 품질/크기 조정
        finalW = loaded.width;
        finalH = loaded.height;
      }

      const baseExt = formatExtension(outputFormat);
      const newName = renameWithSuffix(file.name, '-resized', baseExt);

      if (mode === 'target-kb') {
        // 이진 탐색 — 품질 조정 우선, 안 되면 크기 축소
        const targetBytes = Math.max(1, targetKb) * 1024;
        let bestBlob: Blob | null = null;
        let lo = 20;
        let hi = 95;
        let curW = loaded.width;
        let curH = loaded.height;
        for (let iter = 0; iter < 12; iter++) {
          setProgressText(`최적화 시도 ${iter + 1}/12`);
          const mid = Math.round((lo + hi) / 2);
          const canvas = drawToCanvas(loaded.element, curW, curH, outputFormat);
          const blob = await canvasToBlob(canvas, outputFormat, mid / 100);
          if (blob.size <= targetBytes) {
            bestBlob = blob;
            lo = mid + 1; // 더 높은 품질 시도
          } else {
            hi = mid - 1;
          }
          if (lo > hi) break;
        }
        // 여전히 초과면 크기 축소
        if (!bestBlob || bestBlob.size > targetBytes) {
          for (let step = 0; step < 5; step++) {
            curW = Math.max(100, Math.round(curW * 0.8));
            curH = Math.max(100, Math.round(curH * 0.8));
            setProgressText(`크기 축소 ${curW}×${curH}`);
            const canvas = drawToCanvas(loaded.element, curW, curH, outputFormat);
            const blob = await canvasToBlob(canvas, outputFormat, 0.75);
            if (blob.size <= targetBytes) {
              bestBlob = blob;
              break;
            }
            bestBlob = blob;
          }
        }
        if (!bestBlob) throw new Error('조건을 만족하는 결과를 찾지 못했습니다.');
        setResult({
          blob: bestBlob,
          fileName: newName,
          w: curW,
          h: curH,
        });
      } else {
        const canvas = drawToCanvas(loaded.element, finalW, finalH, outputFormat);
        const blob = await canvasToBlob(canvas, outputFormat, quality / 100);
        setResult({
          blob,
          fileName: newName,
          w: finalW,
          h: finalH,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '리사이즈 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  const reduction = result ? compressionRatio(file!.size, result.blob.size) : 0;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Maximize2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">이미지 리사이즈</h1>
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
            accept="image/*"
            description="JPG, PNG, WebP, AVIF 등"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && loaded && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {loaded.width}×{loaded.height}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">리사이즈 방식</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['pixel', '픽셀 지정'],
                    ['percent', '비율 %'],
                    ['target-kb', '목표 용량'],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border transition-colors ${
                      mode === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'pixel' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">가로 (px)</label>
                    <Input
                      type="number"
                      min={1}
                      value={targetW}
                      onChange={(e) => onWChange(Math.max(1, Number(e.target.value) || 1))}
                      disabled={processing}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">세로 (px)</label>
                    <Input
                      type="number"
                      min={1}
                      value={targetH}
                      onChange={(e) => onHChange(Math.max(1, Number(e.target.value) || 1))}
                      disabled={processing}
                      className="h-9"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={keepRatio}
                    onChange={(e) => setKeepRatio(e.target.checked)}
                    disabled={processing}
                  />
                  비율 유지
                </label>
              </>
            )}

            {mode === 'percent' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">축소 비율</label>
                  <span className="text-xs text-muted-foreground">
                    {percent}% → {Math.round((loaded.width * percent) / 100)}×
                    {Math.round((loaded.height * percent) / 100)}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
              </div>
            )}

            {mode === 'target-kb' && (
              <div>
                <label className="text-xs font-medium mb-1 block">목표 용량 (KB)</label>
                <Input
                  type="number"
                  min={10}
                  value={targetKb}
                  onChange={(e) => setTargetKb(Math.max(10, Number(e.target.value) || 10))}
                  disabled={processing}
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  품질·크기를 자동 조정하여 지정 용량 이하로 맞춥니다.
                </p>
              </div>
            )}

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['jpeg', 'png', 'webp', 'avif'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOutputFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border transition-colors ${
                      outputFormat === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {outputFormat !== 'png' && mode !== 'target-kb' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">품질</label>
                  <span className="text-xs text-muted-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
              </div>
            )}

            <Separator />

            <Button onClick={runResize} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '처리 중...'}
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  리사이즈 실행
                </>
              )}
            </Button>
          </div>
        )}

        {result && file && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              완료
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">원본</p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(file.size)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">출력</p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(result.blob.size)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">변화</p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    reduction > 0 ? 'text-green-500' : 'text-yellow-500'
                  }`}
                >
                  {reduction > 0 ? `-${reduction}%` : `+${-reduction}%`}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              출력 크기: {result.w}×{result.h}
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
