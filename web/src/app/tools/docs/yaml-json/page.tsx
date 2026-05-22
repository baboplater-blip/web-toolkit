'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, Check, Copy, Download, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';

type Direction = 'yaml-to-json' | 'json-to-yaml';

const SAMPLE_YAML = `name: web-toolkit
version: 1.0.0
authors:
  - alice
  - bob
features:
  tools: 46
  free: true`;

export default function YamlJsonPage() {
  const [dir, setDir] = useState<Direction>('yaml-to-json');
  const [input, setInput] = useState(SAMPLE_YAML);
  const [output, setOutput] = useState('');
  const [prettyJson, setPrettyJson] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      if (!input.trim()) {
        setOutput('');
        return;
      }
      try {
        const yaml = await import('js-yaml');
        if (dir === 'yaml-to-json') {
          const parsed = yaml.load(input);
          if (!cancelled) setOutput(JSON.stringify(parsed, null, prettyJson ? 2 : 0));
        } else {
          const parsed = JSON.parse(input);
          if (!cancelled) setOutput(yaml.dump(parsed, { indent: 2, lineWidth: 120, noRefs: true }));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '변환 실패');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [input, dir, prettyJson]);

  const swap = () => {
    setInput(output);
    setDir(dir === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json');
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const ext = dir === 'yaml-to-json' ? 'json' : 'yaml';
    triggerDownload(new Blob([output], { type: 'text/plain' }), `converted.${ext}`);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <FileCode className="h-5 w-5" />
            <h1 className="font-semibold text-base">YAML ↔ JSON</h1>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={swap}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            방향 전환
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDir('yaml-to-json')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'yaml-to-json'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            YAML → JSON
          </button>
          <button
            type="button"
            onClick={() => setDir('json-to-yaml')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'json-to-yaml'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            JSON → YAML
          </button>
        </div>

        {dir === 'yaml-to-json' && (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={prettyJson}
              onChange={(e) => setPrettyJson(e.target.checked)}
            />
            JSON 정렬 (들여쓰기 2)
          </label>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">
              입력 ({dir === 'yaml-to-json' ? 'YAML' : 'JSON'})
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false}
            />
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">출력</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={18}
              className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y"
            />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">js-yaml (MIT)</p>
      </main>
    </div>
  );
}
