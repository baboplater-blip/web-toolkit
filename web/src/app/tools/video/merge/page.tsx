'use client';

import { useCallback, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  FileVideo,
  Loader2,
  Merge as MergeIcon,
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
import { explainFfmpegError, validateMediaSize, VIDEO_ACCEPT } from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';

type Mode = 'copy' | 'reencode';

interface ResultData {
  blob: Blob;
  url: string;
  size: number;
  name: string;
}

export default function VideoMergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>('reencode');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const acceptFiles = useCallback((newFiles: File[]) => {
    setError(null);
    setResult(null);
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const reset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
    setStage('');
  };

  const move = (idx: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const remove = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const run = async () => {
    if (files.length < 2) {
      setError('합칠 비디오를 2개 이상 선택해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    let inputNames: string[] = [];
    const outputName = 'merged.mp4';
    const listName = 'concat-list.txt';
    // 진행률 리스너는 싱글턴에 누적되므로 이름 붙여 finally 에서 해제.
    const onProgress = ({ progress: p }: { progress: number }) => {
      setProgress(Math.min(99, Math.round(p * 100)));
    };
    let ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

    try {
      setStage('FFmpeg 로딩');
      ffmpeg = await getFFmpeg();

      setStage('파일 준비');
      inputNames = files.map((_, i) => `in${i}.${files[i].name.split('.').pop() || 'mp4'}`);
      for (let i = 0; i < files.length; i++) {
        await writeFile(ffmpeg, inputNames[i], files[i]);
      }

      ffmpeg.on('progress', onProgress);

      setStage('합치는 중');

      let args: string[];
      if (mode === 'copy') {
        const listContent = inputNames.map((n) => `file '${n}'`).join('\n');
        await ffmpeg.writeFile(listName, new TextEncoder().encode(listContent));
        args = [
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          listName,
          '-c',
          'copy',
          '-y',
          outputName,
        ];
      } else {
        args = [];
        for (const n of inputNames) {
          args.push('-i', n);
        }
        const filterInputs = inputNames.map((_, i) => `[${i}:v][${i}:a]`).join('');
        const filter = `${filterInputs}concat=n=${inputNames.length}:v=1:a=1[outv][outa]`;
        args.push(
          '-filter_complex',
          filter,
          '-map',
          '[outv]',
          '-map',
          '[outa]',
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          '23',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-y',
          outputName,
        );
      }

      await ffmpeg.exec(args);

      const blob = await readOutput(ffmpeg, outputName, 'video/mp4');
      const url = URL.createObjectURL(blob);
      setResult({ blob, url, size: blob.size, name: outputName });
      setProgress(100);
      setStage('완료');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : '병합 실패. 코덱이 다른 파일은 "재인코딩" 모드를 사용해 보세요.';
      // 합산 용량 기준으로 메모리 부족 안내로 치환 (해당 패턴일 때만)
      const totalSize = files.reduce((s, f) => s + f.size, 0);
      setError(explainFfmpegError(msg, totalSize));
    } finally {
      // exec 실패 시에도 진행률 리스너·MEMFS 잔류 파일이 새지 않게 finally 에서 정리.
      if (ffmpeg) {
        ffmpeg.off('progress', onProgress);
        const cleanupTargets = [...inputNames, outputName];
        if (mode === 'copy') cleanupTargets.push(listName);
        await cleanupFiles(ffmpeg, cleanupTargets);
      }
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'h-8 w-8',
              })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <MergeIcon className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 합치기</h1>
          </div>
          {files.length > 0 && !busy && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!busy && (
          <FileDropZone
            accept={VIDEO_ACCEPT}
            multiple
            description="합칠 비디오를 순서대로 추가하세요"
            hint="MP4·WEBM·MOV·AVI 등. 위 → 아래 순서로 이어붙입니다."
            validate={(picked) => {
              // 추가된 파일 중 한도 초과 첫 파일을 막아 메모리 폭주 예방
              for (const f of picked) {
                const msg = validateMediaSize(f);
                if (msg) return msg;
              }
              return null;
            }}
            onError={(m) => setError(m)}
            onFiles={(picked) => acceptFiles(picked)}
          />
        )}

        {files.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                순서 ({files.length}개)
              </h2>
              <span className="text-[11px] text-muted-foreground">
                전체 {formatBytes(files.reduce((s, f) => s + f.size, 0))}
              </span>
            </div>
            <ul className="space-y-1.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border bg-background p-2"
                >
                  <span className="text-[10px] font-bold text-muted-foreground w-5 text-center">
                    {i + 1}
                  </span>
                  <FileVideo className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(f.size)}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || busy}
                      aria-label="위로"
                      title="위로"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => move(i, 1)}
                      disabled={i === files.length - 1 || busy}
                      aria-label="아래로"
                      title="아래로"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => remove(i)}
                      disabled={busy}
                      aria-label="삭제"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {files.length >= 2 && !result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              병합 방식
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <ModeButton
                active={mode === 'reencode'}
                onClick={() => setMode('reencode')}
                title="재인코딩 (안전)"
                desc="코덱·해상도 달라도 OK · H.264/AAC 통일"
              />
              <ModeButton
                active={mode === 'copy'}
                onClick={() => setMode('copy')}
                title="복사 (빠름)"
                desc="모든 파일이 같은 코덱·해상도일 때만"
              />
            </div>
            <Button onClick={run} disabled={busy} className="w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {stage} {progress}%
                </>
              ) : (
                <>
                  <MergeIcon className="h-4 w-4 mr-1.5" />
                  {files.length}개 합치기
                </>
              )}
            </Button>
            {busy && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {formatBytes(result.size)}
              </span>
            </div>
            <Separator />
            <video
              src={result.url}
              controls
              className="w-full rounded-lg max-h-[400px] bg-black"
            />
            <Button
              onClick={() => triggerDownload(result.blob, result.name)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1.5" />
              다운로드
            </Button>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1.5">
          <p>
            <strong className="text-foreground">FFmpeg.wasm</strong> 으로 브라우저 안에서
            처리. 파일이 서버로 전송되지 않습니다.
          </p>
          <p>
            첫 사용 시 FFmpeg 코어(~31MB)를 다운로드하므로 첫 합치기는 다소 느릴 수
            있습니다. 이후 같은 세션에선 즉시 동작.
          </p>
        </div>
      </main>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition ${
        active
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background hover:bg-muted'
      }`}
    >
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
    </button>
  );
}
