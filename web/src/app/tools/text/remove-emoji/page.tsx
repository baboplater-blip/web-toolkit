'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/**
 * 이모지·픽토그래프 기호를 매칭하는 정규식. 전역(g)·유니코드(u) 플래그 사용.
 * 매 변환마다 새 RegExp 를 만들지 않도록 모듈 스코프에 두고, lastIndex 누적을 피하려 replace 로만 쓴다.
 *
 * 매칭 단위:
 *  - 키캡 시퀀스: [#*0-9] + (VS16) + 결합 키캡(⃣)  → 1️⃣ #️⃣ 등 (일반 숫자 42 는 보존)
 *  - 국기: 지역 표시자 두 글자 쌍                  → 🇰🇷
 *  - 픽토그래프(+스킨톤/VS16) + ZWJ 연결 시퀀스      → 👋🏽 👨‍👩‍👧 ❤️
 *  - 뒤따르는 고아 VS16(️) 까지 흡수
 */
const EMOJI_PATTERN =
  /(?:[#*0-9]️?⃣|\p{Regional_Indicator}\p{Regional_Indicator}|\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*)️?/gu;

interface RemoveResult {
  text: string;
  removed: number;
}

/**
 * 텍스트에서 이모지·픽토그래프 기호를 제거한다.
 * collapseSpaces 가 켜져 있으면 제거 후 생긴 연속 공백(개행 제외)을 하나로 합친다.
 */
function removeEmoji(input: string, collapseSpaces: boolean): RemoveResult {
  let removed = 0;
  let text = input.replace(EMOJI_PATTERN, (match) => {
    // 코드 포인트 단위로 세어 서로게이트 쌍을 1개로 계산한다.
    removed += [...match].length;
    return '';
  });

  if (collapseSpaces) {
    // 개행은 보존하고 공백/탭 연속만 단일 스페이스로 합친다.
    text = text.replace(/[^\S\r\n]{2,}/g, ' ');
  }

  return { text, removed };
}

export default function RemoveEmojiPage() {
  const [input, setInput] = useState('');
  const [collapseSpaces, setCollapseSpaces] = useState(false);
  const [copied, setCopied] = useState(false);

  const { text: output, removed } = useMemo(
    () => (input ? removeEmoji(input, collapseSpaces) : { text: '', removed: 0 }),
    [input, collapseSpaces],
  );

  function reset() {
    setInput('');
    setCollapseSpaces(false);
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remove-emoji.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이모지 제거" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트에서 이모지·픽토그래프 기호를 제거합니다. 일반 문자와 구두점은 그대로 둡니다.
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={collapseSpaces}
              onChange={(e) => setCollapseSpaces(e.target.checked)}
            />
            공백 정리 (연속 공백 합치기)
          </label>
          <span className="text-muted-foreground" aria-live="polite">
            제거됨: {removed}개
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="여기에 입력하세요"
            aria-label="입력"
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="결과"
            aria-label="결과"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!output}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
