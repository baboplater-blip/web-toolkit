'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Merge,
  Music,
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
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

type OutputFormat = 'mp3' | 'wav' | 'm4a';

interface AudioItem {
  id: string;
  file: File;
}

export default function AudioMergePage() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');
  const [crossfade, setCrossfade] = useState(false);
  const [crossfadeSec, setCrossfadeSec] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(null);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const addFiles = (files: File[]) => {
    const valid = files.filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac|opus)$/i.test(f.name),
    );
    if (valid.length === 0) {
      setError('오디오 파일만 추가 가능합니다.');
      return;
    }
    setError(null);
    setItems((prev) => [
      ...prev,
      ...valid.map((f) => ({ id: `${Date.now()}-${Math.random()}`, file: f })),
    ]);
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setItems([]);
    setResult(null);
    setError(null);
  };

  const run = async () => {
    if (items.length < 2) {
      setError('2개 이상의 오디오 파일이 필요합니다.');
      return;
    }
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const inputs = items.map((it, i) => {
      const ext = it.file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
      return { name: `in${i}.${ext}`, file: it.file };
    });
    const outputName = `out.${outputFormat}`;
    const outMime = outputFormat === 'wav' ? 'audio/wav' : outputFormat === 'm4a' ? 'audio/mp4' : 'audio/mpeg';

    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress }: { progress: number }) => {
        if (Number.isFinite(progress)) {
          setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);

      try {
        setProgressText('파일 준비 중');
        for (const inp of inputs) {
          await writeFile(ffmpeg, inp.name, inp.file);
        }

        const args: string[] = [];
        for (const inp of inputs) {
          args.push('-i', inp.name);
        }

        if (crossfade && inputs.length >= 2) {
          let filter = '';
          let last = '0:a';
          for (let i = 1; i < inputs.length; i++) {
            const out = i === inputs.length - 1 ? '[outa]' : `[a${i}]`;
            filter += `[${last}][${i}:a]acrossfade=d=${crossfadeSec}:c1=tri:c2=tri${out};`;
            last = `a${i}`;
          }
          args.push('-filter_complex', filter.replace(/;$/, ''), '-map', '[outa]');
        } else {
          const filter = `${inputs.map((_, i) => `[${i}:a]`).join('')}concat=n=${inputs.length}:v=0:a=1[outa]`;
          args.push('-filter_complex', filter, '-map', '[outa]');
        }

        if (outputFormat === 'mp3') args.push('-c:a', 'libmp3lame', '-b:a', '192k');
        else if (outputFormat === 'm4a') args.push('-c:a', 'aac', '-b:a', '192k');
        else args.push('-c:a', 'pcm_s16le');

        args.push('-y', outputName);

        setProgressText('이어 붙이는 중');
        await ffmpeg.exec(args);

        const blob = await readOutput(ffmpeg, outputName, outMime);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `merged.${outputFormat}`,
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [...inputs.map((i) => i.name), outputName]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '합치기 실패');
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
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Merge className="h-5 w-5" />
            <h1 className="font-semibold text-base">오디오 합치기</h1>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-3">
        <FileDropZone
          accept="audio/*"
          multiple
          description="2개 이상의 오디오 파일을 순서대로 추가하세요"
          onFiles={addFiles}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {items.length > 0 && (
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              순서 ({items.length}개)
            </h2>
            <ul className="space-y-1.5">
              {items.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-center gap-2 rounded-lg border bg-background p-2"
                >
                  <span className="w-6 text-center text-xs font-mono text-muted-foreground">
                    {idx + 1}
                  </span>
                  <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{it.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(it.file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => move(it.id, -1)}
                    disabled={idx === 0 || processing}
                    aria-label="위로"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => move(it.id, 1)}
                    disabled={idx === items.length - 1 || processing}
                    aria-label="아래로"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => remove(it.id)}
                    disabled={processing}
                    aria-label="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <div className="rounded-xl border bg-card p-3 space-y-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                출력 형식
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['mp3', 'wav', 'm4a'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOutputFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      outputFormat === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={crossfade}
                onChange={(e) => setCrossfade(e.target.checked)}
                disabled={processing}
              />
              크로스페이드 사용 (자연스러운 전환)
              {crossfade && (
                <input
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={crossfadeSec}
                  onChange={(e) => setCrossfadeSec(Math.max(0.1, Number(e.target.value)))}
                  disabled={processing}
                  aria-label="크로스페이드 시간 (초)"
                  className="w-16 h-7 rounded border bg-background px-2 text-xs ml-auto"
                />
              )}
              {crossfade && <span className="text-[10px] text-muted-foreground">초</span>}
            </label>

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

            <Button onClick={run} disabled={processing || items.length < 2} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  합치는 중...
                </>
              ) : (
                <>
                  <Merge className="h-4 w-4" />
                  {items.length}개 오디오 합치기
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
            <audio src={result.url} controls className="w-full" />
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
