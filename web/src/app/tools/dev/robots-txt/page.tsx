'use client';

import { useMemo, useState } from 'react';
import { Bot, Copy, Check, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface RuleGroup {
  userAgent: string;
  allow: string;
  disallow: string;
  crawlDelay: string;
}

function emptyGroup(): RuleGroup {
  return { userAgent: '*', allow: '', disallow: '', crawlDelay: '' };
}

/** 멀티라인 텍스트를 줄 단위로 정리(공백 줄 제거·트림). */
function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** 규칙 그룹·사이트맵에서 robots.txt 본문을 생성한다. */
function buildRobots(groups: RuleGroup[], sitemaps: string): string {
  const blocks: string[] = [];

  for (const group of groups) {
    const agent = group.userAgent.trim() || '*';
    const lines: string[] = [`User-agent: ${agent}`];
    for (const path of splitLines(group.allow)) lines.push(`Allow: ${path}`);
    for (const path of splitLines(group.disallow)) lines.push(`Disallow: ${path}`);

    const delay = group.crawlDelay.trim();
    if (delay !== '' && Number.isFinite(Number(delay))) {
      lines.push(`Crawl-delay: ${Number(delay)}`);
    }
    blocks.push(lines.join('\n'));
  }

  const sitemapLines = splitLines(sitemaps).map((url) => `Sitemap: ${url}`);
  const body = blocks.join('\n\n');
  return sitemapLines.length > 0 ? `${body}\n\n${sitemapLines.join('\n')}` : body;
}

export default function RobotsTxtPage() {
  const [groups, setGroups] = useState<RuleGroup[]>([emptyGroup()]);
  const [sitemaps, setSitemaps] = useState('');
  const [copied, setCopied] = useState(false);

  function updateGroup(index: number, patch: Partial<RuleGroup>) {
    setGroups((prev) => prev.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  }

  function addGroup() {
    setGroups((prev) => [...prev, emptyGroup()]);
  }

  function removeGroup(index: number) {
    setGroups((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const output = useMemo(() => buildRobots(groups, sitemaps), [groups, sitemaps]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'robots.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setGroups([emptyGroup()]);
    setSitemaps('');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="robots.txt 생성기" widthClass="max-w-2xl" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4 text-primary" aria-hidden />
          크롤러 규칙(robots.txt)을 그룹별로 생성합니다.
        </p>

        {groups.map((group, index) => (
          <div key={index} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">규칙 그룹 {index + 1}</span>
              {groups.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGroup(index)}
                  aria-label={`그룹 ${index + 1} 삭제`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium">User-agent</span>
              <Input
                value={group.userAgent}
                onChange={(e) => updateGroup(index, { userAgent: e.target.value })}
                placeholder="* (모든 크롤러)"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Allow (줄마다 한 경로)</span>
              <textarea
                className="min-h-16 w-full rounded-lg border bg-transparent p-2.5 font-mono text-sm"
                value={group.allow}
                onChange={(e) => updateGroup(index, { allow: e.target.value })}
                placeholder="/public/"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Disallow (줄마다 한 경로)</span>
              <textarea
                className="min-h-16 w-full rounded-lg border bg-transparent p-2.5 font-mono text-sm"
                value={group.disallow}
                onChange={(e) => updateGroup(index, { disallow: e.target.value })}
                placeholder="/admin/"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Crawl-delay (초, 선택)</span>
              <Input
                inputMode="numeric"
                value={group.crawlDelay}
                onChange={(e) => updateGroup(index, { crawlDelay: e.target.value })}
                placeholder="예: 10"
              />
            </label>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-3.5 w-3.5" />
          규칙 그룹 추가
        </Button>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Sitemap URL (줄마다 한 개)</span>
            <textarea
              className="min-h-16 w-full rounded-lg border bg-transparent p-2.5 font-mono text-sm"
              value={sitemaps}
              onChange={(e) => setSitemaps(e.target.value)}
              placeholder="https://example.com/sitemap.xml"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">결과</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copy} disabled={!output}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </Button>
              <Button variant="outline" size="sm" onClick={download} disabled={!output}>
                다운로드
              </Button>
            </div>
          </div>
          <textarea
            className="min-h-48 w-full rounded-xl border bg-muted/40 p-3 font-mono text-xs"
            value={output}
            readOnly
            aria-label="생성된 robots.txt"
          />
        </div>
      </main>
    </div>
  );
}
