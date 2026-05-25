'use client';

import { useMemo, useState } from 'react';
import { Type, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decomposeAll } from '@/lib/tools/korean';

export default function JamoPage() {
  const [input, setInput] = useState('안녕하세요');
  const [copied, setCopied] = useState(false);
  const [withSpaces, setWithSpaces] = useState(false);

  const result = useMemo(() => {
    const d = decomposeAll(input);
    if (!withSpaces) return d;
    // 음절 단위로 공백
    let out = '';
    for (const ch of input) {
      const code = ch.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        out += decomposeAll(ch) + ' ';
      } else {
        out += ch;
      }
    }
    return out.trim();
  }, [input, withSpaces]);

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
          <Type className="h-5 w-5" />
          <h1 className="text-xl font-semibold">한글 자모 분해</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          한글 음절을 초성·중성·종성으로 풀어 표시합니다.
        </p>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium">한글 텍스트</label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" aria-label="한글 텍스트" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4" checked={withSpaces} onChange={(e) => setWithSpaces(e.target.checked)} />
        음절별 공백
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">자모 분해</label>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <div className="rounded-md border bg-card p-3 text-lg font-mono leading-relaxed min-h-16">
          {result || <span className="text-muted-foreground text-sm">입력 대기 중</span>}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>예: 안 → ㅇㅏㄴ, 녕 → ㄴㅕㅇ. NLP 학습용 입력 전처리·자판 분석 등에 활용.</p>
      </div>
    </main>
  );
}
