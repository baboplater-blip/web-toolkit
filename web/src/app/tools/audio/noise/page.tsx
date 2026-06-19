'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Square, Waves } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

type NoiseColor = 'white' | 'pink' | 'brown';

interface ResultData {
  blob: Blob;
  url: string;
  fileName: string;
}

const NOISE_LABEL: Record<NoiseColor, string> = {
  white: '백색 (white)',
  pink: '핑크 (pink)',
  brown: '브라운 (brown)',
};

const NOISE_DESC: Record<NoiseColor, string> = {
  white: '모든 주파수가 균등 — 가장 밝고 쉭 소리에 가깝습니다.',
  pink: '저음이 강조돼 자연스러운 — 빗소리·바람에 가깝습니다.',
  brown: '저음이 가장 강조돼 묵직한 — 폭포·천둥에 가깝습니다.',
};

const SAMPLE_RATE = 44_100;
const DOWNLOAD_SECONDS = 10;

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
 * 한 채널 분량의 노이즈를 색상에 맞춰 채운다.
 * - white: 균등분포 −1..1 난수.
 * - pink : Paul Kellet 의 7-탭 근사 필터로 백색을 −3dB/oct 로 정형.
 * - brown: 백색을 적분(누적)해 −6dB/oct, 발산 방지로 0.98 감쇠 후 정규화.
 * 결과는 −1..1 범위로 클램프된다.
 */
function fillNoise(output: Float32Array, color: NoiseColor): void {
  if (color === 'white') {
    for (let i = 0; i < output.length; i += 1) {
      output[i] = Math.random() * 2 - 1;
    }
    return;
  }

  if (color === 'pink') {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < output.length; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const value = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      // 합산 게인(~약 ±5)을 보정해 −1..1 부근으로 맞춘다.
      output[i] = Math.max(-1, Math.min(1, value * 0.11));
    }
    return;
  }

  // brown: 백색 누적분(적분). 누설 계수로 발산을 막는다.
  let last = 0;
  for (let i = 0; i < output.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    output[i] = Math.max(-1, Math.min(1, last * 3.5));
  }
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

export default function NoiseGeneratorPage() {
  const [volume, setVolume] = useState('40');
  const [playing, setPlaying] = useState<NoiseColor | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  // 실시간 재생용 AudioContext (재사용·정리 대상).
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // 결과 ObjectURL 누수 방지.
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  // 언마운트 시 재생 중단 + AudioContext 정리.
  useEffect(() => {
    return () => {
      stopSource();
      if (ctxRef.current) {
        void ctxRef.current.close().catch(() => {
          /* 이미 닫힌 컨텍스트 무시 */
        });
        ctxRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 재생 중인 소스 노드를 정지·해제한다(컨텍스트는 재사용 위해 유지). */
  function stopSource(): void {
    const source = sourceRef.current;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        /* 이미 정지됨 */
      }
      source.disconnect();
      sourceRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
  }

  /** 1초 분량의 노이즈를 루프 재생하는 AudioBufferSourceNode 를 만든다. */
  function createNoiseSource(ctx: AudioContext, color: NoiseColor): AudioBufferSourceNode {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    fillNoise(buffer.getChannelData(0), color);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 재생 버튼: 사용자 제스처에서만 AudioContext 를 만든다(하이드레이션·자동재생 정책 안전).
  const play = async (color: NoiseColor) => {
    setError(null);

    // 같은 색을 다시 누르면 토글 정지.
    if (playing === color) {
      stop();
      return;
    }

    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      setError('이 브라우저는 오디오 재생(AudioContext)을 지원하지 않습니다.');
      return;
    }

    try {
      if (!ctxRef.current) {
        ctxRef.current = new Ctor();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 다른 색이 재생 중이면 먼저 정리.
      stopSource();

      const source = createNoiseSource(ctx, color);
      const gainNode = ctx.createGain();
      gainNode.gain.value = Number(volume) / 100;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();

      sourceRef.current = source;
      gainRef.current = gainNode;
      setPlaying(color);
    } catch (err) {
      setError(err instanceof Error ? err.message : '노이즈 재생에 실패했습니다.');
      setPlaying(null);
    }
  };

  const stop = () => {
    stopSource();
    setPlaying(null);
  };

  // 볼륨 슬라이더는 재생 중인 게인을 실시간 반영한다.
  const changeVolume = (next: string) => {
    setVolume(next);
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setValueAtTime(Number(next) / 100, ctxRef.current.currentTime);
    }
  };

  /** OfflineAudioContext 로 노이즈를 렌더해 WAV 로 저장한다. */
  const download = async (color: NoiseColor) => {
    setError(null);
    setRendering(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const frameCount = DOWNLOAD_SECONDS * SAMPLE_RATE;
      const samples = new Float32Array(frameCount);
      fillNoise(samples, color);
      const gain = Number(volume) / 100;
      if (gain !== 1) {
        for (let i = 0; i < samples.length; i += 1) samples[i] *= gain;
      }
      const blob = encodeWav(samples, SAMPLE_RATE);
      const fileName = `${color}-noise-${DOWNLOAD_SECONDS}s.wav`;
      setResult({ blob, url: URL.createObjectURL(blob), fileName });
    } catch (err) {
      setError(err instanceof Error ? err.message : '노이즈 렌더링에 실패했습니다.');
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Waves className="h-5 w-5" />
            <h1 className="font-semibold text-base">백색소음 생성기</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          백색·핑크·브라운 노이즈를 브라우저에서 직접 만들어 재생하고 10초 WAV 로 저장합니다.
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
          <div className="grid gap-2">
            {(Object.keys(NOISE_LABEL) as NoiseColor[]).map((color) => (
              <div
                key={color}
                className={`rounded-lg border p-3 space-y-2 transition ${
                  playing === color ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{NOISE_LABEL[color]}</p>
                    <p className="text-[11px] text-muted-foreground">{NOISE_DESC[color]}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant={playing === color ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => void play(color)}
                      aria-pressed={playing === color}
                    >
                      {playing === color ? (
                        <>
                          <Square className="h-4 w-4" />
                          정지
                        </>
                      ) : (
                        <>
                          <Waves className="h-4 w-4" />
                          재생
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void download(color)}
                      disabled={rendering}
                      aria-label={`${NOISE_LABEL[color]} WAV 다운로드`}
                    >
                      {rendering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      WAV
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
              onChange={(e) => changeVolume(e.target.value)}
              aria-label="볼륨"
              className="w-full accent-primary"
            />
          </label>

          {playing && (
            <Button variant="outline" className="w-full" onClick={stop}>
              <Square className="h-4 w-4" />
              재생 중지
            </Button>
          )}
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
            <Button className="w-full" onClick={() => triggerDownload(result.blob, result.fileName)}>
              <Download className="h-4 w-4" />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            노이즈는 재생 버튼을 누르는 순간(사용자 제스처)에만 Web Audio 로 생성됩니다. 다운로드는
            선택한 노이즈를 {DOWNLOAD_SECONDS}초 16-bit PCM WAV 로 인코딩합니다. 청력 보호를 위해
            볼륨을 낮춰 먼저 들어보세요. 모든 처리는 브라우저 안에서 이루어집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
