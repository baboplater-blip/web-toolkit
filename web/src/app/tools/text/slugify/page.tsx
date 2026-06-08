'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 국어의 로마자 표기법(개정안) 기반 자모 매핑.
// 한글 음절(가~힣)을 초성/중성/종성으로 분해해 로마자로 음역한다.
const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;

const CHOSEONG: readonly string[] = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

const JUNGSEONG: readonly string[] = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];

// 종성은 받침의 대표음(끝소리 규칙)을 따른 로마자 표기.
const JONGSEONG: readonly string[] = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k',
  'm', 'p', 'l', 'l', 'l', 'l', 'm', 'p', 'p', 't',
  't', 'ng', 't', 't', 'k', 't', 'p', 't',
];

function romanizeHangul(input: string): string {
  let result = '';
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    if (code < HANGUL_BASE || code > HANGUL_END) {
      result += char;
      continue;
    }
    const offset = code - HANGUL_BASE;
    const cho = Math.floor(offset / (JUNG_COUNT * JONG_COUNT));
    const jung = Math.floor((offset % (JUNG_COUNT * JONG_COUNT)) / JONG_COUNT);
    const jong = offset % JONG_COUNT;
    result += CHOSEONG[cho] + JUNGSEONG[jung] + JONGSEONG[jong];
  }
  return result;
}

function slugify(input: string, separator: string, lowercase: boolean): string {
  // 1. 한글 음절을 로마자로 음역
  let text = romanizeHangul(input);
  // 2. 라틴 발음기호 제거(é → e 등)
  text = text.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  // 3. 대소문자 처리
  if (lowercase) text = text.toLowerCase();
  // 4. 영숫자 외 문자를 구분자로
  text = text.replace(/[^a-zA-Z0-9]+/g, separator);
  // 5. 연속 구분자 축약 + 양끝 구분자 제거
  if (separator) {
    const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sepRe = new RegExp(`${escaped}{2,}`, 'g');
    text = text.replace(sepRe, separator);
    const edgeRe = new RegExp(`^${escaped}+|${escaped}+$`, 'g');
    text = text.replace(edgeRe, '');
  }
  return text;
}

export default function SlugifyPage() {
  const [input, setInput] = useState('안녕하세요 Hello World');
  const [separator, setSeparator] = useState<'-' | '_'>('-');
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => slugify(input, separator, lowercase),
    [input, separator, lowercase],
  );

  async function copy() {
    if (!output) return;
    await navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="슬러그 변환" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">제목을 URL 슬러그로 변환합니다. 한글은 로마자로 음역합니다.</p>

      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
        <label className="flex items-center gap-2">
          구분자
          <select
            className="rounded-lg border bg-background px-2 py-1 text-sm"
            value={separator}
            onChange={(e) => setSeparator(e.target.value === '_' ? '_' : '-')}
            aria-label="구분자"
          >
            <option value="-">하이픈 ( - )</option>
            <option value="_">밑줄 ( _ )</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={lowercase}
            onChange={(e) => setLowercase(e.target.checked)}
          />
          소문자로 변환
        </label>
      </div>

      <div className="space-y-2">
        <textarea
          className="min-h-32 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="제목을 입력하세요"
          aria-label="입력"
        />
        <div className="flex items-center gap-2">
          <textarea
            className="min-h-16 flex-1 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="슬러그 결과"
            aria-label="결과"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={copy}
            disabled={!output}
            aria-label="슬러그 복사"
            title="복사"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </main>
    </div>
  );
}
