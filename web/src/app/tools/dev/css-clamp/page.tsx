'use client';

import { useMemo, useState } from 'react';
import { Maximize2, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const DEFAULT_ROOT_FONT_SIZE = 16;

interface ClampInput {
  minViewport: string;
  maxViewport: string;
  minSize: string;
  maxSize: string;
  rootFontSize: string;
}

const EMPTY: ClampInput = {
  minViewport: '',
  maxViewport: '',
  minSize: '',
  maxSize: '',
  rootFontSize: String(DEFAULT_ROOT_FONT_SIZE),
};

interface ClampResult {
  css: string;
  minRem: number;
  maxRem: number;
  slopeVw: number;
  interceptRem: number;
}

/** 부동소수 잔여를 다듬어 최대 4자리까지 표시한다(불필요한 0 제거). */
function trim(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * 최소·최대 뷰포트(px)와 최소·최대 크기(px)로 반응형 clamp() 식을 계산한다.
 * 선형보간: size = slope·viewport + intercept. preferred 항은 rem 절편 + vw 기울기.
 */
function computeClamp(input: ClampInput): ClampResult | string {
  const minViewport = Number(input.minViewport.replace(/,/g, ''));
  const maxViewport = Number(input.maxViewport.replace(/,/g, ''));
  const minSize = Number(input.minSize.replace(/,/g, ''));
  const maxSize = Number(input.maxSize.replace(/,/g, ''));
  const root = Number(input.rootFontSize.replace(/,/g, ''));

  if (
    [input.minViewport, input.maxViewport, input.minSize, input.maxSize].some((v) => v.trim() === '') ||
    [minViewport, maxViewport, minSize, maxSize].some((v) => !Number.isFinite(v))
  ) {
    return '최소/최대 뷰포트와 최소/최대 크기를 모두 입력하세요.';
  }
  if (!Number.isFinite(root) || root <= 0) {
    return 'root font-size(px)는 0보다 큰 숫자여야 합니다.';
  }
  if (minViewport === maxViewport) {
    return '최소 뷰포트와 최대 뷰포트가 같으면 기울기를 계산할 수 없습니다.';
  }

  // px 기준 선형보간 → vw·rem 으로 환산.
  const slopePxPerPx = (maxSize - minSize) / (maxViewport - minViewport);
  const interceptPx = minSize - slopePxPerPx * minViewport;

  const slopeVw = trim(slopePxPerPx * 100); // 1vw = 1% of viewport width
  const interceptRem = trim(interceptPx / root);
  const minRem = trim(Math.min(minSize, maxSize) / root);
  const maxRem = trim(Math.max(minSize, maxSize) / root);

  const preferred =
    interceptRem === 0 ? `${slopeVw}vw` : `${interceptRem}rem + ${slopeVw}vw`;
  const css = `clamp(${minRem}rem, ${preferred}, ${maxRem}rem)`;

  return { css, minRem, maxRem, slopeVw, interceptRem };
}

export default function CssClampPage() {
  const [input, setInput] = useState<ClampInput>(EMPTY);
  const [copied, setCopied] = useState(false);

  const setField = <K extends keyof ClampInput>(key: K, value: ClampInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(() => computeClamp(input), [input]);
  const ok = typeof result !== 'string';

  async function copy() {
    if (!ok) return;
    try {
      await navigator.clipboard.writeText(result.css);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setInput(EMPTY);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS clamp() 생성기" widthClass="max-w-xl" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Maximize2 className="h-4 w-4 text-primary" aria-hidden />
          반응형 폰트·여백을 위한 clamp() 값을 선형보간으로 계산합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">최소 뷰포트 (px)</span>
              <Input
                inputMode="decimal"
                value={input.minViewport}
                onChange={(e) => setField('minViewport', e.target.value)}
                placeholder="예: 320"
              />
            </label>
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">최대 뷰포트 (px)</span>
              <Input
                inputMode="decimal"
                value={input.maxViewport}
                onChange={(e) => setField('maxViewport', e.target.value)}
                placeholder="예: 1280"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">최소 크기 (px)</span>
              <Input
                inputMode="decimal"
                value={input.minSize}
                onChange={(e) => setField('minSize', e.target.value)}
                placeholder="예: 16"
              />
            </label>
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">최대 크기 (px)</span>
              <Input
                inputMode="decimal"
                value={input.maxSize}
                onChange={(e) => setField('maxSize', e.target.value)}
                placeholder="예: 24"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">root font-size (px)</span>
            <Input
              inputMode="decimal"
              value={input.rootFontSize}
              onChange={(e) => setField('rootFontSize', e.target.value)}
              placeholder={String(DEFAULT_ROOT_FONT_SIZE)}
            />
          </label>
        </div>

        {ok ? (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 break-all font-mono text-base font-semibold">{result.css}</code>
              <Button variant="outline" size="sm" onClick={copy} aria-label="clamp 값 복사">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <dt className="text-xs">기울기 (slope)</dt>
                <dd className="font-mono tabular-nums text-foreground">{result.slopeVw}vw</dd>
              </div>
              <div>
                <dt className="text-xs">절편 (intercept)</dt>
                <dd className="font-mono tabular-nums text-foreground">{result.interceptRem}rem</dd>
              </div>
              <div>
                <dt className="text-xs">최소</dt>
                <dd className="font-mono tabular-nums text-foreground">{result.minRem}rem</dd>
              </div>
              <div>
                <dt className="text-xs">최대</dt>
                <dd className="font-mono tabular-nums text-foreground">{result.maxRem}rem</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{result}</p>
        )}
      </main>
    </div>
  );
}
