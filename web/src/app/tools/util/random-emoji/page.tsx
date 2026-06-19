'use client';

import { useState } from 'react';
import { Check, Copy, Smile } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/**
 * [0, maxExclusive) 범위의 균등한 정수를 반환한다.
 * 모듈로 편향을 피하기 위해 거부 표집(rejection sampling)을 사용한다.
 */
function secureRandomInt(maxExclusive: number): number {
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % maxExclusive;
}

interface EmojiCategory {
  id: string;
  label: string;
  emojis: readonly string[];
}

const CATEGORIES: readonly EmojiCategory[] = [
  {
    id: 'face',
    label: '얼굴',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😋', '😛', '🤪', '😜', '🤗', '🤔', '🤨', '😐', '😑', '😶', '😏', '😴', '😪',
      '😌', '😔', '😎', '🤓', '🥳', '😭', '😱', '😡', '🥺', '😬',
    ],
  },
  {
    id: 'animal',
    label: '동물',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
      '🐔', '🐧', '🐦', '🦄', '🐝', '🦋', '🐌', '🐢', '🐍', '🐙', '🦀', '🐬', '🐳', '🐠', '🦓',
    ],
  },
  {
    id: 'food',
    label: '음식',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍑', '🍍', '🥝', '🍅', '🥑', '🥦', '🌽',
      '🍞', '🧀', '🍖', '🍗', '🍔', '🍟', '🍕', '🌭', '🌮', '🍣', '🍜', '🍰', '🍩', '🍪', '☕',
    ],
  },
  {
    id: 'activity',
    label: '활동',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🎯', '🎮', '🎲',
      '🎸', '🎹', '🎺', '🎻', '🎤', '🎬', '🎨', '🚴', '🏆', '🥇',
    ],
  },
  {
    id: 'object',
    label: '사물',
    emojis: [
      '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📺', '🔋', '💡', '🔦', '📚', '✏️', '📌', '📎',
      '🔑', '🔒', '🔨', '🧲', '⏰', '🎁', '🎈', '💎', '🛒', '🧸',
    ],
  },
  {
    id: 'symbol',
    label: '기호',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '✨', '⭐', '🌟', '💥', '🔥', '🎉',
      '✅', '❌', '❓', '❗', '➕', '➖', '♻️', '🔆', '🌈', '⚡',
    ],
  },
];

export default function RandomEmojiPage() {
  const [count, setCount] = useState(5);
  const [categoryId, setCategoryId] = useState('all');
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const pool =
      categoryId === 'all'
        ? CATEGORIES.flatMap((c) => c.emojis)
        : (CATEGORIES.find((c) => c.id === categoryId)?.emojis ?? []);

    if (pool.length === 0) return;

    const safeCount = Math.min(50, Math.max(1, count));
    const result: string[] = [];
    for (let i = 0; i < safeCount; i++) {
      result.push(pool[secureRandomInt(pool.length)]);
    }
    setPicked(result);
  };

  const reset = () => {
    setPicked([]);
    setCopied(false);
  };

  const copyAll = async () => {
    if (picked.length === 0) return;
    try {
      await navigator.clipboard.writeText(picked.join(''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 접근 불가 시 무시 */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="랜덤 이모지" onReset={picked.length > 0 ? reset : undefined} />

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">무작위 이모지를 뽑아 복사합니다.</p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium">개수 (1–50)</span>
              <Input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                aria-label="개수"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium">카테고리</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                aria-label="카테고리"
              >
                <option value="all">전체</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button onClick={generate} className="w-full">
            <Smile className="mr-1.5 h-4 w-4" />
            이모지 뽑기
          </Button>
        </div>

        {picked.length > 0 && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                결과 ({picked.length}개)
              </h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyAll}>
                {copied ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    전체 복사
                  </>
                )}
              </Button>
            </div>
            <div
              className="flex flex-wrap gap-2 break-words text-4xl leading-snug"
              aria-live="polite"
            >
              {picked.map((emoji, i) => (
                <span key={i} aria-label={`이모지 ${i + 1}`}>
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            Web Crypto <code className="font-mono">crypto.getRandomValues</code> 기반 무작위 추출(중복
            허용). 모든 처리는 브라우저에서 즉시 이루어집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
