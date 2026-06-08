'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'paragraphs' | 'sentences' | 'words';

const WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim',
  'ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi',
  'aliquip','ex','ea','commodo','consequat','duis','aute','irure','reprehenderit',
  'in','voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur',
  'sint','occaecat','cupidatat','non','proident','sunt','culpa','qui','officia',
  'deserunt','mollit','anim','id','est','laborum','vel','non','autem','tempore',
];

function rand(n: number) { return Math.floor(Math.random() * n); }

function genSentence(min = 6, max = 16, capitalize = true): string {
  const len = min + rand(max - min + 1);
  const words: string[] = [];
  for (let i = 0; i < len; i++) words.push(WORDS[rand(WORDS.length)]);
  let s = words.join(' ');
  if (capitalize) s = s[0].toUpperCase() + s.slice(1);
  return s + '.';
}

function genParagraph(min = 3, max = 7): string {
  const len = min + rand(max - min + 1);
  const arr: string[] = [];
  for (let i = 0; i < len; i++) arr.push(genSentence());
  return arr.join(' ');
}

export default function LoremPage() {
  const [mode, setMode] = useState<Mode>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  function regen() {
    let parts: string[] = [];
    if (mode === 'paragraphs') {
      for (let i = 0; i < count; i++) parts.push(genParagraph());
    } else if (mode === 'sentences') {
      for (let i = 0; i < count; i++) parts.push(genSentence());
    } else {
      const words: string[] = [];
      for (let i = 0; i < count; i++) words.push(WORDS[rand(WORDS.length)]);
      parts.push(words.join(' '));
    }
    if (startWithLorem && parts.length > 0) {
      const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      if (mode === 'paragraphs') {
        parts[0] = lorem + ' ' + parts[0];
      } else if (mode === 'sentences') {
        parts[0] = lorem;
      } else {
        parts = [lorem.replace('.', '').toLowerCase().split(/[\s,]+/).slice(0, count).join(' ')];
      }
    }
    const joined = mode === 'paragraphs' ? parts.join('\n\n') : parts.join(' ');
    setOutput(joined);
  }

  useEffect(() => {
    regen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, count, startWithLorem]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  function handleReset() {
    setMode('paragraphs');
    setCount(3);
    setStartWithLorem(true);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="Lorem Ipsum 생성" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          디자인·목업용 더미 텍스트를 즉시 생성합니다.
        </p>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium w-16">단위</label>
          <div className="flex gap-1">
            {(['paragraphs', 'sentences', 'words'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`h-8 rounded-md border px-3 text-xs ${
                  mode === m
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {m === 'paragraphs' ? '문단' : m === 'sentences' ? '문장' : '단어'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium w-16">개수</label>
          <Input
            type="number"
            min={1}
            max={mode === 'words' ? 200 : 30}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(200, parseInt(e.target.value || '1', 10))))}
            className="w-24 font-mono" aria-label="개수" />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem(e.target.checked)}
          />
          <span>&quot;Lorem ipsum…&quot; 으로 시작</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={regen}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          다시 생성
        </Button>
        <Button variant="outline" onClick={copy}>
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? '복사됨' : '복사'}
        </Button>
      </div>

      <textarea
        readOnly
        value={output}
        className="min-h-72 w-full resize-y rounded-md border bg-card p-3 text-sm leading-relaxed" aria-label="결과" />
      </main>
    </div>
  );
}
