'use client';

import { useState } from 'react';
import { Loader2, VolumeX, AlertTriangle } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { cleanupFiles, getFFmpeg, readOutput, writeFile } from '@/lib/tools/ffmpeg-common';
import {
  explainFfmpegError,
  fmtMB,
  getMediaLimits,
  isOversizedSoft,
  limitsHint,
  MEDIA_ACCEPT,
  validateMediaSize,
} from '@/lib/tools/media-limits';

export default function SilenceTrimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(-30);
  const [minSilenceSec, setMinSilenceSec] = useState(1.0);
  const [keepTail, setKeepTail] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  const oversized = file ? isOversizedSoft(file) : false;
  const limits = getMediaLimits();

  async function handleProcess() {
    if (!file) {
      setError('오디오/비디오 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    setResult(null);
    setProgressText('FFmpeg 로드 중 (최초만 ~30MB)');
    try {
      const ffmpeg = await getFFmpeg();
      setProgressText('파일 메모리 적재 중');
      ffmpeg.on('progress', (p) => {
        setProgress(Math.round((p.progress ?? 0) * 100));
        setProgressText('무음 구간 분석·제거 중');
      });
      await writeFile(ffmpeg, 'in.bin', file);

      const isVideo =
        (file.type || '').startsWith('video/') ||
        /\.(mp4|mov|webm|mkv|avi)$/i.test(file.name);
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
      setProgressText('완료');
      await cleanupFiles(ffmpeg, ['in.bin', outName]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(explainFfmpegError(msg, file.size));
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

      <FileDropZone
        accept={MEDIA_ACCEPT}
        onFiles={(f) => setFile(f[0] ?? null)}
        title="오디오 또는 비디오 드롭"
        hint={`MP3·WAV·MP4·MOV·WebM 등 · ${limitsHint()}`}
        validate={(files) => validateMediaSize(files[0])}
        onError={(m) => setError(m)}
      />

      {file && (
        <div className="rounded-xl border bg-card p-3 text-xs space-y-1">
          <p className="font-medium">{file.name}</p>
          <p className="text-muted-foreground">
            {fmtMB(file.size)}
            {oversized && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                권장 {limits.softMB}MB 초과 — 메모리 부족·느려질 수 있음
              </span>
            )}
          </p>
          {oversized && (
            <p className="text-[10px] text-muted-foreground">
              실패하면 <a href="/tools/video/trim" className="underline">비디오 자르기</a> 도구로 5~10분씩 분할 후 처리해보세요.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">무음 판정 임계값 ({threshold} dB) — 낮을수록 엄격</label>
          <input type="range" min={-60} max={-10} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" aria-label="무음 판정 임계값 ( dB) — 낮을수록 엄격" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">최소 무음 길이 ({minSilenceSec.toFixed(1)}초)</label>
          <input type="range" min={0.2} max={5} step={0.1} value={minSilenceSec} onChange={(e) => setMinSilenceSec(Number(e.target.value))} className="w-full" aria-label="최소 무음 길이 ( 초)" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">자르고 남길 여백 ({keepTail.toFixed(2)}초)</label>
          <input type="range" min={0} max={1} step={0.05} value={keepTail} onChange={(e) => setKeepTail(Number(e.target.value))} className="w-full" aria-label="자르고 남길 여백 ( 초)" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          무음 제거
        </Button>
        {busy && (
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {busy && progressText && (
        <p className="text-xs text-muted-foreground" aria-live="polite">{progressText}</p>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <ResultCard
          fileName={result.filename}
          blobUrl={result.blobUrl}
          originalSize={result.originalSize}
          compressedSize={result.compressedSize}
        />
      )}

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">알아두실 점</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>최초 사용 시 FFmpeg.wasm(~30MB) 을 한 번 다운로드합니다. 이후엔 캐시됩니다.</li>
          <li>이 기기 권장 용량: <strong>{limits.softMB}MB</strong> · 한도: <strong>{limits.hardMB}MB</strong>{limits.isMobile ? ' (모바일)' : ' (데스크탑)'}.</li>
          <li>큰 파일은 <a href="/tools/video/trim" className="underline">비디오 자르기</a> 로 5~10분씩 잘라 처리하면 안정적입니다.</li>
          <li>모든 처리는 브라우저 안에서 이뤄지고 파일은 서버로 전송되지 않습니다.</li>
        </ul>
      </div>
    </main>
  );
}
