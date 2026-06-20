'use client';

import { useMemo, useState } from 'react';
import { Film, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

type PresetKey = 'fade' | 'slide' | 'scale' | 'rotate';

interface Preset {
  label: string;
  /** 시작 프레임(0%)과 끝 프레임(100%) 의 CSS 선언 목록을 생성한다. */
  build: (from: number, to: number) => { from: string; to: string };
}

const PRESETS: Record<PresetKey, Preset> = {
  fade: {
    label: '페이드 (opacity)',
    build: (from, to) => ({
      from: `opacity: ${from};`,
      to: `opacity: ${to};`,
    }),
  },
  slide: {
    label: '슬라이드 (translateX, px)',
    build: (from, to) => ({
      from: `transform: translateX(${from}px);`,
      to: `transform: translateX(${to}px);`,
    }),
  },
  scale: {
    label: '스케일 (scale)',
    build: (from, to) => ({
      from: `transform: scale(${from});`,
      to: `transform: scale(${to});`,
    }),
  },
  rotate: {
    label: '회전 (rotate, deg)',
    build: (from, to) => ({
      from: `transform: rotate(${from}deg);`,
      to: `transform: rotate(${to}deg);`,
    }),
  },
};

const EASINGS = ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out'] as const;

const DEFAULTS = {
  name: 'my-anim',
  preset: 'fade' as PresetKey,
  from: '0',
  to: '1',
  duration: '1',
  easing: 'ease-in-out' as (typeof EASINGS)[number],
  iteration: 'infinite',
};

/** CSS 식별자로 안전한 애니메이션 이름으로 정규화한다. */
function sanitizeName(name: string): string {
  const trimmed = name.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
  return trimmed === '' ? DEFAULTS.name : trimmed;
}

interface KeyframesInput {
  name: string;
  preset: PresetKey;
  from: number;
  to: number;
  duration: number;
  easing: string;
  iteration: string;
}

function buildCss(config: KeyframesInput): string {
  const { from, to } = PRESETS[config.preset].build(config.from, config.to);
  const name = sanitizeName(config.name);
  const iteration = config.iteration.trim() === '' ? '1' : config.iteration.trim();
  return [
    `@keyframes ${name} {`,
    `  from { ${from} }`,
    `  to   { ${to} }`,
    `}`,
    ``,
    `.${name} {`,
    `  animation: ${name} ${config.duration}s ${config.easing} ${iteration};`,
    `}`,
  ].join('\n');
}

export default function CssKeyframesPage() {
  const [name, setName] = useState(DEFAULTS.name);
  const [preset, setPreset] = useState<PresetKey>(DEFAULTS.preset);
  const [from, setFrom] = useState(DEFAULTS.from);
  const [to, setTo] = useState(DEFAULTS.to);
  const [duration, setDuration] = useState(DEFAULTS.duration);
  const [easing, setEasing] = useState<(typeof EASINGS)[number]>(DEFAULTS.easing);
  const [iteration, setIteration] = useState(DEFAULTS.iteration);
  const [copied, setCopied] = useState(false);

  const fromNum = Number(from);
  const toNum = Number(to);
  const durationNum = Number(duration);
  const valid =
    Number.isFinite(fromNum) &&
    Number.isFinite(toNum) &&
    Number.isFinite(durationNum) &&
    durationNum > 0;

  const css = useMemo(() => {
    if (!valid) return '';
    return buildCss({ name, preset, from: fromNum, to: toNum, duration: durationNum, easing, iteration });
  }, [valid, name, preset, fromNum, toNum, durationNum, easing, iteration]);

  async function copy() {
    if (!css) return;
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setName(DEFAULTS.name);
    setPreset(DEFAULTS.preset);
    setFrom(DEFAULTS.from);
    setTo(DEFAULTS.to);
    setDuration(DEFAULTS.duration);
    setEasing(DEFAULTS.easing);
    setIteration(DEFAULTS.iteration);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS 키프레임 생성기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Film className="h-4 w-4 text-primary" aria-hidden />
          프리셋·시작/끝·지속시간·이징을 설정해 @keyframes 와 animation CSS 를 생성합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">애니메이션 이름</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-anim" className="font-mono" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">속성 프리셋</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as PresetKey)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              aria-label="속성 프리셋"
            >
              {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                <option key={key} value={key}>{PRESETS[key].label}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">시작 값</span>
              <Input inputMode="decimal" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="0" />
            </label>
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">끝 값</span>
              <Input inputMode="decimal" value={to} onChange={(e) => setTo(e.target.value)} placeholder="1" />
            </label>
          </div>

          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">지속시간 (초)</span>
              <Input inputMode="decimal" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1" />
            </label>
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">반복 (횟수/infinite)</span>
              <Input value={iteration} onChange={(e) => setIteration(e.target.value)} placeholder="infinite" />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">이징</span>
            <select
              value={easing}
              onChange={(e) => setEasing(e.target.value as (typeof EASINGS)[number])}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              aria-label="이징"
            >
              {EASINGS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          {!valid && (
            <p className="text-xs text-destructive">시작/끝 값과 0보다 큰 지속시간을 숫자로 입력하세요.</p>
          )}
        </div>

        {css && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">결과 CSS</span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs hover:bg-muted"
                aria-label="결과 복사"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border bg-muted/40 p-3 font-mono text-sm">
              <code>{css}</code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
