'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { Check, Copy, Triangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Direction = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

const DIRECTIONS: ReadonlyArray<{ value: Direction; label: string }> = [
  { value: 'up', label: '위' },
  { value: 'down', label: '아래' },
  { value: 'left', label: '왼쪽' },
  { value: 'right', label: '오른쪽' },
  { value: 'up-left', label: '↖ 좌상' },
  { value: 'up-right', label: '↗ 우상' },
  { value: 'down-left', label: '↙ 좌하' },
  { value: 'down-right', label: '↘ 우하' },
];

const DEFAULT_SIZE = 60;
const DEFAULT_COLOR = '#3b82f6';
const TRANSPARENT = 'transparent';

/**
 * border 트릭으로 방향별 삼각형 CSS 선언 묶음을 만든다.
 * 직교 4방향: 반대편 border 만 색칠하고 양 옆 border 를 절반 크기로.
 * 대각선 4방향: 직각삼각형 — 인접한 두 border 중 하나만 색칠.
 */
function buildDeclarations(direction: Direction, size: number, color: string): Record<string, string> {
  const full = `${size}px`;
  const base: Record<string, string> = { width: '0', height: '0' };

  switch (direction) {
    case 'up':
      return {
        ...base,
        'border-left': `${full} solid ${TRANSPARENT}`,
        'border-right': `${full} solid ${TRANSPARENT}`,
        'border-bottom': `${full} solid ${color}`,
      };
    case 'down':
      return {
        ...base,
        'border-left': `${full} solid ${TRANSPARENT}`,
        'border-right': `${full} solid ${TRANSPARENT}`,
        'border-top': `${full} solid ${color}`,
      };
    case 'left':
      return {
        ...base,
        'border-top': `${full} solid ${TRANSPARENT}`,
        'border-bottom': `${full} solid ${TRANSPARENT}`,
        'border-right': `${full} solid ${color}`,
      };
    case 'right':
      return {
        ...base,
        'border-top': `${full} solid ${TRANSPARENT}`,
        'border-bottom': `${full} solid ${TRANSPARENT}`,
        'border-left': `${full} solid ${color}`,
      };
    case 'up-left':
      return { ...base, 'border-top': `${full} solid ${color}`, 'border-right': `${full} solid ${TRANSPARENT}` };
    case 'up-right':
      return { ...base, 'border-top': `${full} solid ${color}`, 'border-left': `${full} solid ${TRANSPARENT}` };
    case 'down-left':
      return { ...base, 'border-bottom': `${full} solid ${color}`, 'border-right': `${full} solid ${TRANSPARENT}` };
    case 'down-right':
      return { ...base, 'border-bottom': `${full} solid ${color}`, 'border-left': `${full} solid ${TRANSPARENT}` };
    default:
      return base;
  }
}

/** CSS 선언 객체 → React style 객체(camelCase). */
function toStyle(declarations: Record<string, string>): CSSProperties {
  const style: Record<string, string> = {};
  for (const [prop, value] of Object.entries(declarations)) {
    const camel = prop.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    style[camel] = value;
  }
  return style as CSSProperties;
}

/** CSS 선언 객체 → 보기 좋은 코드 문자열. */
function toCssText(declarations: Record<string, string>): string {
  return Object.entries(declarations)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join('\n');
}

export default function CssTrianglePage() {
  const [direction, setDirection] = useState<Direction>('up');
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [copied, setCopied] = useState(false);

  const declarations = useMemo(() => buildDeclarations(direction, size, color), [direction, size, color]);
  const previewStyle = useMemo(() => toStyle(declarations), [declarations]);
  const cssCode = useMemo(() => toCssText(declarations), [declarations]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setDirection('up');
    setSize(DEFAULT_SIZE);
    setColor(DEFAULT_COLOR);
    setCopied(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS 삼각형 생성기" widthClass="max-w-xl" onReset={handleReset} />
      <main className="mx-auto max-w-xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Triangle className="h-4 w-4 text-primary" aria-hidden />
          border 트릭으로 방향·크기·색을 지정해 삼각형 CSS를 만듭니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="space-y-1">
            <span className="text-sm font-medium">방향</span>
            <div className="grid grid-cols-4 gap-1.5">
              {DIRECTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDirection(item.value)}
                  className={`h-9 rounded-md border text-xs ${
                    direction === item.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">크기: {size}px</span>
            <input
              type="range"
              min={4}
              max={200}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="크기"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-background"
              aria-label="색상"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-28 font-mono"
              spellCheck={false}
              autoComplete="off"
              aria-label="색상 hex"
            />
          </div>
        </div>

        <div className="flex min-h-44 items-center justify-center rounded-xl border bg-muted/40 p-8">
          <div style={previewStyle} role="img" aria-label="삼각형 미리보기" />
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">CSS 코드</span>
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-muted px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all">
            {cssCode}
          </pre>
        </div>
      </main>
    </div>
  );
}
