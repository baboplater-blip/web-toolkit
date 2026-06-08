'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';

interface FancyStyle {
  id: string;
  label: string;
  transform: (text: string) => string;
}

/**
 * 시작 코드포인트를 기준으로 a-z / A-Z / 0-9 를 순차 매핑하는 변환기를 만든다.
 * 매핑이 없는 영역(예: 숫자 미지원)은 lookup 미정의로 두어 원문을 보존한다.
 */
function buildOffsetMap(options: {
  upperStart?: number;
  lowerStart?: number;
  digitStart?: number;
}): (text: string) => string {
  const map = new Map<string, string>();

  if (options.upperStart !== undefined) {
    Array.from(UPPER).forEach((char, index) => {
      map.set(char, String.fromCodePoint(options.upperStart! + index));
    });
  }
  if (options.lowerStart !== undefined) {
    Array.from(LOWER).forEach((char, index) => {
      map.set(char, String.fromCodePoint(options.lowerStart! + index));
    });
  }
  if (options.digitStart !== undefined) {
    Array.from(DIGITS).forEach((char, index) => {
      map.set(char, String.fromCodePoint(options.digitStart! + index));
    });
  }

  return (text: string): string =>
    Array.from(text)
      .map((char) => map.get(char) ?? char)
      .join('');
}

/** 명시적 글리프 배열로 매핑하는 변환기를 만든다(불연속 코드포인트용). */
function buildArrayMap(options: {
  upper?: string[];
  lower?: string[];
  digits?: string[];
}): (text: string) => string {
  const map = new Map<string, string>();
  options.upper?.forEach((glyph, index) => map.set(UPPER[index], glyph));
  options.lower?.forEach((glyph, index) => map.set(LOWER[index], glyph));
  options.digits?.forEach((glyph, index) => map.set(DIGITS[index], glyph));

  return (text: string): string =>
    Array.from(text)
      .map((char) => map.get(char) ?? char)
      .join('');
}

// 원문자(Circled): 불연속 구간이 있어 배열로 정의
const CIRCLED_UPPER = Array.from('ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ');
const CIRCLED_LOWER = Array.from('ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ');
const CIRCLED_DIGITS = Array.from('⓪①②③④⑤⑥⑦⑧⑨');

const STYLES: FancyStyle[] = [
  {
    id: 'bold',
    label: '굵게',
    transform: buildOffsetMap({ upperStart: 0x1d400, lowerStart: 0x1d41a, digitStart: 0x1d7ce }),
  },
  {
    id: 'italic',
    label: '기울임',
    // 수학 이탤릭은 숫자 미지원 → 숫자는 원문 보존
    transform: buildOffsetMap({ upperStart: 0x1d434, lowerStart: 0x1d44e }),
  },
  {
    id: 'bold-italic',
    label: '굵은 기울임',
    transform: buildOffsetMap({ upperStart: 0x1d468, lowerStart: 0x1d482 }),
  },
  {
    id: 'script',
    label: '필기체',
    transform: buildOffsetMap({ upperStart: 0x1d4d0, lowerStart: 0x1d4ea, digitStart: 0x1d7ce }),
  },
  {
    id: 'double-struck',
    label: '겹선',
    transform: buildOffsetMap({ upperStart: 0x1d538, lowerStart: 0x1d552, digitStart: 0x1d7d8 }),
  },
  {
    id: 'monospace',
    label: '모노스페이스',
    transform: buildOffsetMap({ upperStart: 0x1d670, lowerStart: 0x1d68a, digitStart: 0x1d7f6 }),
  },
  {
    id: 'sans-bold',
    label: '산세리프 굵게',
    transform: buildOffsetMap({ upperStart: 0x1d5d4, lowerStart: 0x1d5ee, digitStart: 0x1d7ec }),
  },
  {
    id: 'fullwidth',
    label: '전각',
    transform: buildOffsetMap({ upperStart: 0xff21, lowerStart: 0xff41, digitStart: 0xff10 }),
  },
  {
    id: 'circled',
    label: '원문자',
    transform: buildArrayMap({
      upper: CIRCLED_UPPER,
      lower: CIRCLED_LOWER,
      digits: CIRCLED_DIGITS,
    }),
  },
];

export default function FancyTextPage() {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const results = useMemo(
    () =>
      STYLES.map((style) => ({
        id: style.id,
        label: style.label,
        text: input ? style.transform(input) : '',
      })),
    [input],
  );

  function copy(id: string, text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopiedId(id);
        window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
      },
      () => {
        /* 복사 실패는 조용히 무시(권한 거부 등) */
      },
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="유니코드 폰트 생성" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          텍스트를 𝕗𝕒𝕟𝕔𝕪·𝓼𝓬𝓻𝓲𝓹𝓽 등 여러 유니코드 글꼴로 변환합니다. 각 스타일을 복사하세요.
        </p>

      </header>

      <textarea
        className="min-h-24 w-full rounded-xl border bg-card p-3 font-mono text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="여기에 입력하세요 (영문·숫자)"
        aria-label="입력"
      />

      <ul className="space-y-2">
        {results.map((result) => (
          <li
            key={result.id}
            className="flex items-center gap-3 rounded-xl border bg-card p-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{result.label}</span>
              <p className="break-words text-base" aria-label={`${result.label} 결과`}>
                {result.text || <span className="text-muted-foreground">미리보기</span>}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(result.id, result.text)}
              disabled={!result.text}
            >
              <Copy className="mr-1 h-4 w-4" aria-hidden />
              {copiedId === result.id ? '복사됨' : '복사'}
            </Button>
          </li>
        ))}
      </ul>
    </main>
    </div>
  );
}
