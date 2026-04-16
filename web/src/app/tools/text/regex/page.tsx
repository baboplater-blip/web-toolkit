'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Regex } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface MatchInfo {
  text: string;
  index: number;
  groups: string[];
}

export default function RegexPage() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [flags, setFlags] = useState('gi');
  const [text, setText] = useState(
    '연락: alice@example.com, bob@test.org\n참고: notanemail, hello@world.io 로 문의하세요.',
  );
  const [replaceWith, setReplaceWith] = useState('');

  const { matches, error, compiled } = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags);
      const found: MatchInfo[] = [];
      if (flags.includes('g')) {
        for (const m of text.matchAll(re)) {
          if (m.index === undefined) continue;
          found.push({ text: m[0], index: m.index, groups: m.slice(1) });
        }
      } else {
        const m = text.match(re);
        if (m && m.index !== undefined) {
          found.push({ text: m[0], index: m.index, groups: m.slice(1) });
        }
      }
      return { matches: found, error: null, compiled: re };
    } catch (err) {
      return {
        matches: [],
        error: err instanceof Error ? err.message : '정규식 오류',
        compiled: null,
      };
    }
  }, [pattern, flags, text]);

  const replaced = useMemo(() => {
    if (!compiled) return '';
    try {
      return text.replace(compiled, replaceWith);
    } catch {
      return '';
    }
  }, [text, compiled, replaceWith]);

  // 하이라이트 렌더링
  const highlighted = useMemo(() => {
    if (!compiled || matches.length === 0) return [{ text, highlight: false }];
    const out: { text: string; highlight: boolean }[] = [];
    let last = 0;
    for (const m of matches) {
      if (m.index > last) out.push({ text: text.slice(last, m.index), highlight: false });
      out.push({ text: m.text, highlight: true });
      last = m.index + m.text.length;
    }
    if (last < text.length) out.push({ text: text.slice(last), highlight: false });
    return out;
  }, [matches, text, compiled]);

  const toggleFlag = (f: string) => {
    setFlags((cur) => (cur.includes(f) ? cur.replace(f, '') : cur + f));
  };

  const presets: { label: string; pattern: string; flags: string }[] = [
    { label: '이메일', pattern: '\\b[\\w.+-]+@[\\w.-]+\\.\\w{2,}\\b', flags: 'gi' },
    { label: 'URL', pattern: 'https?://[^\\s<>"]+', flags: 'gi' },
    { label: '전화 (한국)', pattern: '\\b0\\d{1,2}-?\\d{3,4}-?\\d{4}\\b', flags: 'g' },
    { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
    { label: '날짜 YYYY-MM-DD', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', flags: 'g' },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Regex className="h-5 w-5" />
            <h1 className="font-semibold text-base">정규식 테스터</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">정규식 패턴</label>
            <div className="flex gap-1 items-center">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="h-9 font-mono text-xs flex-1"
                spellCheck={false}
              />
              <span className="text-sm text-muted-foreground">/</span>
              <div className="flex gap-1">
                {(['g', 'i', 'm', 's', 'u'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFlag(f)}
                    className={`h-7 w-7 text-[11px] font-mono rounded-md border ${
                      flags.includes(f)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                    title={
                      f === 'g'
                        ? '전역'
                        : f === 'i'
                          ? '대소문자 무시'
                          : f === 'm'
                            ? '멀티라인'
                            : f === 's'
                              ? 'dotall'
                              : '유니코드'
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground self-center">프리셋:</span>
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPattern(p.pattern);
                  setFlags(p.flags);
                }}
                className="h-6 px-2 text-[10px] rounded border bg-background hover:bg-muted"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <label className="text-xs font-medium">테스트 문자열</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
            spellCheck={false}
          />
        </div>

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">매칭 결과</label>
            <span className="text-[10px] text-muted-foreground">{matches.length}개 매칭</span>
          </div>
          <div className="rounded-lg border bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all">
            {highlighted.map((seg, i) =>
              seg.highlight ? (
                <mark key={i} className="bg-primary/30 rounded px-0.5">
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </div>

          {matches.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {matches.map((m, i) => (
                <div key={i} className="rounded border p-2 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    <span className="text-[10px] text-muted-foreground">idx {m.index}</span>
                    <span className="flex-1 font-semibold">{m.text}</span>
                  </div>
                  {m.groups.length > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      groups: [{m.groups.map((g) => JSON.stringify(g)).join(', ')}]
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <label className="text-xs font-medium">치환</label>
          <Input
            value={replaceWith}
            onChange={(e) => setReplaceWith(e.target.value)}
            placeholder="치환할 텍스트 ($1, $2 등 그룹 참조 가능)"
            className="h-9 font-mono text-xs"
          />
          <Separator />
          <label className="text-[10px] text-muted-foreground">치환 결과</label>
          <textarea
            readOnly
            value={replaced}
            rows={5}
            className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y"
          />
        </div>
      </main>
    </div>
  );
}
