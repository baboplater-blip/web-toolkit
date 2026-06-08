'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useDeferredValue, useMemo, useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { autoSpacing } from '@/lib/tools/korean';
import { triggerDownload } from '@/lib/tools/file-utils';

export default function KoSpacingPage() {
  const [input, setInput] = useState('한국어띄어쓰기가어렵습니다.제가할것은무엇일까요? 100 만원이있습니다.');
  const [copied, setCopied] = useState(false);
  // 규칙 기반 교정은 입력보다 한 박자 늦게 실행해 대용량 붙여넣기 시 입력 블로킹을 막는다.
  const deferredInput = useDeferredValue(input);
  const output = useMemo(() => autoSpacing(deferredInput), [deferredInput]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="한글 띄어쓰기 교정" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          자주 빠지는 띄어쓰기를 규칙 기반으로 교정합니다. 의존명사·조사·숫자 단위 우선.
        </p>

      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium">원본 텍스트</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-sm min-h-40 resize-y leading-relaxed"
          placeholder="한국어 문장을 입력하세요." aria-label="원본 텍스트" />
        <p className="text-[10px] text-muted-foreground">{input.length.toLocaleString()} 자</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">교정 결과</label>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                triggerDownload(
                  new Blob([output], { type: 'text/plain;charset=utf-8' }),
                  'spacing-fixed.txt',
                )
              }
              disabled={!output}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              TXT
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        </div>
        <textarea
          readOnly
          value={output}
          className="w-full rounded-md border bg-card p-3 text-sm min-h-40 resize-y leading-relaxed" aria-label="교정 결과" />
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">알아두실 점</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>형태소 분석기가 아닌 규칙 기반이라 100% 정확하지는 않습니다.</li>
          <li>의존명사(것·수·뿐 등) 띄어쓰기, 조사 붙임, 숫자 단위 결합 등을 우선 처리합니다.</li>
          <li>중요한 문서는 결과를 직접 검토해주세요.</li>
        </ul>
      </div>
    </main>
    </div>
  );
}
