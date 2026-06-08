'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { cleanupFiles, getFFmpeg, probeAudio, readOutput, writeFile } from '@/lib/tools/ffmpeg-common';
import { AUDIO_ACCEPT, explainFfmpegError, limitsHint, validateMediaSize } from '@/lib/tools/media-limits';

export default function FadePage() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [fadeIn, setFadeIn] = useState(2);
  const [fadeOut, setFadeOut] = useState(2);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  useEffect(() => {
    if (!file) return;
    probeAudio(file).then((p) => setDuration(p.duration)).catch(() => {});
  }, [file]);

  async function handleProcess() {
    if (!file) {
      setError('오디오 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    setResult(null);
    const ext = (file.name.split('.').pop() ?? 'mp3').toLowerCase();
    const inName = `in.${ext}`;
    const outName = `out.${ext}`;
    try {
      const ffmpeg = await getFFmpeg();
      // 진행률 리스너는 싱글턴에 누적되므로 이름 붙여 finally 에서 해제.
      const onProgress = (p: { progress: number }) =>
        setProgress(Math.round((p.progress ?? 0) * 100));
      ffmpeg.on('progress', onProgress);
      try {
        await writeFile(ffmpeg, inName, file);

        const filters: string[] = [];
        if (fadeIn > 0) filters.push(`afade=t=in:st=0:d=${fadeIn}`);
        if (fadeOut > 0 && duration > 0) filters.push(`afade=t=out:st=${Math.max(0, duration - fadeOut)}:d=${fadeOut}`);
        const filterChain = filters.join(',') || 'anull';

        await ffmpeg.exec(['-y', '-i', inName, '-af', filterChain, outName]);

        const mime = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : ext === 'ogg' ? 'audio/ogg' : `audio/${ext}`;
        const blob = await readOutput(ffmpeg, outName, mime);
        setResult({
          blobUrl: URL.createObjectURL(blob),
          filename: `${file.name.replace(/\.[^.]+$/, '')}-fade.${ext}`,
          originalSize: file.size,
          compressedSize: blob.size,
        });
        setProgress(100);
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [inName, outName]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(file ? explainFfmpegError(msg, file.size) : msg);
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setDuration(0);
    setResult(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="오디오 페이드 인/아웃" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          오디오의 시작과 끝에 부드러운 페이드 효과를 추가합니다.
        </p>

      <FileDropZone
        accept={AUDIO_ACCEPT}
        onFiles={(f) => setFile(f[0] ?? null)}
        title="오디오 드롭"
        hint={limitsHint()}
        validate={(files) => validateMediaSize(files[0])}
        onError={(m) => setError(m)}
      />
      {file && <p className="text-xs text-muted-foreground">{file.name} · {duration.toFixed(1)}s</p>}

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">페이드 인 ({fadeIn.toFixed(1)}초)</label>
          <input type="range" min={0} max={Math.min(20, duration / 2 || 20)} step={0.1} value={fadeIn} onChange={(e) => setFadeIn(Number(e.target.value))} className="w-full" aria-label="페이드 인 ( 초)" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">페이드 아웃 ({fadeOut.toFixed(1)}초)</label>
          <input type="range" min={0} max={Math.min(20, duration / 2 || 20)} step={0.1} value={fadeOut} onChange={(e) => setFadeOut(Number(e.target.value))} className="w-full" aria-label="페이드 아웃 ( 초)" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          페이드 적용
        </Button>
        {busy && <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
      </div>

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {result && <ResultCard fileName={result.filename} blobUrl={result.blobUrl} originalSize={result.originalSize} compressedSize={result.compressedSize} />}
      </main>
    </div>
  );
}
