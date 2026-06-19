'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

// 흔한 영어 단어 모음 (~240개). 생성 풀로만 쓰이며 렌더에는 영향 없다.
const WORDS: readonly string[] = [
  'apple', 'banana', 'orange', 'grape', 'lemon', 'cherry', 'peach', 'melon', 'berry', 'mango',
  'river', 'mountain', 'forest', 'desert', 'ocean', 'island', 'valley', 'meadow', 'canyon', 'glacier',
  'happy', 'brave', 'calm', 'eager', 'gentle', 'honest', 'jolly', 'kind', 'lively', 'merry',
  'silent', 'swift', 'bright', 'clever', 'humble', 'loyal', 'mighty', 'noble', 'proud', 'quiet',
  'table', 'chair', 'window', 'mirror', 'candle', 'pillow', 'basket', 'kettle', 'ladder', 'anchor',
  'tiger', 'eagle', 'dolphin', 'rabbit', 'falcon', 'panda', 'otter', 'badger', 'beaver', 'cobra',
  'planet', 'comet', 'meteor', 'galaxy', 'nebula', 'orbit', 'cosmos', 'shuttle', 'rocket', 'satellite',
  'guitar', 'violin', 'piano', 'trumpet', 'drum', 'flute', 'cello', 'harp', 'banjo', 'organ',
  'autumn', 'winter', 'summer', 'spring', 'season', 'weather', 'thunder', 'lightning', 'rainbow', 'breeze',
  'castle', 'bridge', 'tower', 'palace', 'temple', 'cottage', 'cabin', 'fortress', 'harbor', 'lantern',
  'copper', 'silver', 'golden', 'marble', 'crystal', 'amber', 'pearl', 'diamond', 'emerald', 'ruby',
  'coffee', 'butter', 'honey', 'pepper', 'ginger', 'cinnamon', 'vanilla', 'almond', 'walnut', 'cocoa',
  'pencil', 'paper', 'eraser', 'ruler', 'marker', 'folder', 'binder', 'stapler', 'notebook', 'crayon',
  'garden', 'flower', 'blossom', 'petal', 'sprout', 'orchard', 'meadow', 'thicket', 'hedge', 'vine',
  'whisper', 'shadow', 'echo', 'flame', 'spark', 'frost', 'mist', 'glow', 'shimmer', 'twilight',
  'journey', 'voyage', 'venture', 'quest', 'wander', 'explore', 'discover', 'arrive', 'depart', 'travel',
  'cookie', 'muffin', 'waffle', 'pretzel', 'biscuit', 'cracker', 'pudding', 'custard', 'caramel', 'toffee',
  'meadow', 'pasture', 'prairie', 'savanna', 'jungle', 'tundra', 'lagoon', 'marsh', 'swamp', 'delta',
  'compass', 'map', 'beacon', 'signal', 'banner', 'emblem', 'symbol', 'token', 'badge', 'crest',
  'velvet', 'cotton', 'linen', 'denim', 'wool', 'satin', 'leather', 'canvas', 'fabric', 'thread',
  'puzzle', 'riddle', 'mystery', 'secret', 'legend', 'fable', 'myth', 'story', 'chronicle', 'saga',
  'harvest', 'orchard', 'meadow', 'bushel', 'sickle', 'plough', 'scythe', 'granary', 'silo', 'barn',
  'lantern', 'beacon', 'candle', 'torch', 'ember', 'cinder', 'glimmer', 'radiance', 'luster', 'beam',
  'pebble', 'boulder', 'gravel', 'cobble', 'quartz', 'granite', 'basalt', 'slate', 'flint', 'chalk',
];

/**
 * crypto.getRandomValues 거부 표집으로 [0, max) 범위의 균등 난수를 반환한다.
 * 모듈로 편향을 피하기 위해 32비트 범위에서 max 의 배수 경계를 넘는 값은 버린다.
 */
function randomIndex(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

/** 중복 허용: 매번 독립적으로 단어를 뽑는다. */
function pickWithRepeats(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(WORDS[randomIndex(WORDS.length)]);
  }
  return result;
}

/** 중복 없이: Fisher–Yates 부분 셔플로 앞에서 count 개를 뽑는다. */
function pickUnique(count: number): string[] {
  const pool = WORDS.slice();
  const take = Math.min(count, pool.length);
  for (let i = 0; i < take; i += 1) {
    const j = i + randomIndex(pool.length - i);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, take);
}

const MIN_COUNT = 1;
const MAX_COUNT = 100;

export default function RandomWordsPage() {
  const [count, setCount] = useState(5);
  const [unique, setUnique] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => words.join(' '), [words]);

  function generate() {
    const safeCount = Math.min(Math.max(Math.trunc(count) || MIN_COUNT, MIN_COUNT), MAX_COUNT);
    setWords(unique ? pickUnique(safeCount) : pickWithRepeats(safeCount));
    setCopied(false);
  }

  function reset() {
    setWords([]);
    setCount(5);
    setUnique(false);
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'random-words.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="랜덤 단어 생성기" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          무작위 영어 단어를 원하는 개수만큼 생성합니다 (암호학적 난수 사용).
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            개수
            <input
              type="number"
              min={MIN_COUNT}
              max={MAX_COUNT}
              className="w-24 rounded-lg border bg-background px-2 py-1 text-sm"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              aria-label="생성할 단어 개수"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={unique}
              onChange={(e) => setUnique(e.target.checked)}
            />
            중복 없이
          </label>
          <Button onClick={generate}>생성</Button>
        </div>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="생성 버튼을 누르면 단어가 여기에 표시됩니다"
          aria-label="결과"
        />

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!output}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
