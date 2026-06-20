'use client';

import { useEffect, useRef, useState } from 'react';
import { Headphones, Play, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const MIN_FREQ = 20;
const MAX_FREQ = 1500;
const MIN_BEAT = 0.5;
const MAX_BEAT = 40;
const FADE_SECONDS = 0.05; // 시작·정지 클릭음 방지용 짧은 페이드

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

/** 재생 중인 오디오 그래프 노드 묶음(정지 시 일괄 정리 대상). */
interface ActiveGraph {
  ctx: AudioContext;
  leftOsc: OscillatorNode;
  rightOsc: OscillatorNode;
  gain: GainNode;
}

export default function BinauralToneGenPage() {
  const [baseFreq, setBaseFreq] = useState('200');
  const [beatFreq, setBeatFreq] = useState('10');
  const [volume, setVolume] = useState('30');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const graphRef = useRef<ActiveGraph | null>(null);

  /** 재생 중인 그래프를 페이드아웃 후 정지·해제한다. */
  const stop = () => {
    const graph = graphRef.current;
    graphRef.current = null;
    setPlaying(false);
    if (!graph) return;
    const { ctx, leftOsc, rightOsc, gain } = graph;
    try {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
      leftOsc.stop(now + FADE_SECONDS);
      rightOsc.stop(now + FADE_SECONDS);
    } catch {
      /* 이미 정지된 노드 무시 */
    }
    // 페이드 종료 후 컨텍스트를 닫아 리소스를 회수한다.
    window.setTimeout(() => {
      void ctx.close().catch(() => {
        /* 이미 닫힌 컨텍스트 무시 */
      });
    }, FADE_SECONDS * 1000 + 50);
  };

  // 언마운트 시 재생 중이면 정리.
  useEffect(() => {
    return () => {
      const graph = graphRef.current;
      graphRef.current = null;
      if (graph) {
        try {
          graph.leftOsc.stop();
          graph.rightOsc.stop();
        } catch {
          /* 이미 정지됨 */
        }
        void graph.ctx.close().catch(() => {
          /* 무시 */
        });
      }
    };
  }, []);

  /** 입력값을 검증해 정규화된 파라미터를 반환. 실패 시 에러 메시지 문자열. */
  const parseParams = (): { base: number; beat: number; gain: number } | string => {
    const base = Number(baseFreq);
    const beat = Number(beatFreq);
    const vol = Number(volume);
    if (!Number.isFinite(base) || base < MIN_FREQ || base > MAX_FREQ) {
      return `기준 주파수는 ${MIN_FREQ}~${MAX_FREQ}Hz 사이로 입력하세요.`;
    }
    if (!Number.isFinite(beat) || beat < MIN_BEAT || beat > MAX_BEAT) {
      return `비트 주파수는 ${MIN_BEAT}~${MAX_BEAT}Hz 사이로 입력하세요.`;
    }
    if (!Number.isFinite(vol) || vol < 0 || vol > 100) {
      return '볼륨은 0~100 사이로 입력하세요.';
    }
    return { base, beat, gain: vol / 100 };
  };

  /** 재생 시작 — 반드시 사용자 클릭(이 핸들러) 안에서 AudioContext 를 생성한다. */
  const start = async () => {
    if (playing) {
      stop();
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
      const ctx = new Ctor();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 좌채널은 base, 우채널은 base+beat → 두 귀의 차이가 바이노럴 비트를 만든다.
      const leftOsc = ctx.createOscillator();
      leftOsc.type = 'sine';
      leftOsc.frequency.value = parsed.base;

      const rightOsc = ctx.createOscillator();
      rightOsc.type = 'sine';
      rightOsc.frequency.value = parsed.base + parsed.beat;

      // 각 오실레이터를 좌/우 채널로 패닝한다.
      const merger = ctx.createChannelMerger(2);
      leftOsc.connect(merger, 0, 0);
      rightOsc.connect(merger, 0, 1);

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      // 시작 시 0 → 목표 볼륨으로 페이드인(클릭음 방지).
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(parsed.gain, now + FADE_SECONDS);

      merger.connect(gain);
      gain.connect(ctx.destination);

      leftOsc.start(now);
      rightOsc.start(now);

      graphRef.current = { ctx, leftOsc, rightOsc, gain };
      setPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '재생에 실패했습니다.');
      setPlaying(false);
    }
  };

  // 재생 중 볼륨 슬라이더를 즉시 반영한다.
  const handleVolumeChange = (next: string) => {
    setVolume(next);
    const graph = graphRef.current;
    const vol = Number(next);
    if (graph && Number.isFinite(vol)) {
      const now = graph.ctx.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.linearRampToValueAtTime(vol / 100, now + 0.02);
    }
  };

  const handleReset = () => {
    stop();
    setBaseFreq('200');
    setBeatFreq('10');
    setVolume('30');
    setError(null);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="바이노럴 비트 생성기" widthClass="max-w-xl" onReset={handleReset} />
      <main className="mx-auto max-w-xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          좌우 귀에 미세하게 다른 주파수를 들려주는 바이노럴 비트를 Web Audio 로 실시간 생성합니다.
          효과를 느끼려면 반드시 헤드폰(이어폰)을 착용하세요. 모든 처리는 브라우저 안에서 이루어집니다.
        </p>

        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          헤드폰 착용 권장 · 청력 보호를 위해 낮은 볼륨에서 시작하세요. 광과민성·발작 이력이 있다면 사용에 주의하세요.
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">기준 주파수 (Hz)</span>
              <Input
                type="number"
                min={MIN_FREQ}
                max={MAX_FREQ}
                step="1"
                value={baseFreq}
                onChange={(e) => setBaseFreq(e.target.value)}
                aria-label="기준 주파수 (Hz)"
                className="h-9"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">비트 차이 (Hz)</span>
              <Input
                type="number"
                min={MIN_BEAT}
                max={MAX_BEAT}
                step="0.5"
                value={beatFreq}
                onChange={(e) => setBeatFreq(e.target.value)}
                aria-label="비트 차이 (Hz)"
                className="h-9"
              />
            </label>
          </div>

          <label className="block space-y-1">
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
              onChange={(e) => handleVolumeChange(e.target.value)}
              aria-label="볼륨"
              className="w-full accent-primary"
            />
          </label>

          <Button className="w-full" onClick={start} variant={playing ? 'outline' : 'default'}>
            {playing ? (
              <>
                <Square className="h-4 w-4" aria-hidden /> 정지
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden /> 재생
              </>
            )}
          </Button>

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Headphones className="h-3.5 w-3.5" aria-hidden />
            좌채널 {baseFreq || '?'}Hz · 우채널 {Number(baseFreq) + Number(beatFreq) || '?'}Hz
          </p>
        </div>
      </main>
    </div>
  );
}
