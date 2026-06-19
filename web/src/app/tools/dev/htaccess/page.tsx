'use client';

import { useMemo, useState } from 'react';
import { Forward, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type RedirectCode = '301' | '302';
type WwwMode = 'none' | 'www' | 'non-www';

interface HtaccessOptions {
  redirectFrom: string;
  redirectTo: string;
  redirectCode: RedirectCode;
  forceHttps: boolean;
  wwwMode: WwwMode;
}

/** RewriteEngine 지시문이 필요한 규칙(HTTPS/www)이 하나라도 켜져 있는지. */
function needsRewriteEngine(options: HtaccessOptions): boolean {
  return options.forceHttps || options.wwwMode !== 'none';
}

function buildHtaccess(options: HtaccessOptions): string {
  const lines: string[] = [];

  if (needsRewriteEngine(options)) {
    lines.push('RewriteEngine On');

    if (options.forceHttps) {
      lines.push('');
      lines.push('# HTTP → HTTPS 강제');
      lines.push('RewriteCond %{HTTPS} off');
      lines.push('RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]');
    }

    if (options.wwwMode === 'www') {
      lines.push('');
      lines.push('# non-www → www');
      lines.push('RewriteCond %{HTTP_HOST} !^www\\. [NC]');
      lines.push('RewriteRule ^ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]');
    } else if (options.wwwMode === 'non-www') {
      lines.push('');
      lines.push('# www → non-www');
      lines.push('RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]');
      lines.push('RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]');
    }
  }

  const from = options.redirectFrom.trim();
  const to = options.redirectTo.trim();
  if (from !== '' && to !== '') {
    if (lines.length > 0) lines.push('');
    lines.push(`# 경로 리다이렉트 (${options.redirectCode})`);
    lines.push(`Redirect ${options.redirectCode} ${from} ${to}`);
  }

  return lines.join('\n');
}

export default function HtaccessRedirectPage() {
  const [redirectFrom, setRedirectFrom] = useState('');
  const [redirectTo, setRedirectTo] = useState('');
  const [redirectCode, setRedirectCode] = useState<RedirectCode>('301');
  const [forceHttps, setForceHttps] = useState(false);
  const [wwwMode, setWwwMode] = useState<WwwMode>('none');
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => buildHtaccess({ redirectFrom, redirectTo, redirectCode, forceHttps, wwwMode }),
    [redirectFrom, redirectTo, redirectCode, forceHttps, wwwMode],
  );

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setRedirectFrom('');
    setRedirectTo('');
    setRedirectCode('301');
    setForceHttps(false);
    setWwwMode('none');
    setCopied(false);
  }

  const hasInput =
    redirectFrom.trim() !== '' || redirectTo.trim() !== '' || forceHttps || wwwMode !== 'none';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title=".htaccess 리다이렉트 생성" onReset={hasInput ? reset : undefined} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Forward className="h-4 w-4 text-primary" aria-hidden />
          Apache .htaccess 리다이렉트·HTTPS·www 규칙을 만듭니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">경로 리다이렉트</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">From (경로)</span>
              <Input
                value={redirectFrom}
                onChange={(event) => setRedirectFrom(event.target.value)}
                placeholder="/old-page"
                aria-label="리다이렉트 From 경로"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">To (URL)</span>
              <Input
                value={redirectTo}
                onChange={(event) => setRedirectTo(event.target.value)}
                placeholder="https://example.com/new"
                aria-label="리다이렉트 To URL"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">상태 코드</span>
            <select
              value={redirectCode}
              onChange={(event) => setRedirectCode(event.target.value as RedirectCode)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              aria-label="리다이렉트 상태 코드"
            >
              <option value="301">301 (영구)</option>
              <option value="302">302 (임시)</option>
            </select>
          </label>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={forceHttps}
              onChange={(event) => setForceHttps(event.target.checked)}
              className="h-4 w-4"
            />
            <span className="font-medium">HTTPS 강제</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">도메인</span>
            <select
              value={wwwMode}
              onChange={(event) => setWwwMode(event.target.value as WwwMode)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              aria-label="www 정규화 모드"
            >
              <option value="none">변경 없음</option>
              <option value="www">www 강제</option>
              <option value="non-www">non-www 강제</option>
            </select>
          </label>
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">.htaccess</span>
            <Button variant="outline" size="sm" onClick={copy} disabled={!output} aria-label="결과 복사">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap break-all">
            {output || '옵션을 선택하면 규칙이 표시됩니다.'}
          </pre>
        </div>
      </main>
    </div>
  );
}
