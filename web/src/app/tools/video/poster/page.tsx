'use client';

import { useEffect, useState } from 'react';
import { Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';

export default function PosterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [posterUrl, setPosterUrl] = useState('');
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (posterUrl) URL.revokeObjectURL(posterUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFile(f: File) {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setPosterUrl('');
  }

  async function capture() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.src = videoUrl;
      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('비디오 로드 실패'));
      });
      video.currentTime = Math.min(time, video.duration - 0.05);
      await new Promise<void>((res, rej) => {
        video.onseeked = () => res();
        video.onerror = () => rej(new Error('시각 이동 실패'));
      });
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('인코딩 실패'))), `image/${format}`, format === 'jpeg' ? quality : undefined));
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      setPosterUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '캡처 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          <h1 className="text-xl font-semibold">비디오 포스터 추출</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          비디오에서 특정 시각의 정지 화면을 캡처해 이미지로 저장합니다.
        </p>
      </header>

      <FileDropZone accept="video/*" onFiles={(f) => f[0] && handleFile(f[0])} title="비디오 드롭" />

      {videoUrl && (
        <>
          <video
            src={videoUrl}
            controls
            className="w-full rounded-md border bg-black"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          />
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <p className="text-xs">현재 시각: {time.toFixed(2)}s / {duration.toFixed(2)}s</p>
            <input type="range" min={0} max={duration} step={0.1} value={time} onChange={(e) => setTime(Number(e.target.value))} className="w-full" />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">포맷</label>
                <select value={format} onChange={(e) => setFormat(e.target.value as 'jpeg' | 'png')} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG (무손실)</option>
                </select>
              </div>
              {format === 'jpeg' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">품질 ({Math.round(quality * 100)}%)</label>
                  <input type="range" min={50} max={100} value={Math.round(quality * 100)} onChange={(e) => setQuality(Number(e.target.value) / 100)} className="w-full" />
                </div>
              )}
            </div>
            <Button onClick={capture} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              현재 시각 캡처
            </Button>
          </div>
        </>
      )}

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {posterUrl && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={posterUrl} alt="포스터" className="rounded-md border bg-card w-full" />
          <a href={posterUrl} download={`poster-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`} className={buttonVariants({ variant: 'default', className: 'w-full' })}>
            <Download className="h-4 w-4" /> 다운로드
          </a>
        </div>
      )}
    </main>
  );
}
