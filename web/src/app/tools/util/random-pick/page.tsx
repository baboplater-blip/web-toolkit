'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Dices,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

function secureRandomInt(maxExclusive: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % maxExclusive;
}

function shuffleSecure<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function RandomPickPage() {
  const [raw, setRaw] = useState('');
  const [count, setCount] = useState(1);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const items = useMemo(() => {
    return raw
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [raw]);

  const canPick =
    items.length > 0 &&
    count > 0 &&
    (allowRepeat || count <= items.length);

  const pick = () => {
    if (!canPick) return;
    const result: string[] = [];
    if (allowRepeat) {
      for (let i = 0; i < count; i++) {
        result.push(items[secureRandomInt(items.length)]);
      }
    } else {
      const shuffled = shuffleSecure(items);
      result.push(...shuffled.slice(0, count));
    }
    setPicked(result);
  };

  const reset = () => {
    setPicked([]);
  };

  const copyAll = async () => {
    if (picked.length === 0) return;
    try {
      await navigator.clipboard.writeText(picked.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'h-8 w-8',
              })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Dices className="h-5 w-5" />
            <h1 className="font-semibold text-base">추첨기</h1>
          </div>
          {picked.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div>
            <label
              className="text-xs font-medium block mb-1"
              htmlFor="rp-items"
            >
              후보 목록 (한 줄에 하나, 또는 쉼표 구분)
            </label>
            <textarea
              id="rp-items"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              placeholder={'홍길동\n김철수\n이영희\n박민수'}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono resize-y"
              spellCheck={false}
              aria-label="후보 목록"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              인식된 항목: {items.length}개
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="rp-count">
                뽑을 개수
              </label>
              <Input
                id="rp-count"
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                aria-label="뽑을 개수"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={allowRepeat}
                onChange={(e) => setAllowRepeat(e.target.checked)}
                className="h-4 w-4"
                aria-label="중복 허용"
              />
              중복 허용
            </label>
          </div>

          <Button onClick={pick} disabled={!canPick} className="w-full">
            <Shuffle className="h-4 w-4 mr-1.5" />
            추첨하기
          </Button>
          {!canPick && items.length > 0 && count > items.length && !allowRepeat && (
            <p className="text-[11px] text-destructive">
              중복 없이 뽑으려면 후보 수 이상은 불가능합니다. 중복 허용을 켜거나 개수를
              줄이세요.
            </p>
          )}
        </div>

        {picked.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과 ({picked.length}개)
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={copyAll}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    전체 복사
                  </>
                )}
              </Button>
            </div>
            <Separator />
            <ol className="space-y-1.5" aria-live="polite">
              {picked.map((item, i) => (
                <li
                  key={`${item}-${i}`}
                  className="flex items-center gap-3 rounded-lg border bg-background p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium flex-1">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            Web Crypto <code className="font-mono">crypto.getRandomValues</code> 기반의
            진짜 무작위 추첨. <code className="font-mono">Math.random</code> 보다 균등성
            높음. 모든 동작은 브라우저에서 즉시 처리되며 후보 명단은 서버로 전송되지
            않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
