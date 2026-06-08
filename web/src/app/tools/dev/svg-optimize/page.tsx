'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import {
  byteLength,
  DEFAULT_OPTIONS,
  looksLikeSvg,
  type OptimizeOptions,
  optimizeSvg,
} from '@/lib/tools/svg-optimize-core';

const TOGGLE_FIELDS: ReadonlyArray<{ key: keyof Omit<OptimizeOptions, 'precision'>; label: string }> = [
  { key: 'removeComments', label: '주석 제거' },
  { key: 'removeMetadata', label: '편집기 메타데이터 제거' },
  { key: 'collapseWhitespace', label: '불필요한 공백 제거' },
];

/** 바이트 수를 사람이 읽기 쉬운 문자열로 변환. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export default function SvgOptimizePage() {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<OptimizeOptions>({ ...DEFAULT_OPTIONS });
  const [copied, setCopied] = useState(false);

  // 큰 SVG·ReDoS 취약 정규식이 타이핑을 막지 않도록 최적화는 지연된 값 기준으로 수행한다.
  const deferredInput = useDeferredValue(input);

  const { output, error, beforeBytes, afterBytes } = useMemo(() => {
    const trimmed = deferredInput.trim();
    if (!trimmed) {
      return { output: '', error: null as string | null, beforeBytes: 0, afterBytes: 0 };
    }
    if (!looksLikeSvg(trimmed)) {
      return {
        output: '',
        error: 'SVG 콘텐츠가 아닙니다. <svg> 로 시작하는 SVG 코드를 붙여넣으세요.',
        beforeBytes: byteLength(deferredInput),
        afterBytes: 0,
      };
    }
    const optimized = optimizeSvg(deferredInput, options);
    return {
      output: optimized,
      error: null,
      beforeBytes: byteLength(deferredInput),
      afterBytes: byteLength(optimized),
    };
  }, [deferredInput, options]);

  const savedBytes = beforeBytes - afterBytes;
  const savedPercent = beforeBytes > 0 ? (savedBytes / beforeBytes) * 100 : 0;

  const toggle = (key: keyof Omit<OptimizeOptions, 'precision'>) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'optimized.svg';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setInput('');
    setOptions({ ...DEFAULT_OPTIONS });
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="SVG 최적화"
        widthClass="max-w-4xl"
        onReset={input ? handleReset : undefined}
      />
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">SVG의 불필요한 메타데이터·공백·소수점을 정리해 용량을 줄입니다.</p>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        {TOGGLE_FIELDS.map((field) => (
          <label key={field.key} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={options[field.key]}
              onChange={() => toggle(field.key)}
              className="size-4 accent-primary"
            />
            <span className="text-sm font-medium">{field.label}</span>
          </label>
        ))}
        <label className="flex items-center gap-1.5">
          <span className="text-sm font-medium">소수점 자리</span>
          <Input
            type="number"
            min={0}
            max={8}
            value={options.precision}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                precision: Math.min(8, Math.max(0, Number(e.target.value) || 0)),
              }))
            }
            className="w-16 font-mono"
            aria-label="소수점 반올림 자리수"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">입력 SVG</span>
          <textarea
            className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...>'
            aria-label="입력 SVG"
            spellCheck={false}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">최적화 결과</span>
          <textarea
            className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="결과"
            aria-label="최적화 결과"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {output && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border bg-card p-4 text-sm">
          <span>
            <span className="text-muted-foreground">전: </span>
            <span className="font-mono font-medium">{formatBytes(beforeBytes)}</span>
          </span>
          <span>
            <span className="text-muted-foreground">후: </span>
            <span className="font-mono font-medium">{formatBytes(afterBytes)}</span>
          </span>
          <span className={savedBytes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {savedBytes >= 0 ? '−' : '+'}
            {formatBytes(Math.abs(savedBytes))} ({savedPercent.toFixed(1)}%)
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" onClick={copy} disabled={!output}>
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? '복사됨' : '복사'}
        </Button>
        <Button type="button" variant="outline" onClick={download} disabled={!output}>
          <Download className="h-3.5 w-3.5" aria-hidden />
          다운로드
        </Button>
      </div>
      </main>
    </div>
  );
}
