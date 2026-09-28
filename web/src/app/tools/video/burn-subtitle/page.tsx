'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { cleanupFiles, getFFmpeg, readOutput, writeFile } from '@/lib/tools/ffmpeg-common';
import { explainFfmpegError, limitsHint, validateMediaSize, VIDEO_ACCEPT } from '@/lib/tools/media-limits';

/**
 * ffmpeg.wasm 의 libass 는 폰트 프로바이더(fontconfig)가 없어 시스템 폰트를 못 찾는다
 * → 폰트 없이 굽으면 에러 없이 "자막이 안 보이는" 영상이 나온다.
 * 한글 지원 TTF 를 받아 MEMFS 에 올리고 fontsdir 로 지정한다(폰트만 내려받음, 사용자 파일 전송 없음).
 */
const SUB_FONT_URL =
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf';
const SUB_FONT_DIR = '/tmp';
const SUB_FONT_PATH = `${SUB_FONT_DIR}/NanumGothic.ttf`;
const SUB_FONT_NAME = 'NanumGothic';
let fontBytesPromise: Promise<Uint8Array> | null = null;

function loadSubtitleFont(): Promise<Uint8Array> {
  if (!fontBytesPromise) {
    fontBytesPromise = fetch(SUB_FONT_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((b) => new Uint8Array(b))
      .catch((e) => {
        fontBytesPromise = null;
        throw new Error(
          `자막 폰트를 내려받지 못했습니다. 네트워크 연결을 확인해주세요. (${e instanceof Error ? e.message : e})`,
        );
      });
  }
  return fontBytesPromise;
}

export default function BurnSubtitlePage() {
  const [video, setVideo] = useState<File | null>(null);
  const [subtitle, setSubtitle] = useState<File | null>(null);
  const [fontSize, setFontSize] = useState(28);
  const [fontColor, setFontColor] = useState('white');
  const [outline, setOutline] = useState(true);
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
    if (!video || !subtitle) {
      setError('비디오와 자막 파일 모두 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    setResult(null);

    // 입력 확장자를 보존해 webm/mov 등도 FFmpeg 가 컨테이너를 올바로 인식하게 한다.
    const inExt = video.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inName = `in.${inExt}`;
    const subExt = subtitle.name.split('.').pop()?.toLowerCase() ?? 'srt';
    const subName = `sub.${subExt}`;
    const outName = 'out.mp4';
    let ffmpeg;
    // 진행률 리스너는 싱글턴에 누적되므로 이름 붙여 finally 에서 해제.
    const onProgress = (p: { progress: number }) =>
      setProgress(Math.round((p.progress ?? 0) * 100));
    try {
      ffmpeg = await getFFmpeg();
      ffmpeg.on('progress', onProgress);

      await writeFile(ffmpeg, inName, video);
      await writeFile(ffmpeg, subName, subtitle);
      // 폰트는 MEMFS 에 한 번만 올린다(cleanup 대상 아님 — 다음 실행에서 재사용).
      const fontBytes = await loadSubtitleFont();
      await ffmpeg.writeFile(SUB_FONT_PATH, fontBytes.slice());

      // 자막 스타일링 — force_style 파라미터 (libass)
      const colorMap: Record<string, string> = {
        white: '&H00FFFFFF',
        yellow: '&H0000FFFF',
        red: '&H000000FF',
        cyan: '&H00FFFF00',
        green: '&H0000FF00',
      };
      const primary = colorMap[fontColor] ?? '&H00FFFFFF';
      const style = `Fontsize=${fontSize},PrimaryColour=${primary},BorderStyle=${outline ? 1 : 3},Outline=${outline ? 2 : 0},Shadow=0`;

      // SRT/VTT 는 선택한 스타일을, ASS 는 파일 자체 스타일을 유지하되 폰트만 교체한다
      // (ASS 가 지정한 Arial 등은 wasm 안에 없어 아무것도 그려지지 않는다).
      const isAss = subExt === 'ass' || subExt === 'ssa';
      const forced = isAss ? `FontName=${SUB_FONT_NAME}` : `FontName=${SUB_FONT_NAME},${style}`;
      const filter = `subtitles=${subName}:fontsdir=${SUB_FONT_DIR}:force_style='${forced}'`;

      await ffmpeg.exec([
        '-y',
        '-i', inName,
        '-vf', filter,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'copy',
        outName,
      ]);

      const blob = await readOutput(ffmpeg, outName, 'video/mp4');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${video.name.replace(/\.[^.]+$/, '')}-subtitled.mp4`,
        originalSize: video.size,
        compressedSize: blob.size,
      });
      setProgress(100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(video ? explainFfmpegError(msg, video.size) : msg);
    } finally {
      // 성공·실패 무관하게 진행률 리스너 해제 + 가상 FS 잔류 파일 정리
      if (ffmpeg) {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [inName, subName, outName]);
      }
      setBusy(false);
    }
  }

  function handleReset() {
    setVideo(null);
    setSubtitle(null);
    setResult(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="비디오에 자막 굽기" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          SRT/VTT/ASS 자막을 영상 화면에 영구 결합한 MP4 를 만듭니다.
        </p>

      <section className="space-y-2">
        <p className="text-xs font-semibold">1. 비디오</p>
        <FileDropZone
          accept={VIDEO_ACCEPT}
          onFiles={(f) => setVideo(f[0] ?? null)}
          title="비디오 드롭"
          hint={limitsHint()}
          validate={(files) => validateMediaSize(files[0])}
          onError={(m) => setError(m)}
        />
        {video && <p className="text-xs text-muted-foreground truncate">{video.name}</p>}
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold">2. 자막 (SRT/VTT/ASS)</p>
        <FileDropZone accept=".srt,.vtt,.ass" onFiles={(f) => setSubtitle(f[0] ?? null)} title="자막 드롭" />
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle.name}</p>}
      </section>

      <div className="rounded-xl border bg-card p-3 grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">글자 크기</label>
          <input type="number" min={12} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="글자 크기" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">색상</label>
          <select value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
            <option value="white">흰색</option>
            <option value="yellow">노랑</option>
            <option value="cyan">하늘</option>
            <option value="green">초록</option>
            <option value="red">빨강</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-xs pt-5">
          <input type="checkbox" className="h-4 w-4" checked={outline} onChange={(e) => setOutline(e.target.checked)} />
          외곽선
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !video || !subtitle}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          자막 굽기
        </Button>
        {busy && <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
      </div>

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {result && <ResultCard fileName={result.filename} blobUrl={result.blobUrl} originalSize={result.originalSize} compressedSize={result.compressedSize} metaText="자막을 화면에 굽은 MP4" extraInfo="자막이 영상에 영구 결합된 MP4 (재생할 때 자막 트랙 토글 불가)" />}
      </main>
    </div>
  );
}
