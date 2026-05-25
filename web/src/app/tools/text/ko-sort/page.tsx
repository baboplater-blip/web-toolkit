'use client';

import { useMemo, useState } from 'react';
import { ArrowDownAZ, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Mode = 'asc' | 'desc' | 'reverse' | 'random' | 'length-asc' | 'length-desc';

export default function KoSortPage() {
  const [input, setInput] = useState('가나다\n123\n나라\n람보\nABC\n사과\n100\n2.5');
  const [mode, setMode] = useState<Mode>('asc');
  const [dedupe, setDedupe] = useState(false);
  const [trim, setTrim] = useState(true);
  const [numeric, setNumeric] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    let lines = input.split('\n');
    if (trim) lines = lines.map((l) => l.trim());
    if (dedupe) lines = Array.from(new Set(lines));

    if (mode === 'reverse') {
      return [...lines].reverse().join('\n');
    }
    if (mode === 'random') {
      const arr = [...lines];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.join('\n');
    }
    if (mode === 'length-asc' || mode === 'length-desc') {
      const arr = [...lines].sort((a, b) => {
        const diff = a.length - b.length;
        return mode === 'length-asc' ? diff : -diff;
      });
      return arr.join('\n');
    }
    const collator = new Intl.Collator('ko-KR', { numeric, sensitivity: 'base' });
    const arr = [...lines].sort(collator.compare);
    if (mode === 'desc') arr.reverse();
    return arr.join('\n');
  }, [input, mode, dedupe, trim, numeric]);

  const stats = useMemo(() => {
    const lines = input.split('\n');
    const trimmed = trim ? lines.map((l) => l.trim()).filter(Boolean).length : lines.length;
    const unique = new Set(trim ? lines.map((l) => l.trim()) : lines).size;
    return { total: lines.length, trimmed, unique, dedup: lines.length - unique };
  }, [input, trim]);

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
          <ArrowDownAZ className="h-5 w-5" />
          <h1 className="text-xl font-semibold">한국어 정렬·중복 제거</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          한국어·숫자를 인식하는 정렬, 중복 제거, 무작위 셔플, 길이 정렬을 지원.
        </p>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium">한 줄에 하나씩 ({stats.total.toLocaleString()} 줄 · 고유 {stats.unique.toLocaleString()})</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-sm h-48 leading-relaxed font-mono" aria-label="한 줄에 하나씩 ( 줄 · 고유 )" />
      </div>

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <p className="text-xs font-medium">정렬 방식</p>
        <div className="flex flex-wrap gap-2">
          <Button variant={mode === 'asc' ? 'default' : 'outline'} size="sm" onClick={() => setMode('asc')}>가나다↑</Button>
          <Button variant={mode === 'desc' ? 'default' : 'outline'} size="sm" onClick={() => setMode('desc')}>가나다↓</Button>
          <Button variant={mode === 'length-asc' ? 'default' : 'outline'} size="sm" onClick={() => setMode('length-asc')}>길이↑</Button>
          <Button variant={mode === 'length-desc' ? 'default' : 'outline'} size="sm" onClick={() => setMode('length-desc')}>길이↓</Button>
          <Button variant={mode === 'reverse' ? 'default' : 'outline'} size="sm" onClick={() => setMode('reverse')}>역순</Button>
          <Button variant={mode === 'random' ? 'default' : 'outline'} size="sm" onClick={() => setMode('random')}>무작위</Button>
        </div>
        <div className="flex flex-wrap gap-3 pt-1 text-xs">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" className="h-3.5 w-3.5" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
            중복 제거
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" className="h-3.5 w-3.5" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
            양끝 공백 제거
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" className="h-3.5 w-3.5" checked={numeric} onChange={(e) => setNumeric(e.target.checked)} />
            숫자 자연 정렬 (item2 &lt; item10)
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">결과</label>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <textarea readOnly value={result} className="w-full rounded-md border bg-card p-3 text-sm h-48 leading-relaxed font-mono" aria-label="결과" />
      </div>
    </main>
  );
}
