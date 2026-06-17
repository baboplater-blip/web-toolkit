'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

const GLYPH_HEIGHT = 5;
const GLYPH_GAP = '  ';

/**
 * 문자별 5행 블록 글리프 맵. 각 글리프는 정확히 GLYPH_HEIGHT 줄.
 * 미지원 문자는 공백 글리프로 대체한다.
 */
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  ' ': ['     ', '     ', '     ', '     ', '     '],
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '#  ##', '#   #', ' ####'],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['#####', '   # ', '   # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  '0': [' ### ', '#  ##', '# # #', '##  #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '#####'],
  '2': [' ### ', '#   #', '  ## ', ' #   ', '#####'],
  '3': ['#### ', '    #', ' ### ', '    #', '#### '],
  '4': ['#  # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '#### '],
  '6': [' ####', '#    ', '#### ', '#   #', ' ### '],
  '7': ['#####', '   # ', '  #  ', ' #   ', '#    '],
  '8': [' ### ', '#   #', ' ### ', '#   #', ' ### '],
  '9': [' ### ', '#   #', ' ####', '    #', '#### '],
  '!': ['  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '  ## ', '     ', '  #  '],
  '.': ['     ', '     ', '     ', '     ', '  #  '],
  ',': ['     ', '     ', '     ', '  #  ', ' #   '],
  '-': ['     ', '     ', '#####', '     ', '     '],
  '+': ['     ', '  #  ', '#####', '  #  ', '     '],
  '=': ['     ', '#####', '     ', '#####', '     '],
  ':': ['     ', '  #  ', '     ', '  #  ', '     '],
  '#': [' # # ', '#####', ' # # ', '#####', ' # # '],
};

const SPACE_GLYPH = GLYPHS[' '];

function buildBanner(text: string): string {
  const chars = [...text.toUpperCase()];
  if (chars.length === 0) return '';

  const rows: string[] = [];
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    const segments = chars.map((char) => {
      const glyph = GLYPHS[char] ?? SPACE_GLYPH;
      return glyph[row];
    });
    rows.push(segments.join(GLYPH_GAP).replace(/\s+$/, ''));
  }
  return rows.join('\n');
}

export default function AsciiBannerPage() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const banner = useMemo(() => buildBanner(text), [text]);

  function reset() {
    setText('');
    setCopied(false);
  }

  async function copy() {
    if (!banner) return;
    try {
      await navigator.clipboard.writeText(banner);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="ASCII 배너" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트를 큰 ASCII 아트 글자로 만듭니다. 영문·숫자·일부 기호를 지원하며 그 외 문자는 공백으로 처리됩니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">내용</span>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="HELLO 123" />
        </label>

        <pre className="overflow-x-auto rounded-xl border bg-muted/40 p-3 font-mono text-xs leading-tight">
          {banner || '미리보기'}
        </pre>

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!banner}>
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
      </main>
    </div>
  );
}
