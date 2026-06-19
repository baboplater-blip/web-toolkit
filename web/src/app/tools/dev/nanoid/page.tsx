'use client';

import { useState } from 'react';
import { Check, Copy, KeyRound, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const DEFAULT_LENGTH = 21;
const DEFAULT_COUNT = 1;
const MIN_LENGTH = 1;
const MAX_LENGTH = 256;
const MIN_COUNT = 1;
const MAX_COUNT = 1000;
// nanoid 기본 URL-safe 알파벳: A-Za-z0-9 + '_' + '-' (총 64자).
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

/**
 * crypto.getRandomValues + 거부 표집(rejection sampling)으로 편향 없는 ID 1개를 만든다.
 * 알파벳 길이(64)가 256을 균등 분할하므로 사실상 거부는 없지만, 임의 길이에도 안전하도록
 * mask 보다 큰 바이트는 버린다.
 */
function generateNanoid(length: number): string {
  const alphabetSize = ALPHABET.length;
  // 알파벳 인덱스를 덮는 최소 비트마스크.
  const mask = (1 << Math.ceil(Math.log2(alphabetSize))) - 1;
  let id = '';
  while (id.length < length) {
    const need = length - id.length;
    // 거부될 바이트를 감안해 넉넉히 뽑는다.
    const buffer = new Uint8Array(Math.ceil((need * 1.6)));
    crypto.getRandomValues(buffer);
    for (let i = 0; i < buffer.length && id.length < length; i += 1) {
      const index = buffer[i] & mask;
      if (index < alphabetSize) {
        id += ALPHABET[index];
      }
    }
  }
  return id;
}

export default function NanoidGenPage() {
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [count, setCount] = useState(DEFAULT_COUNT);
  // 결정적 초기 렌더: 빈 목록으로 시작하고 "생성" 클릭 시에만 만든다(하이드레이션 안전).
  const [ids, setIds] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | 'all' | null>(null);

  const generate = () => {
    const safeLength = Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, length));
    const safeCount = Math.max(MIN_COUNT, Math.min(MAX_COUNT, count));
    setIds(Array.from({ length: safeCount }, () => generateNanoid(safeLength)));
    setCopiedIdx(null);
  };

  const copyOne = async (i: number) => {
    try {
      await navigator.clipboard.writeText(ids[i]);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(ids.join('\n'));
      setCopiedIdx('all');
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setLength(DEFAULT_LENGTH);
    setCount(DEFAULT_COUNT);
    setIds([]);
    setCopiedIdx(null);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="NanoID 생성기" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden />
          URL-safe 짧은 고유 ID를 crypto 난수로 안전하게 생성합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">길이</span>
              <Input
                type="number"
                min={MIN_LENGTH}
                max={MAX_LENGTH}
                value={length}
                onChange={(e) => setLength(Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, Number(e.target.value) || MIN_LENGTH)))}
                aria-label="길이"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">개수</span>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={count}
                onChange={(e) => setCount(Math.max(MIN_COUNT, Math.min(MAX_COUNT, Number(e.target.value) || MIN_COUNT)))}
                aria-label="개수"
              />
            </label>
          </div>
          <Button onClick={generate} className="w-full">
            <RefreshCw className="h-4 w-4" aria-hidden />
            생성
          </Button>
        </div>

        {ids.length > 0 && (
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                생성된 ID ({ids.length}개)
              </h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyAll}>
                {copiedIdx === 'all' ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
                <span className="ml-1">전체 복사</span>
              </Button>
            </div>
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {ids.map((id, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 font-mono text-xs"
                >
                  <span className="w-8 shrink-0 text-right text-muted-foreground">#{i + 1}</span>
                  <span className="flex-1 truncate">{id}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => copyOne(i)}
                    aria-label="ID 복사"
                  >
                    {copiedIdx === i ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          알파벳 A-Za-z0-9_- · crypto.getRandomValues + 거부 표집(편향 없음)
        </p>
      </main>
    </div>
  );
}
