'use client';

import { useState } from 'react';
import { Check, CircleHelp, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 표준 매직 8볼 20개 답변(한국어). 긍정 10 · 보류 5 · 부정 5. */
const ANSWERS = [
  // 긍정
  '확실합니다.',
  '틀림없이 그렇습니다.',
  '의심할 여지가 없습니다.',
  '네, 분명히요.',
  '믿어도 좋습니다.',
  '제가 보기엔 그렇습니다.',
  '거의 확실합니다.',
  '전망이 좋습니다.',
  '네.',
  '신호가 긍정적입니다.',
  // 보류
  '대답이 흐릿합니다, 다시 시도하세요.',
  '나중에 다시 물어보세요.',
  '지금은 말하지 않는 게 좋겠습니다.',
  '지금은 예측할 수 없습니다.',
  '집중하고 다시 물어보세요.',
  // 부정
  '기대하지 마세요.',
  '제 대답은 아니오입니다.',
  '제가 보기엔 별로입니다.',
  '전망이 그리 좋지 않습니다.',
  '매우 의심스럽습니다.',
];

/** crypto 로 [0, max) 범위의 균등한 정수를 뽑는다 (모듈로 편향 제거). */
function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

export default function Magic8BallPage() {
  const [question, setQuestion] = useState('');
  // 하이드레이션 안전: 난수는 SSR/CSR 가 다르므로 초기 렌더에서 호출하지 않는다.
  // null(placeholder) 로 시작하고, 클릭 시에만 crypto 로 답을 주입한다.
  const [answer, setAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  function ask() {
    // 사용자 클릭 핸들러 — 초기 렌더 경로가 아니므로 crypto 사용 안전.
    setAnswer(ANSWERS[secureRandomInt(ANSWERS.length)]);
  }

  function handleReset() {
    setQuestion('');
    setAnswer(null);
  }

  async function copyResult() {
    if (answer === null) return;
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 비보안 컨텍스트·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="마법의 8번 공"
        widthClass="max-w-xl"
        onReset={question || answer !== null ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          질문을 입력하고 공을 흔들면 무작위로 답을 줍니다. 재미로만 봐 주세요.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">질문</span>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 오늘 운이 좋을까요?"
              onKeyDown={(e) => {
                if (e.key === 'Enter') ask();
              }}
            />
          </label>
          <Button onClick={ask}>
            <CircleHelp className="h-4 w-4" aria-hidden />
            <span className="ml-1">공 흔들기</span>
          </Button>
        </div>

        <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-center">
          {answer === null ? (
            <p className="text-sm text-muted-foreground">질문을 입력하고 공을 흔들어 보세요.</p>
          ) : (
            <>
              <p className="text-xl font-bold text-primary">{answer}</p>
              <Button variant="outline" size="sm" onClick={copyResult}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="ml-1">
                  {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
                </span>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
