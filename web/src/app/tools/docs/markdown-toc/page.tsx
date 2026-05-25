'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, ListTree } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

interface Heading {
  level: number;
  text: string;
  slug: string;
}

function slugify(text: string, used: Set<string>): string {
  let base = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!base) base = 'section';
  let slug = base;
  let i = 1;
  while (used.has(slug)) {
    i += 1;
    slug = `${base}-${i}`;
  }
  used.add(slug);
  return slug;
}

function extractHeadings(md: string, maxDepth: number, minDepth: number): Heading[] {
  const lines = md.split(/\r?\n/);
  const used = new Set<string>();
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length;
    if (level < minDepth || level > maxDepth) continue;
    const text = m[2].trim();
    headings.push({ level, text, slug: slugify(text, used) });
  }
  return headings;
}

function buildToc(
  headings: Heading[],
  minDepth: number,
  numbered: boolean,
  withLinks: boolean,
): string {
  if (headings.length === 0) return '';
  const counters: number[] = [];
  return headings
    .map((h) => {
      const depth = h.level - minDepth;
      const indent = '  '.repeat(Math.max(0, depth));
      let prefix = '-';
      if (numbered) {
        while (counters.length <= depth) counters.push(0);
        counters.length = depth + 1;
        counters[depth] = (counters[depth] ?? 0) + 1;
        prefix = `${counters[depth]}.`;
      }
      const linkText = withLinks ? `[${h.text}](#${h.slug})` : h.text;
      return `${indent}${prefix} ${linkText}`;
    })
    .join('\n');
}

export default function MarkdownTocPage() {
  const [text, setText] = useState(
    [
      '# 문서 제목',
      '',
      '소개 문단입니다.',
      '',
      '## 1장. 시작하기',
      '',
      '### 설치',
      '',
      '내용...',
      '',
      '### 설정',
      '',
      '## 2장. 사용법',
      '',
      '### 기본 명령',
      '',
      '#### 옵션',
      '',
      '## 3장. 참고 자료',
    ].join('\n'),
  );
  const [maxDepth, setMaxDepth] = useState(4);
  const [minDepth, setMinDepth] = useState(1);
  const [numbered, setNumbered] = useState(false);
  const [withLinks, setWithLinks] = useState(true);
  const [insertInline, setInsertInline] = useState(false);
  const [copied, setCopied] = useState(false);

  const headings = useMemo(
    () => extractHeadings(text, maxDepth, minDepth),
    [text, maxDepth, minDepth],
  );
  const toc = useMemo(
    () => buildToc(headings, minDepth, numbered, withLinks),
    [headings, minDepth, numbered, withLinks],
  );

  const finalOutput = useMemo(() => {
    if (!insertInline) return toc;
    const marker = '<!-- TOC -->';
    if (text.includes(marker)) {
      return text.replace(marker, `${marker}\n\n${toc}\n\n${marker}`);
    }
    return `${marker}\n\n${toc}\n\n${marker}\n\n${text}`;
  }, [insertInline, text, toc]);

  const copy = async () => {
    if (!finalOutput) return;
    await navigator.clipboard.writeText(finalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <ListTree className="h-5 w-5" />
            <h1 className="font-semibold text-base">Markdown 목차 생성</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground">시작</label>
            <select
              value={minDepth}
              onChange={(e) => setMinDepth(Number(e.target.value))}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  H{n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground">최대 깊이</label>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n} disabled={n < minDepth}>
                  H{n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['num', '번호 매기기', numbered, setNumbered],
                ['link', '링크 포함', withLinks, setWithLinks],
                ['inline', '본문에 삽입', insertInline, setInsertInline],
              ] as const
            ).map(([id, label, val, setter]) => (
              <label
                key={id}
                className={`flex items-center gap-1.5 text-[11px] px-2 h-8 rounded-md border cursor-pointer ${
                  val ? 'bg-primary/10 border-primary/40' : 'bg-background hover:bg-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => setter(e.target.checked)}
                  className="h-3 w-3"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Markdown 원본
              </h2>
              <span className="text-[10px] text-muted-foreground">
                헤딩 {headings.length}개
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={20}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y"
              spellCheck={false} aria-label="Markdown 원본" />
          </div>

          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {insertInline ? '문서 + 목차' : '목차'}
              </h2>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span className="ml-1">복사</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    triggerDownload(
                      new Blob([finalOutput], { type: 'text/markdown;charset=utf-8' }),
                      insertInline ? 'document-with-toc.md' : 'toc.md',
                    )
                  }
                >
                  <Download className="h-3 w-3" />
                  <span className="ml-1">MD</span>
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={finalOutput}
              rows={20}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y" aria-label="결과" />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          코드 블록(```) 안의 # 은 무시 · GitHub 스타일 슬러그 · 중복 헤딩은 자동 번호 부여 ·
          본문 삽입 시 {'<!-- TOC -->'} 마커 사이에 배치
        </p>
      </main>
    </div>
  );
}
