'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Circle,
  Download,
  Loader2,
  MonitorPlay,
  RotateCcw,
  Square,
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

export default function ScreenRecordPage() {
  const [includeMic, setIncludeMic] = useState(false);
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  // 정리 대상 자원: 트랙·레코더·믹싱 컨텍스트·타이머
  const recorderRef = useRef<MediaRecorder | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const stopTracks = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    mixedStreamRef.current?.getTracks().forEach((t) => t.stop());
    displayStreamRef.current = null;
    micStreamRef.current = null;
    mixedStreamRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {
        /* 이미 닫혔으면 무시 */
      });
      audioContextRef.current = null;
    }
  }, []);

  // 언마운트 시 모든 자원 정리 (녹화 중 페이지 이탈 대비)
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

  /**
   * 화면 오디오와 마이크 오디오를 AudioContext 로 믹스해 단일 스트림을 만든다.
   * 마이크 미사용·화면 오디오 없음 등 경우의 수를 모두 처리한다.
   */
  const buildStream = useCallback(
    (display: MediaStream, mic: MediaStream | null): MediaStream => {
      const videoTrack = display.getVideoTracks()[0];
      const displayAudio = display.getAudioTracks();
      const micAudio = mic?.getAudioTracks() ?? [];

      // 믹싱이 필요 없는 경우(둘 중 하나 이하의 오디오 소스): 트랙을 그대로 합친다
      if (!mic || displayAudio.length === 0 || micAudio.length === 0) {
        const tracks: MediaStreamTrack[] = [videoTrack];
        if (displayAudio[0]) tracks.push(displayAudio[0]);
        if (micAudio[0]) tracks.push(micAudio[0]);
        return new MediaStream(tracks);
      }

      // 화면 오디오 + 마이크 둘 다 있으면 AudioContext 로 믹스
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();
      audioContext.createMediaStreamSource(display).connect(destination);
      audioContext.createMediaStreamSource(mic).connect(destination);

      const mixed = new MediaStream([videoTrack, ...destination.stream.getAudioTracks()]);
      return mixed;
    },
    [],
  );

  const startRecording = async () => {
    setError(null);
    setResult(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      setError('이 브라우저는 화면 녹화(getDisplayMedia)를 지원하지 않습니다.');
      return;
    }
    const mimeType = pickMimeType();
    if (!mimeType) {
      setError('이 브라우저는 WebM 녹화를 지원하지 않습니다.');
      return;
    }

    setStarting(true);
    let display: MediaStream | null = null;
    let mic: MediaStream | null = null;
    try {
      display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      if (includeMic) {
        try {
          mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          // 마이크 거부 시 화면만으로 진행 (치명적 아님)
          mic = null;
          setError('마이크 권한을 얻지 못해 화면 소리만 녹화합니다.');
        }
      }

      displayStreamRef.current = display;
      micStreamRef.current = mic;
      const stream = buildStream(display, mic);
      mixedStreamRef.current = stream;

      // 사용자가 브라우저 기본 "공유 중지" 버튼을 눌렀을 때 녹화도 종료
      const videoTrack = display.getVideoTracks()[0];
      videoTrack.addEventListener('ended', () => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
      });

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
        setResult({ url, size: blob.size, name: `screen-record-${stamp}.webm` });
      };

      recorder.start(1000); // 1초마다 청크 flush → 긴 녹화 메모리 안정
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err) {
      // 권한 거부·취소 등
      display?.getTracks().forEach((t) => t.stop());
      mic?.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
      micStreamRef.current = null;
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('화면 공유 권한이 거부되었습니다.');
      } else {
        setError(err instanceof Error ? err.message : '화면 녹화를 시작하지 못했습니다.');
      }
    } finally {
      setStarting(false);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop(); // onstop 에서 Blob 생성 및 정리
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
            <MonitorPlay className="h-5 w-5" />
            <h1 className="font-semibold text-base">화면 녹화</h1>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeMic}
              onChange={(e) => setIncludeMic(e.target.checked)}
              disabled={recording || starting}
              className="h-4 w-4 accent-primary"
            />
            마이크 소리 포함 (화면 소리와 함께 녹음)
          </label>

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
                  화면 선택 대기 중
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
            getDisplayMedia 로 탭·창·전체 화면을 캡처하고 MediaRecorder 로 WebM 으로
            녹화합니다. 마이크 포함을 켜면 화면 소리와 마이크를 AudioContext 로 믹스합니다.
            모든 처리는 브라우저 안에서 이루어지며 어떤 데이터도 서버로 전송되지 않습니다.
            브라우저의 &lsquo;공유 중지&rsquo; 버튼을 눌러도 녹화가 종료됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
