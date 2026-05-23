'use client';

import { useState } from 'react';
import { Loader2, Film, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { getFFmpeg } from '@/lib/tools/ffmpeg-common';
import { explainFfmpegError, fmtMB, getMediaLimits } from '@/lib/tools/media-limits';

export default function SlideshowPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [duration, setDuration] = useState(2);
  const [fps, setFps] = useState(30);
  const [resolution, setResolution] = useState('1280x720');
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
    if (files.length === 0) {
      setError('이미지를 1장 이상 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    setResult(null);
    try {
      const ffmpeg = await getFFmpeg();
      const [w, h] = resolution.split('x').map(Number);

      // 각 이미지를 input 파일로 저장
      const sortedFiles = [...files];
      const fileNames: string[] = [];
      for (let i = 0; i < sortedFiles.length; i++) {
        const f = sortedFiles[i];
        const ext = (f.name.split('.').pop() ?? 'jpg').toLowerCase();
        const name = `img${String(i).padStart(4, '0')}.${ext}`;
        const buf = new Uint8Array(await f.arrayBuffer());
        await ffmpeg.writeFile(name, buf);
        fileNames.push(name);
        setProgress(Math.round(((i + 1) / files.length) * 30));
      }

      // 입력 리스트 텍스트 (concat demuxer 형식)
      const listLines = fileNames.map((n) => `file '${n}'\nduration ${duration}`);
      // 마지막 항목은 duration 없이 한 번 더
      listLines.push(`file '${fileNames[fileNames.length - 1]}'`);
      const listTxt = listLines.join('\n');
      await ffmpeg.writeFile('list.txt', new TextEncoder().encode(listTxt));

      ffmpeg.on('progress', (p) => {
        setProgress(30 + Math.round(((p.progress ?? 0) * 60)));
      });

      const filter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:white,setsar=1`;
      await ffmpeg.exec([
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-vf', filter,
        '-r', String(fps),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        'out.mp4',
      ]);
      setProgress(95);

      const data = await ffmpeg.readFile('out.mp4');
      const u8 = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      const blob = new Blob([new Uint8Array(u8)], { type: 'video/mp4' });
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `slideshow-${Date.now()}.mp4`,
        originalSize: files.reduce((s, f) => s + f.size, 0),
        compressedSize: blob.size,
      });
      setProgress(100);

      // cleanup
      for (const n of fileNames) await ffmpeg.deleteFile(n).catch(() => {});
      await ffmpeg.deleteFile('list.txt').catch(() => {});
      await ffmpeg.deleteFile('out.mp4').catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const totalSize = files.reduce((s, f) => s + f.size, 0);
      setError(explainFfmpegError(msg, totalSize));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          <h1 className="text-xl font-semibold">이미지 → 슬라이드쇼 MP4</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          여러 이미지를 일정 시간씩 보여주는 슬라이드쇼 영상을 만듭니다.
        </p>
      </header>

      <FileDropZone
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
        multiple
        onFiles={(arr) => setFiles((prev) => [...prev, ...arr])}
        title="이미지 여러 장 드롭"
        hint={(() => {
          const l = getMediaLimits();
          return l.isMobile
            ? `모바일 권장 총 ${l.softMB}MB · 한 장당 10MB 이하`
            : `데스크탑 권장 총 ${l.softMB}MB · 한 장당 30MB 이하`;
        })()}
        validate={(arr) => {
          const limits = getMediaLimits();
          const totalMB = arr.reduce((s, f) => s + f.size, 0) / 1024 / 1024;
          if (totalMB > limits.hardMB) {
            return `합산 ${totalMB.toFixed(1)}MB — 한도 ${limits.hardMB}MB 초과. 일부를 빼고 다시 시도해주세요.`;
          }
          const overSingle = arr.find((f) => f.size > (limits.isMobile ? 10 : 30) * 1024 * 1024);
          if (overSingle) {
            return `${overSingle.name} 이 ${fmtMB(overSingle.size)} 로 너무 큽니다. 이미지 리사이즈 도구로 줄여주세요.`;
          }
          return null;
        }}
        onError={(m) => setError(m)}
      />

      {files.length > 0 && (
        <ul className="rounded-xl border bg-card divide-y max-h-40 overflow-y-auto">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <span className="text-muted-foreground w-6">{i + 1}.</span>
              <span className="flex-1 truncate">{f.name}</span>
              <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border bg-card p-3 grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">장당 (초)</label>
          <input type="number" min={0.5} max={20} step={0.5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">FPS</label>
          <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
            <option value={24}>24</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">해상도</label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
            <option value="640x360">360p</option>
            <option value="1280x720">720p</option>
            <option value="1920x1080">1080p</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || files.length === 0}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          슬라이드쇼 만들기
        </Button>
        {busy && <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
      </div>

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {result && <ResultCard fileName={result.filename} blobUrl={result.blobUrl} originalSize={result.originalSize} compressedSize={result.compressedSize} extraInfo={`${files.length}장 × ${duration}초 슬라이드쇼`} />}
    </main>
  );
}
