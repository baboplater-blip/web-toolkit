'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Music, Pause, Play } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';

const MIN_BPM = 40;
const MAX_BPM = 240;

/** 한 마디의 박 수(분자). 표준 박자표를 박 수로 단순화한다. */
const TIME_SIGNATURES: ReadonlyArray<{ label: string; beats: number }> = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '6/8', beats: 6 },
];

/** 스케줄러가 미리 내다보는 시간(초). 이 만큼 앞선 박을 오디오 시계에 예약한다. */
const SCHEDULE_AHEAD_TIME = 0.1;
/** 스케줄러 호출 주기(밀리초). lookahead 보다 충분히 짧아야 박을 놓치지 않는다. */
const LOOKAHEAD_INTERVAL = 25;

/** 입력값을 허용 BPM 범위로 제한한다. */
function clampBpm(value: number): number {
  if (Number.isNaN(value)) return MIN_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}

export default function MetronomePage() {
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [playing, setPlaying] = useState(false);
  /** 마운트 후에만 활성 박을 표시해 SSR/하이드레이션 불일치를 피한다. */
  const [activeBeat, setActiveBeat] = useState(-1);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  /** 다음에 예약할 박의 오디오 시계 기준 시각(초). */
  const nextNoteTimeRef = useRef(0);
  /** 마디 안에서의 현재 박 인덱스(0 = 강박). */
  const beatIndexRef = useRef(0);

  // 최신 값을 스케줄러(클로저)에서 읽기 위한 ref 미러.
  const bpmRef = useRef(bpm);
  const beatsPerBarRef = useRef(beatsPerBar);
  // 탭 템포로 추정한 BPM 계산용 직전 탭 시각들.
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar;
  }, [beatsPerBar]);

  /** 한 박의 클릭음을 오디오 시계의 지정 시각에 예약 재생한다. 강박은 더 높고 크게. */
  const scheduleClick = useCallback((context: AudioContext, time: number, isAccent: boolean) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.frequency.value = isAccent ? 1500 : 1000;

    const peak = isAccent ? 0.6 : 0.35;
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  /** lookahead 윈도 안에 들어온 박들을 모두 예약하고, 시각적 강조를 위한 타이머를 건다. */
  const scheduler = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    while (nextNoteTimeRef.current < context.currentTime + SCHEDULE_AHEAD_TIME) {
      const beat = beatIndexRef.current;
      const noteTime = nextNoteTimeRef.current;
      scheduleClick(context, noteTime, beat === 0);

      // 오디오 예약 시각에 맞춰 시각 강조를 동기화(setTimeout 은 표시용일 뿐 타이밍 기준 아님).
      const delayMs = Math.max(0, (noteTime - context.currentTime) * 1000);
      window.setTimeout(() => setActiveBeat(beat), delayMs);

      const secondsPerBeat = 60 / clampBpm(bpmRef.current);
      nextNoteTimeRef.current += secondsPerBeat;
      beatIndexRef.current = (beat + 1) % Math.max(1, beatsPerBarRef.current);
    }
  }, [scheduleClick]);

  /** 모든 타이머를 정지하고 시각 상태를 초기화한다(오디오 컨텍스트는 재사용 위해 유지). */
  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
    setActiveBeat(-1);
  }, []);

  /** 사용자 제스처에서 호출 — AudioContext 를 생성/resume 하고 스케줄러 루프를 시작한다. */
  const start = useCallback(async () => {
    let context = audioContextRef.current;
    if (!context) {
      const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        console.error('Web Audio API is not supported');
        return;
      }
      context = new Ctor();
      audioContextRef.current = context;
    }
    // 자동재생 정책으로 suspended 상태일 수 있어 제스처 안에서 resume.
    if (context.state === 'suspended') {
      await context.resume();
    }

    beatIndexRef.current = 0;
    nextNoteTimeRef.current = context.currentTime + 0.05;
    setPlaying(true);
    timerRef.current = window.setInterval(scheduler, LOOKAHEAD_INTERVAL);
  }, [scheduler]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else void start();
  }, [playing, start, stop]);

  /** 탭 간격의 평균으로 BPM 을 추정한다(최근 4개 간격, 2초 넘으면 초기화). */
  const tapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > 5) taps.shift();
    if (taps.length < 2) return;

    let totalInterval = 0;
    for (let i = 1; i < taps.length; i += 1) {
      totalInterval += taps[i] - taps[i - 1];
    }
    const avgInterval = totalInterval / (taps.length - 1);
    setBpm(clampBpm(60000 / avgInterval));
  }, []);

  // 언마운트 시 타이머 정리 + 오디오 컨텍스트 해제(리소스 누수 방지).
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const context = audioContextRef.current;
      if (context && context.state !== 'closed') {
        void context.close();
      }
      audioContextRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="메트로놈" />

      <main className="mx-auto max-w-xl space-y-4 p-4">
        <header className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Music className="h-5 w-5 text-primary" aria-hidden />
            메트로놈
          </h2>
          <p className="text-sm text-muted-foreground">
            BPM과 박자를 설정하면 Web Audio로 정확한 타이밍의 클릭음을 재생합니다. 시작 버튼을 누르면 소리가 켜집니다.
          </p>
        </header>

        <div className="space-y-5 rounded-xl border bg-card p-5">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">BPM</span>
              <span className="font-mono text-3xl font-bold tabular-nums">{bpm}</span>
            </div>
            <input
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={(e) => setBpm(clampBpm(Number(e.target.value)))}
              className="w-full accent-primary"
              aria-label="BPM 조절"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{MIN_BPM}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBpm((v) => clampBpm(v - 1))}
                  className="h-7 w-7 rounded-md border hover:bg-muted"
                  aria-label="BPM 1 감소"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setBpm((v) => clampBpm(v + 1))}
                  className="h-7 w-7 rounded-md border hover:bg-muted"
                  aria-label="BPM 1 증가"
                >
                  +
                </button>
              </div>
              <span>{MAX_BPM}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">박자</span>
            <div className="flex flex-wrap gap-1.5">
              {TIME_SIGNATURES.map(({ label, beats }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setBeatsPerBar(beats)}
                  className={`h-8 rounded-md border px-3 text-xs ${
                    beatsPerBar === beats
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2" aria-hidden>
            {Array.from({ length: beatsPerBar }, (_, index) => (
              <span
                key={index}
                className={`h-4 w-4 rounded-full border transition-colors ${
                  activeBeat === index
                    ? index === 0
                      ? 'border-primary bg-primary'
                      : 'border-primary bg-primary/60'
                    : 'border-border bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {playing ? (
                <>
                  <Pause className="h-4 w-4" />
                  정지
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  시작
                </>
              )}
            </button>
            <button
              type="button"
              onClick={tapTempo}
              className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-medium hover:bg-muted"
            >
              탭 템포
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          오디오는 시작 버튼을 누른 뒤에만 생성됩니다 · 모든 처리는 브라우저에서 수행됩니다.
        </p>
      </main>
    </div>
  );
}
