'use client';

import { useState } from 'react';
import { Loader2, Music } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { cleanupFiles, getFFmpeg, readOutput, writeFile } from '@/lib/tools/ffmpeg-common';
import { explainFfmpegError, limitsHint, validateMediaSize } from '@/lib/tools/media-limits';

type Mode = 'replace' | 'mix';

export default function AudioReplacePage() {
  const [video, setVideo] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('replace');
  const [audioGain, setAudioGain] = useState(0);
  const [origGain, setOrigGain] = useState(0);
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
    if (!video || !audio) {
      setError('비디오와 오디오 모두 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    setResult(null);
    try {
      const ffmpeg = await getFFmpeg();
      ffmpeg.on('progress', (p) => setProgress(Math.round((p.progress ?? 0) * 100)));

      await writeFile(ffmpeg, 'video.bin', video);
      await writeFile(ffmpeg, 'audio.bin', audio);

      let args: string[];
      if (mode === 'replace') {
        args = [
          '-y',
          '-i', 'video.bin',
          '-i', 'audio.bin',
          '-map', '0:v',
          '-map', '1:a',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          'out.mp4',
        ];
      } else {
        // 믹스 — amix 필터
        const filter = `[0:a]volume=${dbToLinear(origGain)}[a0];[1:a]volume=${dbToLinear(audioGain)}[a1];[a0][a1]amix=inputs=2:duration=longest`;
        args = [
          '-y',
          '-i', 'video.bin',
          '-i', 'audio.bin',
          '-filter_complex', filter,
          '-map', '0:v',
          '-c:v', 'copy',
          '-c:a', 'aac',
          'out.mp4',
        ];
      }

      await ffmpeg.exec(args);
      const blob = await readOutput(ffmpeg, 'out.mp4', 'video/mp4');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${video.name.replace(/\.[^.]+$/, '')}-audio.mp4`,
        originalSize: video.size + audio.size,
        compressedSize: blob.size,
      });
      setProgress(100);
      await cleanupFiles(ffmpeg, ['video.bin', 'audio.bin', 'out.mp4']);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(video ? explainFfmpegError(msg, video.size) : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          <h1 className="text-xl font-semibold">비디오 오디오 교체</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          영상의 오디오를 다른 음원으로 교체하거나 두 트랙을 믹스합니다.
        </p>
      </header>

      <section className="space-y-2">
        <p className="text-xs font-semibold">1. 비디오</p>
        <FileDropZone
          accept="video/*,.mp4,.mov,.webm,.mkv,.avi"
          onFiles={(f) => setVideo(f[0] ?? null)}
          title="비디오 드롭"
          hint={limitsHint()}
          validate={(files) => validateMediaSize(files[0])}
          onError={(m) => setError(m)}
        />
        {video && <p className="text-xs text-muted-foreground truncate">{video.name}</p>}
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold">2. 새 오디오</p>
        <FileDropZone
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          onFiles={(f) => setAudio(f[0] ?? null)}
          title="오디오 드롭"
          hint={limitsHint()}
          validate={(files) => validateMediaSize(files[0])}
          onError={(m) => setError(m)}
        />
        {audio && <p className="text-xs text-muted-foreground truncate">{audio.name}</p>}
      </section>

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <p className="text-xs font-medium">모드</p>
        <div className="flex flex-wrap gap-2">
          <Button variant={mode === 'replace' ? 'default' : 'outline'} size="sm" onClick={() => setMode('replace')}>교체 (원본 오디오 제거)</Button>
          <Button variant={mode === 'mix' ? 'default' : 'outline'} size="sm" onClick={() => setMode('mix')}>믹스 (둘 다 사용)</Button>
        </div>
        {mode === 'mix' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-xs">원본 게인 ({origGain} dB)</label>
              <input type="range" min={-30} max={20} value={origGain} onChange={(e) => setOrigGain(Number(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-1">
              <label className="text-xs">새 오디오 게인 ({audioGain} dB)</label>
              <input type="range" min={-30} max={20} value={audioGain} onChange={(e) => setAudioGain(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !video || !audio}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          처리
        </Button>
        {busy && <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
      </div>

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {result && <ResultCard fileName={result.filename} blobUrl={result.blobUrl} originalSize={result.originalSize} compressedSize={result.compressedSize} />}
    </main>
  );
}

function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}
