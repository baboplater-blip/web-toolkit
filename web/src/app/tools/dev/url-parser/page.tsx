'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Link2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Parsed {
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: Array<[string, string]>;
}

function tryParse(input: string): Parsed | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { error: '' };
  try {
    const u = new URL(trimmed);
    return {
      protocol: u.protocol,
      username: u.username,
      password: u.password,
      host: u.host,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      params: [...u.searchParams.entries()],
    };
  } catch {
    return {
      error:
        '유효한 절대 URL 이 아닙니다. https:// 등 스키마를 포함해 입력해 주세요.',
    };
  }
}

function rebuild(parts: Parsed): string {
  try {
    const u = new URL(`${parts.protocol}//${parts.host}`);
    if (parts.username) u.username = parts.username;
    if (parts.password) u.password = parts.password;
    u.pathname = parts.pathname || '/';
    const sp = new URLSearchParams();
    for (const [k, v] of parts.params) {
      if (k) sp.append(k, v);
    }
    const qs = sp.toString();
    u.search = qs ? `?${qs}` : '';
    u.hash = parts.hash || '';
    return u.toString();
  } catch {
    return '';
  }
}

export default function UrlParserPage() {
  const [input, setInput] = useState('https://example.com/search?q=hello+world&page=2#results');
  const [overrideParams, setOverrideParams] = useState<
    Array<[string, string]> | null
  >(null);
  const [copied, setCopied] = useState<string | null>(null);

  const parsedRaw = useMemo(() => tryParse(input), [input]);
  const parsed = 'error' in parsedRaw ? null : parsedRaw;
  const error = parsed ? null : (parsedRaw as { error: string }).error;

  const activeParams = overrideParams ?? parsed?.params ?? [];
  const rebuilt = useMemo(() => {
    if (!parsed) return '';
    return rebuild({ ...parsed, params: activeParams });
  }, [parsed, activeParams]);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* noop */
    }
  };

  const setParam = (i: number, key: string, value: string) => {
    const base = overrideParams ?? parsed?.params ?? [];
    const next = [...base];
    next[i] = [key, value];
    setOverrideParams(next);
  };
  const removeParam = (i: number) => {
    const base = overrideParams ?? parsed?.params ?? [];
    setOverrideParams(base.filter((_, idx) => idx !== i));
  };
  const addParam = () => {
    const base = overrideParams ?? parsed?.params ?? [];
    setOverrideParams([...base, ['key', 'value']]);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({
              variant: 'ghost',
              size: 'icon',
              className: 'h-8 w-8',
            })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <Link2 className="h-5 w-5" />
          <h1 className="font-semibold text-base">URL 파서</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <label className="text-xs font-medium block" htmlFor="url-input">
            URL 입력
          </label>
          <Input
            id="url-input"
            type="url"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOverrideParams(null);
            }}
            placeholder="https://example.com/path?key=value#hash"
            className="font-mono text-xs"
            aria-label="URL 입력"
          />
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>

        {parsed && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                구성 요소
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FieldRow
                  label="protocol"
                  value={parsed.protocol}
                  copied={copied === 'protocol'}
                  onCopy={() => copy('protocol', parsed.protocol)}
                />
                <FieldRow
                  label="hostname"
                  value={parsed.hostname}
                  copied={copied === 'hostname'}
                  onCopy={() => copy('hostname', parsed.hostname)}
                />
                <FieldRow
                  label="port"
                  value={parsed.port || '(기본)'}
                  copied={copied === 'port'}
                  onCopy={() => copy('port', parsed.port)}
                />
                <FieldRow
                  label="username"
                  value={parsed.username || '—'}
                  copied={copied === 'username'}
                  onCopy={() => copy('username', parsed.username)}
                />
                <FieldRow
                  label="pathname"
                  value={parsed.pathname}
                  copied={copied === 'pathname'}
                  onCopy={() => copy('pathname', parsed.pathname)}
                />
                <FieldRow
                  label="hash"
                  value={parsed.hash || '—'}
                  copied={copied === 'hash'}
                  onCopy={() => copy('hash', parsed.hash)}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  쿼리 파라미터 ({activeParams.length}개)
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={addParam}
                >
                  + 추가
                </Button>
              </div>
              <Separator />
              {activeParams.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  쿼리 파라미터가 없습니다.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activeParams.map(([k, v], i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                      <Input
                        type="text"
                        value={k}
                        onChange={(e) => setParam(i, e.target.value, v)}
                        placeholder="key"
                        className="font-mono text-xs"
                        aria-label={`파라미터 ${i + 1} 키`}
                      />
                      <Input
                        type="text"
                        value={v}
                        onChange={(e) => setParam(i, k, e.target.value)}
                        placeholder="value"
                        className="font-mono text-xs"
                        aria-label={`파라미터 ${i + 1} 값`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={() => removeParam(i)}
                        aria-label={`파라미터 ${i + 1} 삭제`}
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {rebuilt && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    재조립된 URL
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => copy('rebuilt', rebuilt)}
                  >
                    {copied === 'rebuilt' ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        복사
                      </>
                    )}
                  </Button>
                </div>
                <p className="rounded-lg border bg-muted px-3 py-2 text-xs font-mono break-all">
                  {rebuilt}
                </p>
              </div>
            )}
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            브라우저 표준 <code className="font-mono">URL</code> /{' '}
            <code className="font-mono">URLSearchParams</code> 를 사용해 URL 을 분해·재조립합니다.
            파라미터를 추가/수정/삭제하면 결과 URL이 즉시 재생성됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function FieldRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-2.5 space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
          {label}
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground"
          aria-label={`${label} 복사`}
          title="복사"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <p className="text-xs font-mono break-all">{value}</p>
    </div>
  );
}
