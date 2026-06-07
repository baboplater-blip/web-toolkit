'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Download, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildGitignore,
  type GitignoreTemplate,
  GITIGNORE_TEMPLATES,
} from '@/lib/tools/gitignore-templates';

const GROUP_LABELS: Record<GitignoreTemplate['group'], string> = {
  language: '언어',
  framework: '프레임워크',
  tooling: 'OS · 에디터',
};

const GROUP_ORDER: ReadonlyArray<GitignoreTemplate['group']> = ['language', 'framework', 'tooling'];

export default function GitignoreGenPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => buildGitignore(selected), [selected]);

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      templates: GITIGNORE_TEMPLATES.filter((tpl) => tpl.group === group),
    }));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '.gitignore';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <FileX className="h-5 w-5 text-primary" aria-hidden />
          .gitignore 생성기
        </h1>
        <p className="text-sm text-muted-foreground">언어·프레임워크·OS를 골라 .gitignore 파일을 조합합니다.</p>
      </header>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        {grouped.map(({ group, templates }) => (
          <fieldset key={group} className="space-y-2">
            <legend className="text-sm font-semibold text-muted-foreground">{GROUP_LABELS[group]}</legend>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => {
                const active = selected.includes(tpl.id);
                return (
                  <Button
                    key={tpl.id}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggle(tpl.id)}
                    aria-pressed={active}
                  >
                    {tpl.label}
                  </Button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">.gitignore ({selected.length}개 선택)</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copy} disabled={!output}>
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? '복사됨' : '복사'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={download} disabled={!output}>
              <Download className="h-3.5 w-3.5" aria-hidden />
              다운로드
            </Button>
          </div>
        </div>
        {output ? (
          <pre className="max-h-96 overflow-auto rounded-lg border bg-muted px-3 py-2 font-mono text-xs whitespace-pre">
            {output}
          </pre>
        ) : (
          <p className="rounded-lg border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
            위에서 하나 이상 선택하면 .gitignore 내용이 여기에 표시됩니다.
          </p>
        )}
      </div>
    </main>
  );
}
