'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Copy, Check, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyAllFixes, findSpellIssues } from '@/lib/tools/korean';

export default function KoSpellCheckPage() {
  const [input, setInput] = useState('이게 되요? 안되! 몇일동안 깨끗히 청소했어요. 확율이 낮습니다.');
  const [copied, setCopied] = useState(false);

  const issues = useMemo(() => findSpellIssues(input), [input]);
  const fixed = useMemo(() => applyAllFixes(input).result, [input]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fixed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  // 매치를 하이라이트
  const segments = useMemo(() => {
    if (issues.length === 0) return [{ text: input, match: null }];
    const out: Array<{ text: string; match: typeof issues[number] | null }> = [];
    let cursor = 0;
    for (const m of issues) {
      if (m.index > cursor) out.push({ text: input.slice(cursor, m.index), match: null });
      out.push({ text: m.original, match: m });
      cursor = m.index + m.length;
    }
    if (cursor < input.length) out.push({ text: input.slice(cursor), match: null });
    return out;
  }, [input, issues]);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="한국어 맞춤법 검사" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          자주 틀리는 단어를 찾아 표시합니다. 일괄 자동 교정도 가능.
        </p>

      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium">원본 텍스트</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-sm h-32 leading-relaxed"
          placeholder="한국어 문장을 입력하세요." aria-label="원본 텍스트" />
      </div>

      {issues.length > 0 && (
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <p className="text-xs font-semibold">검출된 문제 {issues.length}건</p>
          <div className="leading-relaxed text-sm whitespace-pre-wrap">
            {segments.map((seg, i) => {
              if (!seg.match) return <span key={i}>{seg.text}</span>;
              return (
                <span
                  key={i}
                  className="rounded bg-destructive/15 text-destructive px-0.5 underline decoration-wavy decoration-destructive"
                  title={`${seg.match.desc} — 제안: ${seg.match.suggestion}`}
                >
                  {seg.text}
                </span>
              );
            })}
          </div>
          <ul className="text-[11px] space-y-1 text-muted-foreground">
            {issues.slice(0, 30).map((m, i) => (
              <li key={i}>
                <span className="text-destructive line-through">{m.original}</span>
                {' → '}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{m.suggestion}</span>
                <span className="ml-2 opacity-70">{m.desc}</span>
              </li>
            ))}
            {issues.length > 30 && <li>… 외 {issues.length - 30}건</li>}
          </ul>
        </div>
      )}

      {issues.length === 0 && input && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          ✓ 검출된 맞춤법 문제 없음
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">일괄 교정 결과</label>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <textarea
          readOnly
          value={fixed}
          className="w-full rounded-md border bg-card p-3 text-sm h-32 leading-relaxed" aria-label="일괄 교정 결과" />
        <Button variant="outline" size="sm" onClick={() => setInput(fixed)}>
          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
          교정 결과를 입력란으로 가져오기
        </Button>
      </div>
    </main>
    </div>
  );
}
