'use client';

import { useMemo, useState } from 'react';
import { Palette, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** CSS 표준 named color → HEX (약 140개) */
const NAMED_COLORS: Readonly<Record<string, string>> = {
  aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff', aquamarine: '#7fffd4',
  azure: '#f0ffff', beige: '#f5f5dc', bisque: '#ffe4c4', black: '#000000',
  blanchedalmond: '#ffebcd', blue: '#0000ff', blueviolet: '#8a2be2', brown: '#a52a2a',
  burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00', chocolate: '#d2691e',
  coral: '#ff7f50', cornflowerblue: '#6495ed', cornsilk: '#fff8dc', crimson: '#dc143c',
  cyan: '#00ffff', darkblue: '#00008b', darkcyan: '#008b8b', darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9', darkgreen: '#006400', darkgrey: '#a9a9a9', darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b', darkolivegreen: '#556b2f', darkorange: '#ff8c00', darkorchid: '#9932cc',
  darkred: '#8b0000', darksalmon: '#e9967a', darkseagreen: '#8fbc8f', darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f', darkslategrey: '#2f4f4f', darkturquoise: '#00ced1', darkviolet: '#9400d3',
  deeppink: '#ff1493', deepskyblue: '#00bfff', dimgray: '#696969', dimgrey: '#696969',
  dodgerblue: '#1e90ff', firebrick: '#b22222', floralwhite: '#fffaf0', forestgreen: '#228b22',
  fuchsia: '#ff00ff', gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff', gold: '#ffd700',
  goldenrod: '#daa520', gray: '#808080', green: '#008000', greenyellow: '#adff2f',
  grey: '#808080', honeydew: '#f0fff0', hotpink: '#ff69b4', indianred: '#cd5c5c',
  indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c', lavender: '#e6e6fa',
  lavenderblush: '#fff0f5', lawngreen: '#7cfc00', lemonchiffon: '#fffacd', lightblue: '#add8e6',
  lightcoral: '#f08080', lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3',
  lightgreen: '#90ee90', lightgrey: '#d3d3d3', lightpink: '#ffb6c1', lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa', lightskyblue: '#87cefa', lightslategray: '#778899', lightslategrey: '#778899',
  lightsteelblue: '#b0c4de', lightyellow: '#ffffe0', lime: '#00ff00', limegreen: '#32cd32',
  linen: '#faf0e6', magenta: '#ff00ff', maroon: '#800000', mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd', mediumorchid: '#ba55d3', mediumpurple: '#9370db', mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc', mediumvioletred: '#c71585',
  midnightblue: '#191970', mintcream: '#f5fffa', mistyrose: '#ffe4e1', moccasin: '#ffe4b5',
  navajowhite: '#ffdead', navy: '#000080', oldlace: '#fdf5e6', olive: '#808000',
  olivedrab: '#6b8e23', orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6',
  palegoldenrod: '#eee8aa', palegreen: '#98fb98', paleturquoise: '#afeeee', palevioletred: '#db7093',
  papayawhip: '#ffefd5', peachpuff: '#ffdab9', peru: '#cd853f', pink: '#ffc0cb',
  plum: '#dda0dd', powderblue: '#b0e0e6', purple: '#800080', rebeccapurple: '#663399',
  red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1', saddlebrown: '#8b4513',
  salmon: '#fa8072', sandybrown: '#f4a460', seagreen: '#2e8b57', seashell: '#fff5ee',
  sienna: '#a0522d', silver: '#c0c0c0', skyblue: '#87ceeb', slateblue: '#6a5acd',
  slategray: '#708090', slategrey: '#708090', snow: '#fffafa', springgreen: '#00ff7f',
  steelblue: '#4682b4', tan: '#d2b48c', teal: '#008080', thistle: '#d8bfd8',
  tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee', wheat: '#f5deb3',
  white: '#ffffff', whitesmoke: '#f5f5f5', yellow: '#ffff00', yellowgreen: '#9acd32',
};

function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** "#rgb"/"#rrggbb"/"rgb(r,g,b)" 입력을 Rgb 로 파싱. 실패 시 null. */
function parseColor(text: string): Rgb | null {
  const trimmed = text.trim().toLowerCase();

  const shortHex = trimmed.match(/^#([0-9a-f]{3})$/);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split('');
    return hexToRgb(`#${r}${r}${g}${g}${b}${b}`);
  }

  const longHex = trimmed.match(/^#([0-9a-f]{6})$/);
  if (longHex) return hexToRgb(`#${longHex[1]}`);

  const rgb = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/);
  if (rgb) {
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    if (r <= 255 && g <= 255 && b <= 255) return { r, g, b };
  }

  return null;
}

function toHex(rgb: Rgb): string {
  const part = (value: number) => value.toString(16).padStart(2, '0');
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

function distanceSquared(a: Rgb, b: Rgb): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

interface Match {
  name: string;
  hex: string;
  exact: boolean;
}

function findNearest(rgb: Rgb): Match {
  let bestName = '';
  let bestHex = '';
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    const distance = distanceSquared(rgb, hexToRgb(hex));
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = name;
      bestHex = hex;
    }
  }

  return { name: bestName, hex: bestHex, exact: bestDistance === 0 };
}

export default function ColorNamePage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => (input.trim() ? parseColor(input) : null), [input]);
  const match = useMemo(() => (parsed ? findNearest(parsed) : null), [parsed]);
  const error = input.trim() !== '' && parsed === null
    ? '색상 형식을 인식할 수 없습니다. #rgb, #rrggbb, rgb(r,g,b) 형식으로 입력하세요.'
    : null;

  async function copy() {
    if (!match) return;
    try {
      await navigator.clipboard.writeText(match.name);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setInput('');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="색상 이름 찾기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Palette className="h-4 w-4 text-primary" aria-hidden />
          HEX·RGB 색상에 가장 가까운 CSS 색 이름을 찾습니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">색상 입력</span>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="예: #4169e1 또는 rgb(65, 105, 225)"
            aria-invalid={error !== null}
          />
        </label>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {parsed && match && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 shrink-0 rounded-lg border"
                style={{ backgroundColor: toHex(parsed) }}
                aria-label="입력한 색"
              />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">입력한 색</p>
                <p className="font-mono font-semibold">{toHex(parsed)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t pt-3">
              <div
                className="h-12 w-12 shrink-0 rounded-lg border"
                style={{ backgroundColor: match.hex }}
                aria-label="가장 가까운 색"
              />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">
                  {match.exact ? '정확히 일치' : '가장 가까운 색'}
                </p>
                <p className="font-mono font-semibold">
                  {match.name} <span className="text-muted-foreground">({match.hex})</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copy} className="ml-auto" aria-label="색 이름 복사">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
