'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decomposeSyllable } from '@/lib/tools/korean';

type Style = 'space' | 'dot' | 'comma' | 'newline' | 'syllable-newline';

export default function SyllableSpreadPage() {
  const [input, setInput] = useState('안녕하세요 반갑습니다');
  const [style, setStyle] = useState<Style>('space');
  const [includeNonKo, setIncludeNonKo] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const sep = style === 'space' ? ' ' : style === 'dot' ? '·' : style === 'comma' ? ', ' : '\n';

    if (style === 'syllable-newline') {
      const out: string[] = [];
      for (const ch of input) {
        const code = ch.charCodeAt(0);
        if (code >= 0xac00 && code <= 0xd7a3) {
          out.push(ch);
        } else if (ch === ' ' || ch === '\n') {
          out.push(ch);
        } else if (includeNonKo) {
          out.push(ch);
        }
      }
      return out.join('\n');
    }

    const out: string[] = [];
    for (const ch of input) {
      const code = ch.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        const d = decomposeSyllable(ch);
        if (d) out.push(d.join(''));
      } else if (ch === ' ') {
        out.push(' ');
      } else if (includeNonKo) {
        out.push(ch);
      }
    }
    return out.join(sep);
  }, [input, style, includeNonKo]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="한글 음절·자모 풀어쓰기" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          한글을 음절 단위 / 자모 단위로 풀어 다양한 구분자로 표시합니다.
        </p>

      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium">한글 텍스트</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-sm h-32 leading-relaxed" aria-label="한글 텍스트" />
      </div>

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <p className="text-xs font-medium">스타일</p>
        <div className="flex flex-wrap gap-2">
          <Button variant={style === 'space' ? 'default' : 'outline'} size="sm" onClick={() => setStyle('space')}>공백</Button>
          <Button variant={style === 'dot' ? 'default' : 'outline'} size="sm" onClick={() => setStyle('dot')}>가운뎃점</Button>
          <Button variant={style === 'comma' ? 'default' : 'outline'} size="sm" onClick={() => setStyle('comma')}>쉼표</Button>
          <Button variant={style === 'newline' ? 'default' : 'outline'} size="sm" onClick={() => setStyle('newline')}>줄바꿈 (자모)</Button>
          <Button variant={style === 'syllable-newline' ? 'default' : 'outline'} size="sm" onClick={() => setStyle('syllable-newline')}>줄바꿈 (음절)</Button>
        </div>
        <label className="flex items-center gap-2 text-xs pt-1">
          <input type="checkbox" className="h-4 w-4" checked={includeNonKo} onChange={(e) => setIncludeNonKo(e.target.checked)} />
          숫자·기호·영문도 포함
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">결과</label>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <textarea readOnly value={result} className="w-full rounded-md border bg-card p-3 text-sm h-32 leading-relaxed font-mono" aria-label="결과" />
      </div>
    </main>
    </div>
  );
}
