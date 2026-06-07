'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Mic,
  RotateCcw,
  Square,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

interface ResultData {
  blob: Blob;
  url: string;
  fileName: string;
  ext: string;
}

// 선호 순서대로 시도 — 브라우저가 지원하는 첫 MIME 사용.
const MIME_CANDIDATES: { mimeType: string; ext: string }[] = [
  { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
  { mimeType: 'audio/webm', ext: 'webm' },
  { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg' },
  { mimeType: 'audio/ogg', ext: 'ogg' },
];

/** 브라우저가 지원하는 첫 녹음 MIME 후보 반환. 없으면 null. */
function pickMimeType(): { mimeType: string; ext: string } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const candidate of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
      return candidate;
    }
  }
  return null;
}

/** 초를 "MM:SS" 로 포맷 */
function formatElapsed(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function MicRecordPage() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const extRef = useRef<string>('webm');

  /** 마이크 트랙·타이머 등 모든 자원 정리. */
  const releaseResources = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      releaseResources();
    };
  }, [releaseResources]);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const startRecording = async () => {
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('이 브라우저는 마이크 녹음(getUserMedia)을 지원하지 않습니다.');
      return;
    }

    const picked = pickMimeType();
    if (!picked) {
      setError('이 브라우저는 오디오 녹음(MediaRecorder)을 지원하지 않습니다.');
      return;
    }
    extRef.current = picked.ext;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          setError('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 접근을 허용해주세요.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('연결된 마이크를 찾을 수 없습니다.');
        } else {
          setError(`마이크를 사용할 수 없습니다: ${err.name}`);
        }
      } else {
        setError(err instanceof Error ? err.message : '마이크 접근에 실패했습니다.');
      }
      return;
    }

    try {
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: picked.mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const ext = extRef.current;
        const blob = new Blob(chunksRef.current, { type: `audio/${ext}` });
        chunksRef.current = [];

        if (blob.size === 0) {
          setError('녹음된 오디오가 없습니다. 다시 시도해주세요.');
          setRecording(false);
          return;
        }

        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `recording-${stamp}.${ext}`,
          ext,
        });
        setRecording(false);
      };

      recorder.onerror = () => {
        setError('녹음 중 오류가 발생했습니다.');
        releaseResources();
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      releaseResources();
      setError(err instanceof Error ? err.message : '녹음을 시작할 수 없습니다.');
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop(); // onstop 에서 blob 조립·자원 정리
    }
  };

  const reset = () => {
    releaseResources();
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
    setRecording(false);
    setElapsed(0);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Mic className="h-5 w-5" />
            <h1 className="font-semibold text-base">마이크 녹음기</h1>
          </div>
          {(result || recording) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={reset}
              disabled={recording}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          마이크로 음성을 녹음해 오디오 파일로 저장합니다. 녹음은 브라우저 안에서만 이루어지며
          서버로 전송되지 않습니다.
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-card p-6 flex flex-col items-center gap-4">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full transition-colors ${
              recording ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Mic className={`h-9 w-9 ${recording ? 'animate-pulse' : ''}`} aria-hidden />
          </div>

          <p
            className="font-mono text-3xl tabular-nums"
            aria-live="polite"
            aria-label={`경과 시간 ${formatElapsed(elapsed)}`}
          >
            {formatElapsed(elapsed)}
          </p>

          {recording ? (
            <Button variant="destructive" size="lg" onClick={stopRecording} className="w-full">
              <Square className="h-4 w-4" />
              녹음 중지
            </Button>
          ) : (
            <Button size="lg" onClick={startRecording} className="w-full">
              <Mic className="h-4 w-4" />
              녹음 시작
            </Button>
          )}
        </div>

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              녹음 결과
            </h2>
            <audio src={result.url} controls className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              {result.ext.toUpperCase()} · {formatBytes(result.blob.size)}
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

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            MediaRecorder API 로 마이크 입력을 WEBM/OGG(Opus) 로 녹음합니다. 처음 녹음 시 브라우저가
            마이크 권한을 요청합니다. 페이지를 떠나면 마이크는 자동으로 해제됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
