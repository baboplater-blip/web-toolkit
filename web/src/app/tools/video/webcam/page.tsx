'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Circle,
  Download,
  Loader2,
  RotateCcw,
  Square,
  Webcam,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

interface ResultData {
  url: string;
  size: number;
  name: string;
}

/** 브라우저가 지원하는 첫 webm mimeType 을 고른다. 없으면 빈 문자열. */
function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

/** 경과 초를 "MM:SS" 로 포맷 */
function formatElapsed(sec: number): string {
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function WebcamRecordPage() {
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const previewRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const stopTracks = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (previewRef.current) previewRef.current.srcObject = null;
  }, []);

  // 언마운트 시 카메라·마이크 트랙과 레코더를 반드시 정리
  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {
        /* 이미 멈췄으면 무시 */
      }
      stopTracks();
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, [stopTracks]);

  const startRecording = async () => {
    setError(null);
    setResult(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('이 브라우저는 웹캠 접근(getUserMedia)을 지원하지 않습니다.');
      return;
    }
    const mimeType = pickMimeType();
    if (!mimeType) {
      setError('이 브라우저는 WebM 녹화를 지원하지 않습니다.');
      return;
    }

    setStarting(true);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true; // 하울링 방지
        await previewRef.current.play().catch(() => {
          /* 자동재생 차단은 미리보기에만 영향, 녹화엔 무관 */
        });
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];
        stopTracks();
        setRecording(false);
        if (blob.size === 0) {
          setError('녹화된 데이터가 없습니다. 다시 시도해주세요.');
          return;
        }
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        setResult({ url, size: blob.size, name: `webcam-${stamp}.webm` });
      };

      recorder.start(1000); // 1초마다 청크 flush → 긴 녹화 메모리 안정
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err) {
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('카메라·마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
        } else if (err.name === 'NotFoundError') {
          setError('사용 가능한 카메라 또는 마이크를 찾지 못했습니다.');
        } else if (err.name === 'NotReadableError') {
          setError('카메라·마이크가 다른 앱에서 사용 중입니다. 해당 앱을 닫고 다시 시도해주세요.');
        } else {
          setError(err.message || '웹캠 녹화를 시작하지 못했습니다.');
        }
      } else {
        setError(err instanceof Error ? err.message : '웹캠 녹화를 시작하지 못했습니다.');
      }
    } finally {
      setStarting(false);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop(); // onstop 에서 Blob 생성 및 트랙 정리
    } else {
      stopTracks();
      setRecording(false);
    }
  };

  const reset = () => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
    setError(null);
    setElapsed(0);
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
            <Webcam className="h-5 w-5" />
            <h1 className="font-semibold text-base">웹캠 녹화</h1>
          </div>
          {result && !recording && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 space-y-4">
          {/* 녹화 중 실시간 미리보기 (muted 로 하울링 방지) */}
          <video
            ref={previewRef}
            playsInline
            muted
            className={`w-full rounded-lg max-h-[360px] bg-black ${
              recording ? '' : 'hidden'
            }`}
          />

          {recording && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 py-3 text-destructive">
              <Circle className="h-3 w-3 fill-current animate-pulse" />
              <span className="font-mono text-lg font-semibold tabular-nums">
                {formatElapsed(elapsed)}
              </span>
              <span className="text-xs">녹화 중</span>
            </div>
          )}

          {!recording ? (
            <Button onClick={startRecording} disabled={starting} className="w-full">
              {starting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  카메라 권한 대기 중
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-1.5 fill-current" />
                  녹화 시작
                </>
              )}
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="w-full">
              <Square className="h-4 w-4 mr-1.5 fill-current" />
              녹화 중지
            </Button>
          )}
        </div>

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                녹화 결과
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {formatBytes(result.size)}
              </span>
            </div>
            <video
              src={result.url}
              controls
              className="w-full rounded-lg max-h-[400px] bg-black"
            />
            <Button
              onClick={() =>
                fetch(result.url)
                  .then((r) => r.blob())
                  .then((b) => triggerDownload(b, result.name))
              }
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1.5" />
              WebM 다운로드
            </Button>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            getUserMedia 로 카메라와 마이크를 가져와 MediaRecorder 로 WebM 으로
            녹화합니다. 녹화 중 미리보기는 하울링 방지를 위해 음소거됩니다. 모든 처리는
            브라우저 안에서 이루어지며 어떤 영상도 서버로 전송되지 않습니다. 페이지를
            벗어나면 카메라·마이크는 자동으로 꺼집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
