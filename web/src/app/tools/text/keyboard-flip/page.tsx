'use client';

import { useMemo, useState } from 'react';
import { Keyboard, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { en2ko, ko2en } from '@/lib/tools/korean';

type Direction = 'en2ko' | 'ko2en' | 'auto';

export default function KeyboardFlipPage() {
  const [input, setInput] = useState('dkssudgktpdy');
  const [direction, setDirection] = useState<Direction>('auto');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input) return '';
    if (direction === 'en2ko') return en2ko(input);
    if (direction === 'ko2en') return ko2en(input);
    // auto detect — 한글 비중이 높으면 ko2en, 아니면 en2ko
    const total = input.length;
    let ko = 0;
    for (const c of input) {
      const code = c.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) ko++;
    }
    if (ko / total > 0.3) return ko2en(input);
    return en2ko(input);
  }, [input, direction]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          <h1 className="text-xl font-semibold">한영 자판 변환</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          한영키를 잘못 누르고 입력한 글을 바로 잡습니다. dkssudgktpdy → 안녕하세요.
        </p>
      </header>

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <p className="text-xs font-medium">변환 방향</p>
        <div className="flex flex-wrap gap-2">
          <Button variant={direction === 'auto' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('auto')}>자동</Button>
          <Button variant={direction === 'en2ko' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('en2ko')}>영문 → 한글</Button>
          <Button variant={direction === 'ko2en' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('ko2en')}>한글 → 영문</Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">입력</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-sm h-32 leading-relaxed font-mono"
          placeholder="잘못된 한/영 키로 입력된 글을 붙여넣으세요." aria-label="입력" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">변환 결과</label>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <textarea readOnly value={result} className="w-full rounded-md border bg-card p-3 text-sm h-32 leading-relaxed" aria-label="변환 결과" />
      </div>
    </main>
  );
}
