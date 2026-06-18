'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { ShareLinkButton } from '@/components/tools/ShareLinkButton';
import { useToolUrlState } from '@/lib/use-tool-url-state';
import { parseHex, toHexString, contrastRatio } from '@/lib/tools/color-contrast';

function Badge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
        pass
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-destructive/40 bg-destructive/5 text-destructive'
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs font-semibold uppercase tracking-wider">
        {pass ? '통과' : '실패'}
      </span>
    </div>
  );
}

export default function ColorContrastPage() {
  // 전경·배경색을 URL 쿼리로 관리(공유·복원, 다른 도구에서 ?fg=·?bg= 로 전달받음).
  // 초기 렌더는 결정적 기본값, URL 읽기는 훅 내부 마운트 후 useEffect 에서만.
  const [urlState, patchUrlState] = useToolUrlState({ fg: '#1a1a1a', bg: '#ffffff' });
  const fgInput = urlState.fg;
  const bgInput = urlState.bg;
  const setFgInput = (value: string) => patchUrlState({ fg: value });
  const setBgInput = (value: string) => patchUrlState({ bg: value });

  const fg = useMemo(() => parseHex(fgInput), [fgInput]);
  const bg = useMemo(() => parseHex(bgInput), [bgInput]);

  const ratio = fg && bg ? contrastRatio(fg, bg) : null;
  const error = !fg || !bg ? '유효한 hex 색상(예: #1a1a1a 또는 #abc)을 입력해 주세요.' : null;

  const fgHex = fg ? toHexString(fg) : '#000000';
  const bgHex = bg ? toHexString(bg) : '#ffffff';

  const handleReset = () => {
    patchUrlState({ fg: '#1a1a1a', bg: '#ffffff' });
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="색상 대비 검사기" widthClass="max-w-xl" onReset={handleReset}>
        <ShareLinkButton />
      </ToolHeader>
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          두 색의 WCAG 명도 대비비를 계산하고 AA·AAA 통과 여부를 보여줍니다.
        </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 rounded-xl border bg-card p-4">
          <span className="text-sm font-medium">전경색 (텍스트)</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fgHex}
              onChange={(e) => setFgInput(e.target.value)}
              className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-background"
              aria-label="전경색 선택"
            />
            <Input
              value={fgInput}
              onChange={(e) => setFgInput(e.target.value)}
              placeholder="#1a1a1a"
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
              aria-label="전경색 hex"
              aria-invalid={!fg}
            />
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl border bg-card p-4">
          <span className="text-sm font-medium">배경색</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgHex}
              onChange={(e) => setBgInput(e.target.value)}
              className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-background"
              aria-label="배경색 선택"
            />
            <Input
              value={bgInput}
              onChange={(e) => setBgInput(e.target.value)}
              placeholder="#ffffff"
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
              aria-label="배경색 hex"
              aria-invalid={!bg}
            />
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {ratio !== null && (
        <>
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: bgHex, color: fgHex }}
          >
            <p className="text-lg font-semibold">큰 글자 미리보기 (Aa 한글 가나다)</p>
            <p className="text-sm">
              일반 본문 텍스트 미리보기입니다. The quick brown fox jumps over the lazy dog.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">대비비</p>
              <p className="text-2xl font-bold tabular-nums">{ratio.toFixed(2)} : 1</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Badge label="AA 일반 (4.5)" pass={ratio >= 4.5} />
              <Badge label="AA 큰글자 (3.0)" pass={ratio >= 3} />
              <Badge label="AAA 일반 (7.0)" pass={ratio >= 7} />
              <Badge label="AAA 큰글자 (4.5)" pass={ratio >= 4.5} />
            </div>
          </div>
        </>
      )}

      <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
        <p>
          WCAG 2.1 상대 휘도 공식으로 계산합니다. 큰 글자 기준은 18pt(약 24px) 또는 굵은 14pt(약
          18.66px) 이상입니다.
        </p>
      </div>
      </main>
    </div>
  );
}
