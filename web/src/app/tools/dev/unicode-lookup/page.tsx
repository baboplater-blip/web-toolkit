'use client';

import { useMemo, useState } from 'react';
import { Type, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface CharInfo {
  index: number;
  char: string;
  codePoint: number;
  hex: string;
  name: string;
  utf8: string;
  htmlEntity: string;
}

const C0_NAMES: Record<number, string> = {
  0x00: 'NULL', 0x07: 'BELL', 0x08: 'BACKSPACE', 0x09: 'CHARACTER TABULATION',
  0x0a: 'LINE FEED', 0x0d: 'CARRIAGE RETURN', 0x1b: 'ESCAPE', 0x7f: 'DELETE',
};

/** 코드포인트의 사람이 읽을 수 있는 이름을 가능한 범위에서 추론한다. */
function nameFor(cp: number): string {
  if (cp in C0_NAMES) return C0_NAMES[cp];
  if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f)) return `CONTROL (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`;
  if (cp === 0x20) return 'SPACE';
  if (cp >= 0x30 && cp <= 0x39) return `DIGIT ${String.fromCodePoint(cp)}`;
  if (cp >= 0x41 && cp <= 0x5a) return `LATIN CAPITAL LETTER ${String.fromCodePoint(cp)}`;
  if (cp >= 0x61 && cp <= 0x7a) return `LATIN SMALL LETTER ${String.fromCodePoint(cp).toUpperCase()}`;
  if (cp >= 0xac00 && cp <= 0xd7a3) return 'HANGUL SYLLABLE';
  if (cp >= 0x1100 && cp <= 0x11ff) return 'HANGUL JAMO';
  if (cp >= 0x3130 && cp <= 0x318f) return 'HANGUL COMPATIBILITY JAMO';
  if (cp >= 0x4e00 && cp <= 0x9fff) return 'CJK UNIFIED IDEOGRAPH';
  if (cp >= 0x3040 && cp <= 0x309f) return 'HIRAGANA';
  if (cp >= 0x30a0 && cp <= 0x30ff) return 'KATAKANA';
  if (cp >= 0x1f300 && cp <= 0x1faff) return 'EMOJI / SYMBOL';
  if (cp >= 0x2000 && cp <= 0x206f) return 'GENERAL PUNCTUATION';
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** 한 코드포인트의 UTF-8 바이트열을 16진 문자열로 만든다. */
function utf8Bytes(cp: number): string {
  const bytes = Array.from(new TextEncoder().encode(String.fromCodePoint(cp)));
  return bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

/** 입력 텍스트를 코드포인트 단위(서로게이트 쌍 포함)로 분석한다. */
function analyze(text: string): CharInfo[] {
  const result: CharInfo[] = [];
  let index = 0;
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    const hex = cp.toString(16).toUpperCase().padStart(4, '0');
    result.push({
      index: index++,
      char,
      codePoint: cp,
      hex: `U+${hex}`,
      name: nameFor(cp),
      utf8: utf8Bytes(cp),
      htmlEntity: `&#${cp};`,
    });
  }
  return result;
}

/** 분석 결과를 TSV 텍스트로 직렬화(복사용). */
function toTsv(rows: CharInfo[]): string {
  const header = ['문자', '코드포인트', '이름', 'UTF-8', 'HTML'].join('\t');
  const body = rows.map((row) => [row.char, row.hex, row.name, row.utf8, row.htmlEntity].join('\t'));
  return [header, ...body].join('\n');
}

export default function UnicodeLookupPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => analyze(input), [input]);

  async function copy() {
    if (rows.length === 0) return;
    try {
      await navigator.clipboard.writeText(toTsv(rows));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
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
      <ToolHeader title="유니코드 문자 조회" onReset={input ? reset : undefined} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Type className="h-4 w-4 text-primary" aria-hidden />
          문자별 코드포인트 · 이름 · UTF-8 바이트 · HTML 엔티티를 표시합니다.
        </p>

        <textarea
          className="min-h-24 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="조회할 텍스트를 입력하세요 (예: 한 A 🎉)"
          aria-label="입력 텍스트"
        />

        {input === '' ? (
          <p className="text-xs text-muted-foreground">텍스트를 입력하면 문자별로 분석합니다.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{rows.length}개 문자</span>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '표 복사'}
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">문자</th>
                    <th className="px-3 py-2 font-medium">코드포인트</th>
                    <th className="px-3 py-2 font-medium">이름</th>
                    <th className="px-3 py-2 font-medium">UTF-8</th>
                    <th className="px-3 py-2 font-medium">HTML</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-center text-lg">{row.char.trim() === '' ? '␣' : row.char}</td>
                      <td className="px-3 py-2 font-mono">{row.hex}</td>
                      <td className="px-3 py-2 text-xs">{row.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.utf8}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.htmlEntity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
