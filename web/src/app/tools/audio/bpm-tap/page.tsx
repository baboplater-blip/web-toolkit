'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, RotateCcw } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** BPM 평균에 사용할 최근 탭 간격의 최대 개수(타임스탬프는 N+1개 유지). */
const MAX_INTERVALS = 8;
/** 이 시간(ms)보다 긴 공백이 생기면 박자가 끊긴 것으로 보고 시퀀스를 초기화한다. */
const RESET_GAP_MS = 3000;

export default function BpmTapPage() {
  // 결정적 초기값(0)으로 SSR/하이드레이션 불일치를 피한다. 실제 시각은
  // 사용자 탭 이벤트 핸들러 안에서만 performance.now() 로 읽는다.
  const [bpm, setBpm] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  // 최근 탭 시각(ms). 렌더에 직접 쓰지 않으므로 ref 로 관리해 불필요한 재렌더를 막는다.
  const tapTimesRef = useRef<number[]>([]);

  /** 한 번의 탭을 기록하고 최근 간격 평균으로 BPM 을 갱신한다. */
  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    // 직전 탭과의 간격이 너무 크면 새 측정으로 간주하고 시퀀스를 초기화한다.
    if (taps.length > 0 && now - taps[taps.length - 1] > RESET_GAP_MS) {
      taps.length = 0;
      setBpm(0);
    }

    taps.push(now);
    if (taps.length > MAX_INTERVALS + 1) taps.shift();
    setTapCount(taps.length);

    // 첫 탭은 간격이 없어 BPM 을 계산할 수 없다(무시).
    if (taps.length < 2) return;

    let totalInterval = 0;
    for (let i = 1; i < taps.length; i += 1) {
      totalInterval += taps[i] - taps[i - 1];
    }
    const avgInterval = totalInterval / (taps.length - 1);
    if (avgInterval > 0) {
      setBpm(Math.round(60000 / avgInterval));
    }
  }, []);

  const handleReset = useCallback(() => {
    tapTimesRef.current = [];
    setBpm(0);
    setTapCount(0);
  }, []);

  // 스페이스바로도 탭할 수 있게 한다(마운트 후 등록, 언마운트 시 정리).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space') return;
      // 버튼 포커스 상태에서 스페이스가 클릭과 중복 발화하는 것을 막는다.
      event.preventDefault();
      if (event.repeat) return;
      handleTap();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTap]);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="BPM 탭 측정기" onReset={tapCount > 0 ? handleReset : undefined} />

      <main className="mx-auto max-w-xl space-y-4 p-4">
        <header className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-5 w-5 text-primary" aria-hidden />
            BPM 탭 측정기
          </h2>
          <p className="text-sm text-muted-foreground">
            음악의 박자에 맞춰 탭 버튼을 누르거나 스페이스바를 두드리면 템포(BPM)를 계산합니다.
          </p>
        </header>

        <div className="space-y-5 rounded-xl border bg-card p-5">
          <div className="text-center">
            <p className="font-mono text-6xl font-bold tabular-nums">{bpm > 0 ? bpm : '--'}</p>
            <p className="text-xs text-muted-foreground">BPM</p>
          </div>

          <button
            type="button"
            onClick={handleTap}
            className="flex h-32 w-full items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground transition-transform active:scale-[0.98] hover:bg-primary/90"
          >
            탭
          </button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              탭 횟수 <span className="font-mono font-medium text-foreground tabular-nums">{tapCount}</span>
            </span>
            <button
              type="button"
              onClick={handleReset}
              disabled={tapCount === 0}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              리셋
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          탭 간격이 3초를 넘으면 측정이 자동으로 다시 시작됩니다 · 모든 처리는 브라우저에서 수행됩니다.
        </p>
      </main>
    </div>
  );
}
