'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Spline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BEZIER_PRESETS,
  type BezierControls,
  evaluateEasing,
  toCssBezier,
} from '@/lib/tools/cubic-bezier-math';

/** SVG 좌표 공간의 한 변 크기(px). 0..1 정규값을 이 안에 매핑한다. */
const SVG_SIZE = 220;
/** 곡선이 0~1 밖으로 나가는(over/undershoot) 여유 영역(px). */
const PADDING = 50;

type HandleId = 'p1' | 'p2';

/** 정규 좌표(0~1, y는 위가 1)를 SVG 픽셀 좌표로 변환. */
function toSvgX(value: number): number {
  return PADDING + value * SVG_SIZE;
}
function toSvgY(value: number): number {
  // SVG 는 y축이 아래로 증가하므로 뒤집는다.
  return PADDING + (1 - value) * SVG_SIZE;
}
/** SVG 픽셀 좌표를 정규 좌표로 역변환. */
function fromSvgX(px: number): number {
  return (px - PADDING) / SVG_SIZE;
}
function fromSvgY(px: number): number {
  return 1 - (px - PADDING) / SVG_SIZE;
}

export default function CubicBezierPage() {
  const [controls, setControls] = useState<BezierControls>(() => ({ ...BEZIER_PRESETS[0].controls }));
  const [copied, setCopied] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<HandleId | null>(null);

  const cssValue = useMemo(() => toCssBezier(controls), [controls]);

  /** 포인터 위치를 받아 현재 드래그 중인 핸들의 정규 좌표를 갱신한다. */
  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const handle = draggingRef.current;
    const svg = svgRef.current;
    if (!handle || !svg) return;

    const rect = svg.getBoundingClientRect();
    // 뷰박스(SVG_SIZE + PADDING*2)와 화면 픽셀 사이 배율 보정.
    const scale = (SVG_SIZE + PADDING * 2) / rect.width;
    const localX = (clientX - rect.left) * scale;
    const localY = (clientY - rect.top) * scale;

    // x 는 CSS 사양상 0~1 로 제한, y 는 over/undershoot 허용(여유 영역 내).
    const x = Math.min(1, Math.max(0, fromSvgX(localX)));
    const y = fromSvgY(localY);

    setControls((prev) =>
      handle === 'p1'
        ? { ...prev, x1: x, y1: y }
        : { ...prev, x2: x, y2: y },
    );
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      event.preventDefault();
      updateFromPointer(event.clientX, event.clientY);
    };
    const onUp = () => {
      draggingRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateFromPointer]);

  // 곡선 경로(SVG path). P0=(0,0), P3=(1,1) 고정.
  const curvePath = useMemo(() => {
    const start = `M ${toSvgX(0)} ${toSvgY(0)}`;
    const curve = `C ${toSvgX(controls.x1)} ${toSvgY(controls.y1)}, ${toSvgX(controls.x2)} ${toSvgY(controls.y2)}, ${toSvgX(1)} ${toSvgY(1)}`;
    return `${start} ${curve}`;
  }, [controls]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cssValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  };

  const beginDrag = (handle: HandleId) => () => {
    draggingRef.current = handle;
  };

  // 키보드 접근: 화살표로 핸들 미세 조정.
  const nudge = (handle: HandleId, axis: 'x' | 'y', delta: number) => {
    setControls((prev) => {
      if (handle === 'p1') {
        return axis === 'x'
          ? { ...prev, x1: Math.min(1, Math.max(0, prev.x1 + delta)) }
          : { ...prev, y1: prev.y1 + delta };
      }
      return axis === 'x'
        ? { ...prev, x2: Math.min(1, Math.max(0, prev.x2 + delta)) }
        : { ...prev, y2: prev.y2 + delta };
    });
  };

  const onHandleKeyDown = (handle: HandleId) => (event: React.KeyboardEvent) => {
    const STEP = event.shiftKey ? 0.1 : 0.02;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nudge(handle, 'x', -STEP);
        break;
      case 'ArrowRight':
        event.preventDefault();
        nudge(handle, 'x', STEP);
        break;
      case 'ArrowUp':
        event.preventDefault();
        nudge(handle, 'y', STEP);
        break;
      case 'ArrowDown':
        event.preventDefault();
        nudge(handle, 'y', -STEP);
        break;
      default:
        break;
    }
  };

  // 미리보기 막대 위치를 곡선 끝점(진행률 100%) 기준으로 둔다.
  const previewEnd = evaluateEasing(controls, 1);

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Spline className="h-5 w-5 text-primary" aria-hidden />
          cubic-bezier 이징 편집기
        </h1>
        <p className="text-sm text-muted-foreground">베지어 곡선을 드래그해 CSS transition-timing-function 값을 만듭니다.</p>
      </header>

      <div className="flex flex-wrap gap-1.5 rounded-xl border bg-card p-3">
        <span className="mr-1 self-center text-sm font-medium">프리셋</span>
        {BEZIER_PRESETS.map((preset) => (
          <Button
            key={preset.name}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setControls({ ...preset.controls })}
          >
            {preset.name}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE + PADDING * 2} ${SVG_SIZE + PADDING * 2}`}
          className="mx-auto block w-full max-w-sm touch-none select-none"
          role="application"
          aria-label="cubic-bezier 곡선 편집기"
        >
          {/* 0~1 단위 영역 외곽 */}
          <rect
            x={toSvgX(0)}
            y={toSvgY(1)}
            width={SVG_SIZE}
            height={SVG_SIZE}
            className="fill-muted/30 stroke-border"
            strokeWidth={1}
          />
          {/* 대각선 기준(linear) */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(1)}
            y2={toSvgY(1)}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          {/* 제어선 */}
          <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(controls.x1)} y2={toSvgY(controls.y1)} className="stroke-primary/50" strokeWidth={1.5} />
          <line x1={toSvgX(1)} y1={toSvgY(1)} x2={toSvgX(controls.x2)} y2={toSvgY(controls.y2)} className="stroke-primary/50" strokeWidth={1.5} />
          {/* 곡선 */}
          <path d={curvePath} className="fill-none stroke-primary" strokeWidth={2.5} strokeLinecap="round" />
          {/* 핸들 P1 */}
          <circle
            cx={toSvgX(controls.x1)}
            cy={toSvgY(controls.y1)}
            r={9}
            className="cursor-grab fill-primary stroke-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            strokeWidth={2}
            tabIndex={0}
            role="slider"
            aria-label="제어점 1"
            aria-valuetext={`x ${controls.x1.toFixed(2)}, y ${controls.y1.toFixed(2)}`}
            onPointerDown={beginDrag('p1')}
            onKeyDown={onHandleKeyDown('p1')}
          />
          {/* 핸들 P2 */}
          <circle
            cx={toSvgX(controls.x2)}
            cy={toSvgY(controls.y2)}
            r={9}
            className="cursor-grab fill-primary stroke-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            strokeWidth={2}
            tabIndex={0}
            role="slider"
            aria-label="제어점 2"
            aria-valuetext={`x ${controls.x2.toFixed(2)}, y ${controls.y2.toFixed(2)}`}
            onPointerDown={beginDrag('p2')}
            onKeyDown={onHandleKeyDown('p2')}
          />
        </svg>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">미리보기 애니메이션</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setPlayKey((k) => k + 1)}>
            다시 재생
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border bg-muted/30 p-3">
          <div
            key={playKey}
            className="h-6 w-6 rounded-full bg-primary"
            style={{
              animation: `cubic-bezier-demo 1.4s ${cssValue} infinite alternate`,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">진행 100% 출력값: {previewEnd.toFixed(2)}</p>
      </div>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">CSS 값</span>
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg border bg-muted px-3 py-2 font-mono text-xs">{cssValue}</pre>
      </div>

      <style>{`@keyframes cubic-bezier-demo { from { transform: translateX(0); } to { transform: translateX(calc(100% - 1.5rem)); } }`}</style>
    </main>
  );
}
