'use client';

import { useMemo, useState } from 'react';
import { Languages, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hanjaToHangul } from '@/lib/tools/korean';

export default function HanjaPage() {
  const [input, setInput] = useState('大韓民國은 東아시아에 있는 나라입니다. 人口는 약 5천萬名.');
  const [copied, setCopied] = useState(false);

  const { result, replacements } = useMemo(() => hanjaToHangul(input), [input]);

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
          <Languages className="h-5 w-5" />
          <h1 className="text-xl font-semibold">한자 → 한글 변환</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          한자를 한국 한자음(한글) 로 변환합니다. 자주 쓰이는 한자 위주 사전.
        </p>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium">한자 포함 텍스트</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-sm h-32 leading-relaxed" aria-label="한자 포함 텍스트" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">변환 결과 ({replacements}자 변환)</label>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <textarea readOnly value={result} className="w-full rounded-md border bg-card p-3 text-sm h-32 leading-relaxed" aria-label="변환 결과 ( 자 변환)" />
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>일상에서 자주 쓰이는 한자(~500자) 위주 사전입니다. 일부 동음이의 한자는 일반적인 음을 적용합니다.</p>
      </div>
    </main>
  );
}
