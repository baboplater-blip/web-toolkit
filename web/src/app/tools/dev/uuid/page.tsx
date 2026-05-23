'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Download, Hexagon, RefreshCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';

type Format = 'default' | 'upper' | 'nohyphen' | 'braces';

function generateUuidV4(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function formatUuid(u: string, format: Format): string {
  switch (format) {
    case 'upper':
      return u.toUpperCase();
    case 'nohyphen':
      return u.replace(/-/g, '');
    case 'braces':
      return `{${u}}`;
    default:
      return u;
  }
}

export default function UuidPage() {
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<Format>('default');
  const [list, setList] = useState<string[]>(() =>
    Array.from({ length: 10 }, () => generateUuidV4()),
  );
  const [copiedIdx, setCopiedIdx] = useState<number | 'all' | null>(null);

  const generate = () => {
    const n = Math.max(1, Math.min(10000, count));
    setList(Array.from({ length: n }, () => generateUuidV4()));
  };

  const formatted = list.map((u) => formatUuid(u, format));

  const copyOne = async (i: number) => {
    await navigator.clipboard.writeText(formatted[i]);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(formatted.join('\n'));
    setCopiedIdx('all');
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const downloadTxt = () => {
    triggerDownload(new Blob([formatted.join('\n')], { type: 'text/plain' }), 'uuids.txt');
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Hexagon className="h-5 w-5" />
            <h1 className="font-semibold text-base">UUID 생성</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">생성 개수</label>
              <Input
                type="number"
                min={1}
                max={10000}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">포맷</label>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    ['default', '기본'],
                    ['upper', '대문자'],
                    ['nohyphen', '하이픈 없이'],
                    ['braces', '{중괄호}'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormat(v)}
                    className={`h-8 text-[10px] rounded-md border ${
                      format === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={generate} className="w-full">
            <RefreshCw className="h-4 w-4" />
            재생성
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              생성된 UUID ({list.length}개)
            </h2>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyAll}>
                {copiedIdx === 'all' ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span className="ml-1">전체 복사</span>
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={downloadTxt}>
                <Download className="h-3 w-3" />
                <span className="ml-1">TXT</span>
              </Button>
            </div>
          </div>
          <Separator />
          <div className="max-h-[60vh] overflow-y-auto space-y-1">
            {formatted.map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs font-mono"
              >
                <span className="text-muted-foreground w-8 text-right shrink-0">#{i + 1}</span>
                <span className="flex-1 truncate">{u}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => copyOne(i)}
                >
                  {copiedIdx === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          UUID v4 · crypto.randomUUID() 또는 crypto.getRandomValues fallback
        </p>
      </main>
    </div>
  );
}
