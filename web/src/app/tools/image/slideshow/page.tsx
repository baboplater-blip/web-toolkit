'use client';

import { useState } from 'react';
import { Loader2, Film, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { getFFmpeg } from '@/lib/tools/ffmpeg-common';
import { explainFfmpegError, fmtMB, getMediaLimits } from '@/lib/tools/media-limits';
import { loadBitmap } from '@/lib/tools/image-common';

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
    // getFFmpeg() 는 싱글턴이므로 progress 리스너를 매번 등록하면 누적된다.
    // 명명 핸들러로 등록하고 finally 에서 off 로 반드시 제거한다.
    let ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;
    const onProgress = (p: { progress?: number }) => {
      setProgress(30 + Math.round((p.progress ?? 0) * 60));
    };
    try {
      ffmpeg = await getFFmpeg();
      const [w, h] = resolution.split('x').map(Number);

      // 각 이미지를 목표 해상도의 PNG 로 정규화해 저장한다.
      // (PNG·JPG 를 섞거나 크기가 다른 이미지를 concat demuxer 로 넘기면 첫 코덱 외 프레임이
      //  디코딩되지 않아 1프레임짜리 영상이 나오던 문제 방지 — 비율 유지·흰 여백으로 가운데 배치)
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
      const fileNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const bmp = await loadBitmap(files[i]);
        const s = Math.min(w / bmp.width, h / bmp.height);
        const dw = Math.round(bmp.width * s);
        const dh = Math.round(bmp.height * s);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(bmp, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
        bmp.close();
        const png = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error(`${files[i].name} 이미지를 처리하지 못했습니다.`))),
            'image/png',
          ),
        );
        const name = `img${String(i).padStart(4, '0')}.png`;
        await ffmpeg.writeFile(name, new Uint8Array(await png.arrayBuffer()));
        fileNames.push(name);
        setProgress(Math.round(((i + 1) / files.length) * 30));
      }

      ffmpeg.on('progress', onProgress);

      // 이미지마다 "duration 초 × fps" 길이의 정지 영상 입력으로 만든 뒤 concat 필터로 잇는다.
      // (concat demuxer 의 마지막 항목 duration 처리 방식이 FFmpeg 버전마다 달라 길이가 어긋나는 문제 회피)
      const inputArgs: string[] = [];
      for (const n of fileNames) {
        inputArgs.push('-loop', '1', '-framerate', String(fps), '-t', String(duration), '-i', n);
      }
      const pads = fileNames.map((_, i) => `[${i}:v]`).join('');
      const code = await ffmpeg.exec([
        '-y',
        ...inputArgs,
        '-filter_complex', `${pads}concat=n=${fileNames.length}:v=1:a=0,setsar=1,format=yuv420p[v]`,
        '-map', '[v]',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-movflags', '+faststart',
        'out.mp4',
      ]);
      if (code !== 0) throw new Error(`FFmpeg 인코딩 실패 (코드 ${code})`);
      setProgress(95);

      const data = await ffmpeg.readFile('out.mp4');
      const u8 = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      const blob = new Blob([new Uint8Array(u8)], { type: 'video/mp4' });
      if (blob.size === 0) throw new Error('영상 생성에 실패했습니다. 이미지가 손상되지 않았는지 확인해주세요.');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `slideshow-${Date.now()}.mp4`,
        originalSize: files.reduce((s, f) => s + f.size, 0),
        compressedSize: blob.size,
      });
      setProgress(100);

      // cleanup
      for (const n of fileNames) await ffmpeg.deleteFile(n).catch(() => {});
      await ffmpeg.deleteFile('out.mp4').catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const totalSize = files.reduce((s, f) => s + f.size, 0);
      setError(explainFfmpegError(msg, totalSize));
    } finally {
      // 싱글턴에 남은 stale 리스너 제거(이전 setProgress 클로저가 다시 호출되는 것 방지)
      ffmpeg?.off('progress', onProgress);
      setBusy(false);
    }
  }

  function handleReset() {
    setFiles([]);
    setError(null);
    setProgress(0);
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 → 슬라이드쇼 MP4" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          여러 이미지를 일정 시간씩 보여주는 슬라이드쇼 영상을 만듭니다.
        </p>

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
          <input type="number" min={0.5} max={20} step={0.5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="장당 (초)" />
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

      {result && <ResultCard fileName={result.filename} blobUrl={result.blobUrl} originalSize={result.originalSize} compressedSize={result.compressedSize} metaText={`${files.length}장 × ${duration}초 슬라이드쇼 (MP4)`} />}
      </main>
    </div>
  );
}
