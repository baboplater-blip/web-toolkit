'use client';

import { useState } from 'react';
import { Loader2, VolumeX } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { cleanupFiles, getFFmpeg, readOutput, writeFile } from '@/lib/tools/ffmpeg-common';

export default function SilenceTrimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(-30);
  const [minSilenceSec, setMinSilenceSec] = useState(1.0);
  const [keepTail, setKeepTail] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('오디오/비디오 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    setResult(null);
    try {
      const ffmpeg = await getFFmpeg();
      ffmpeg.on('progress', (p) => setProgress(Math.round((p.progress ?? 0) * 100)));
      await writeFile(ffmpeg, 'in.bin', file);

      const isVideo = (file.type || '').startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(file.name);
      const ext = isVideo ? 'mp4' : (file.name.split('.').pop() ?? 'mp3').toLowerCase();
      const outName = `out.${ext === 'mp4' ? 'mp4' : ext}`;

      // silenceremove: 첫 무음 + 중간 무음 모두 제거
      const filter = `silenceremove=stop_periods=-1:stop_duration=${minSilenceSec}:stop_threshold=${threshold}dB:start_periods=1:start_duration=0:start_threshold=${threshold}dB:start_silence=${keepTail}`;

      const args = isVideo
        ? ['-y', '-i', 'in.bin', '-af', filter, '-c:v', 'copy', outName]
        : ['-y', '-i', 'in.bin', '-af', filter, outName];

      await ffmpeg.exec(args);

      const mime = isVideo ? 'video/mp4' : `audio/${ext === 'm4a' ? 'mp4' : ext}`;
      const blob = await readOutput(ffmpeg, outName, mime);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${file.name.replace(/\.[^.]+$/, '')}-trimmed.${ext}`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
      setProgress(100);
      await cleanupFiles(ffmpeg, ['in.bin', outName]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <VolumeX className="h-5 w-5" />
          <h1 className="text-xl font-semibold">무음 구간 자동 제거</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          말 없는 구간을 자동으로 잘라내 더 빠르고 깔끔한 영상/오디오를 만듭니다.
        </p>
      </header>

      <FileDropZone accept="audio/*,video/*" onFiles={(f) => setFile(f[0] ?? null)} title="오디오 또는 비디오 드롭" />

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">무음 판정 임계값 ({threshold} dB) — 낮을수록 엄격</label>
          <input type="range" min={-60} max={-10} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">최소 무음 길이 ({minSilenceSec.toFixed(1)}초)</label>
          <input type="range" min={0.2} max={5} step={0.1} value={minSilenceSec} onChange={(e) => setMinSilenceSec(Number(e.target.value))} className="w-full" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">자르고 남길 여백 ({keepTail.toFixed(2)}초)</label>
          <input type="range" min={0} max={1} step={0.05} value={keepTail} onChange={(e) => setKeepTail(Number(e.target.value))} className="w-full" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          무음 제거
        </Button>
        {busy && <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
      </div>

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {result && <ResultCard fileName={result.filename} blobUrl={result.blobUrl} originalSize={result.originalSize} compressedSize={result.compressedSize} />}
    </main>
  );
}
