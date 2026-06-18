'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Disc3 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 룰렛 시각 효과 중 후보를 빠르게 바꾸는 간격(ms). */
const SPIN_TICK_MS = 80;
/** 룰렛이 도는 총 시간(ms). */
const SPIN_DURATION_MS = 1600;

/** crypto 로 [0, max) 범위의 균등한 정수를 뽑는다 (모듈로 편향 제거). */
function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

export default function DecisionWheelPage() {
  const [raw, setRaw] = useState('');
  // 하이드레이션 안전: 난수는 클릭 시에만. 초기 렌더는 null(고정).
  const [result, setResult] = useState<string | null>(null);
  // 룰렛 도는 동안 보여줄 임시 후보(시각 효과 전용, 최종값 아님).
  const [spinning, setSpinning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const tickRef = useRef<number | null>(null);
  const stopRef = useRef<number | null>(null);

  // 마운트 해제 시 진행 중인 타이머 정리 (리소스 누수 방지).
  useEffect(() => {
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
      if (stopRef.current !== null) window.clearTimeout(stopRef.current);
    };
  }, []);

  const options = useMemo(
    () =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [raw],
  );

  function spin() {
    if (options.length === 0 || spinning) return;

    // 결과는 지금 결정(crypto) — 시각 효과와 무관하게 공정.
    const chosen = options[secureRandomInt(options.length)];

    setResult(null);
    setSpinning(true);

    // 시각 효과: 도는 동안 후보를 빠르게 바꿔 보여준다.
    tickRef.current = window.setInterval(() => {
      setPreview(options[secureRandomInt(options.length)]);
    }, SPIN_TICK_MS);

    stopRef.current = window.setTimeout(() => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      setPreview(null);
      setSpinning(false);
      setResult(chosen);
    }, SPIN_DURATION_MS);
  }

  function handleReset() {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (stopRef.current !== null) {
      window.clearTimeout(stopRef.current);
      stopRef.current = null;
    }
    setRaw('');
    setResult(null);
    setPreview(null);
    setSpinning(false);
  }

  async function copyResult() {
    if (result === null) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 비보안 컨텍스트·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="결정 룰렛"
        widthClass="max-w-xl"
        onReset={raw || result !== null ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          선택지를 한 줄에 하나씩 넣고 돌리면 무작위로 하나를 뽑습니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">선택지 (한 줄에 하나)</span>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={'짜장면\n짬뽕\n볶음밥'}
              rows={5}
            />
          </label>
          <p className="text-xs text-muted-foreground">{options.length}개 선택지</p>
          <Button onClick={spin} disabled={options.length === 0 || spinning}>
            <Disc3 className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} aria-hidden />
            <span className="ml-1">{spinning ? '돌리는 중…' : '돌리기'}</span>
          </Button>
        </div>

        <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-center">
          {spinning ? (
            <p className="text-2xl font-bold text-muted-foreground tabular-nums">
              {preview ?? '…'}
            </p>
          ) : result === null ? (
            <p className="text-sm text-muted-foreground">
              선택지를 넣고 돌리기를 눌러 보세요.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">결과</p>
              <p className="text-3xl font-bold text-primary">{result}</p>
              <Button variant="outline" size="sm" onClick={copyResult}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="ml-1">
                  {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
                </span>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
