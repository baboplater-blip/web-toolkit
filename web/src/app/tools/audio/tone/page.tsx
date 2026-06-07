'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Loader2,
  Music,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

type Waveform = 'sine' | 'square' | 'triangle';

interface ResultData {
  blob: Blob;
  url: string;
  fileName: string;
}

const WAVEFORM_LABEL: Record<Waveform, string> = {
  sine: '사인 (sine)',
  square: '사각 (square)',
  triangle: '삼각 (triangle)',
};

const SAMPLE_RATE = 44_100;
const PREVIEW_SECONDS = 1.5;
const FADE_SECONDS = 0.005; // 클릭음 방지용 짧은 페이드

const MIN_FREQ = 20;
const MAX_FREQ = 20_000;
const MIN_DURATION = 0.1;
const MAX_DURATION = 60;

type AudioContextCtor = typeof AudioContext;

/** 표준/webkit AudioContext 생성자 조회. 미지원 시 null. */
function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * 모노 Float32 PCM 샘플을 16-bit PCM WAV(RIFF) 바이트로 인코딩한다.
 * 표준 44-byte 헤더 + little-endian signed 16-bit 샘플.
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const numChannels = 1;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  // RIFF 청크 디스크립터
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  // fmt 서브청크
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM 헤더 크기
  view.setUint16(20, 1, true); // 오디오 포맷 1 = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
  view.setUint16(32, numChannels * bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  // data 서브청크
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Float32(-1..1) → signed 16-bit
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export default function ToneGenPage() {
  const [frequency, setFrequency] = useState('440');
  const [waveform, setWaveform] = useState<Waveform>('sine');
  const [duration, setDuration] = useState('2');
  const [volume, setVolume] = useState('50');
  const [rendering, setRendering] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  // 미리듣기용 실시간 AudioContext (재사용·정리 대상)
  const previewCtxRef = useRef<AudioContext | null>(null);
  const previewStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  useEffect(() => {
    return () => {
      previewStopRef.current?.();
      if (previewCtxRef.current) {
        void previewCtxRef.current.close().catch(() => {
          /* 이미 닫힌 컨텍스트 무시 */
        });
        previewCtxRef.current = null;
      }
    };
  }, []);

  /** 입력값 검증 후 정규화된 파라미터 반환. 실패 시 에러 메시지. */
  const parseParams = (): { freq: number; dur: number; gain: number } | string => {
    const freq = Number(frequency);
    const dur = Number(duration);
    const vol = Number(volume);

    if (!Number.isFinite(freq) || freq < MIN_FREQ || freq > MAX_FREQ) {
      return `주파수는 ${MIN_FREQ}~${MAX_FREQ}Hz 사이로 입력하세요.`;
    }
    if (!Number.isFinite(dur) || dur < MIN_DURATION || dur > MAX_DURATION) {
      return `길이는 ${MIN_DURATION}~${MAX_DURATION}초 사이로 입력하세요.`;
    }
    if (!Number.isFinite(vol) || vol < 0 || vol > 100) {
      return '볼륨은 0~100 사이로 입력하세요.';
    }
    return { freq, dur, gain: vol / 100 };
  };

  /** OfflineAudioContext 로 톤을 렌더해 모노 Float32 샘플을 만든다. */
  const renderTone = async (
    freq: number,
    dur: number,
    gain: number,
  ): Promise<Float32Array> => {
    const Offline =
      window.OfflineAudioContext ??
      (window as Window & { webkitOfflineAudioContext?: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;
    if (!Offline) {
      throw new Error('이 브라우저는 오디오 렌더링(OfflineAudioContext)을 지원하지 않습니다.');
    }

    const frameCount = Math.max(1, Math.floor(dur * SAMPLE_RATE));
    const offlineCtx = new Offline(1, frameCount, SAMPLE_RATE);

    const oscillator = offlineCtx.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.value = freq;

    const gainNode = offlineCtx.createGain();
    // 시작·끝에 짧은 페이드를 적용해 클릭음을 제거한다.
    const fade = Math.min(FADE_SECONDS, dur / 2);
    const now = 0;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + fade);
    gainNode.gain.setValueAtTime(gain, Math.max(now + fade, dur - fade));
    gainNode.gain.linearRampToValueAtTime(0, dur);

    oscillator.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    oscillator.start(now);
    oscillator.stop(dur);

    const rendered = await offlineCtx.startRendering();
    return rendered.getChannelData(0).slice();
  };

  const generate = async () => {
    const parsed = parseParams();
    if (typeof parsed === 'string') {
      setError(parsed);
      return;
    }
    setError(null);
    setRendering(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const samples = await renderTone(parsed.freq, parsed.dur, parsed.gain);
      const blob = encodeWav(samples, SAMPLE_RATE);
      const fileName = `tone-${Math.round(parsed.freq)}hz-${waveform}.wav`;
      setResult({ blob, url: URL.createObjectURL(blob), fileName });
    } catch (err) {
      setError(err instanceof Error ? err.message : '톤 생성에 실패했습니다.');
    } finally {
      setRendering(false);
    }
  };

  const stopPreview = () => {
    previewStopRef.current?.();
    previewStopRef.current = null;
    setPreviewing(false);
  };

  const preview = async () => {
    if (previewing) {
      stopPreview();
      return;
    }
    const parsed = parseParams();
    if (typeof parsed === 'string') {
      setError(parsed);
      return;
    }
    setError(null);

    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      setError('이 브라우저는 오디오 재생(AudioContext)을 지원하지 않습니다.');
      return;
    }

    try {
      if (!previewCtxRef.current) {
        previewCtxRef.current = new Ctor();
      }
      const ctx = previewCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const playLength = Math.min(parsed.dur, PREVIEW_SECONDS);
      const oscillator = ctx.createOscillator();
      oscillator.type = waveform;
      oscillator.frequency.value = parsed.freq;

      const gainNode = ctx.createGain();
      const fade = Math.min(FADE_SECONDS, playLength / 2);
      const start = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(parsed.gain, start + fade);
      gainNode.gain.setValueAtTime(parsed.gain, start + Math.max(fade, playLength - fade));
      gainNode.gain.linearRampToValueAtTime(0, start + playLength);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.onended = () => {
        if (previewStopRef.current) {
          previewStopRef.current = null;
          setPreviewing(false);
        }
      };

      previewStopRef.current = () => {
        oscillator.onended = null;
        try {
          oscillator.stop();
        } catch {
          /* 이미 정지됨 */
        }
        oscillator.disconnect();
        gainNode.disconnect();
      };

      oscillator.start(start);
      oscillator.stop(start + playLength);
      setPreviewing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '미리듣기에 실패했습니다.');
      setPreviewing(false);
    }
  };

  const resetForm = () => {
    stopPreview();
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
    setFrequency('440');
    setWaveform('sine');
    setDuration('2');
    setVolume('50');
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
            <Music className="h-5 w-5" />
            <h1 className="font-semibold text-base">주파수 생성기</h1>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetForm}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            초기화
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          지정한 주파수·파형·길이의 순음(사인·사각·삼각)을 만들어 16-bit PCM WAV 로 저장합니다.
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">주파수 (Hz)</span>
              <Input
                type="number"
                min={MIN_FREQ}
                max={MAX_FREQ}
                step="1"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                aria-label="주파수 (Hz)"
                className="h-9"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">길이 (초)</span>
              <Input
                type="number"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step="0.1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                aria-label="길이 (초)"
                className="h-9"
              />
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">파형</span>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(WAVEFORM_LABEL) as Waveform[]).map((wf) => (
                <button
                  key={wf}
                  type="button"
                  onClick={() => setWaveform(wf)}
                  aria-pressed={waveform === wf}
                  className={`rounded-lg border h-10 text-xs font-medium transition ${
                    waveform === wf
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {WAVEFORM_LABEL[wf]}
                </button>
              ))}
            </div>
          </div>

          <label className="space-y-1 block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">볼륨</span>
              <span className="text-xs text-muted-foreground">{volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              aria-label="볼륨"
              className="w-full accent-primary"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={preview} disabled={rendering}>
              <Play className="h-4 w-4" />
              {previewing ? '미리듣기 중지' : '미리듣기'}
            </Button>
            <Button onClick={generate} disabled={rendering}>
              {rendering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Music className="h-4 w-4" />
                  WAV 생성
                </>
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과
            </h2>
            <audio src={result.url} controls className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              크기: {formatBytes(result.blob.size)}
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
            Web Audio 의 OfflineAudioContext 로 순음을 렌더한 뒤 16-bit PCM WAV 로 직접
            인코딩합니다. 미리듣기는 {PREVIEW_SECONDS}초까지 재생합니다. 청력 보호를 위해 볼륨을
            낮춘 상태로 먼저 들어보세요. 모든 처리는 브라우저 안에서 이루어집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
