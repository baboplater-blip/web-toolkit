'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Unit = 'ms' | 's';

export default function TimestampPage() {
  // SSR/클라이언트 시각 차이로 인한 하이드레이션 불일치를 막기 위해
  // 시간 의존 상태는 결정적 초기값으로 두고 마운트 후 useEffect 에서 채운다.
  const [now, setNow] = useState(0);
  const [tsInput, setTsInput] = useState('');
  const [unit, setUnit] = useState<Unit>('s');
  const [isoInput, setIsoInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // 마운트 후 1회 클라이언트 시각 주입(하이드레이션 안전). 의도된 패턴.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    setTsInput(String(Math.floor(Date.now() / 1000)));
    setIsoInput(new Date().toISOString().slice(0, 19));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const tsNum = Number(tsInput);
  const fromTimestamp = tsInput.trim() !== '' && Number.isFinite(tsNum)
    ? new Date(unit === 's' ? tsNum * 1000 : tsNum)
    : null;
  const fromIso = (() => {
    try {
      const d = new Date(isoInput);
      if (Number.isNaN(d.getTime())) return null;
      return d;
    } catch {
      return null;
    }
  })();

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  }

  function handleReset() {
    setTsInput(String(Math.floor(Date.now() / 1000)));
    setUnit('s');
    setIsoInput(new Date().toISOString().slice(0, 19));
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="타임스탬프 변환" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Unix 타임스탬프와 ISO·로컬 시각을 상호 변환합니다.
        </p>

      <section className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            지금
          </h2>
          <Button variant="ghost" size="sm" onClick={() => copy('now-s', String(Math.floor(now / 1000)))}>
            {copied === 'now-s' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-[10px] text-muted-foreground">Unix (초)</p>
            <p className="font-mono">{now > 0 ? Math.floor(now / 1000) : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Unix (밀리초)</p>
            <p className="font-mono">{now > 0 ? now : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">ISO 8601 (UTC)</p>
            <p className="font-mono text-xs">{now > 0 ? new Date(now).toISOString() : '—'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          타임스탬프 → 날짜
        </h2>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            placeholder="1716383040"
            className="font-mono" aria-label="타임스탬프 → 날짜" />
          <div className="flex gap-1">
            {(['s', 'ms'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`h-9 rounded-md border px-3 text-xs ${
                  unit === u
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {u === 's' ? '초' : 'ms'}
              </button>
            ))}
          </div>
        </div>
        {fromTimestamp && (
          <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs">{fromTimestamp.toISOString()}</span>
              <Button variant="ghost" size="sm" onClick={() => copy('ts-iso', fromTimestamp.toISOString())}>
                {copied === 'ts-iso' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{fromTimestamp.toLocaleString('ko-KR')}</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          날짜 → 타임스탬프
        </h2>
        <Input
          type="datetime-local"
          value={isoInput}
          onChange={(e) => setIsoInput(e.target.value)}
          step="1"
          className="font-mono" aria-label="날짜 → 타임스탬프" />
        {fromIso && (
          <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs">초: {Math.floor(fromIso.getTime() / 1000)}</span>
              <Button variant="ghost" size="sm" onClick={() => copy('iso-s', String(Math.floor(fromIso.getTime() / 1000)))}>
                {copied === 'iso-s' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs">ms: {fromIso.getTime()}</span>
              <Button variant="ghost" size="sm" onClick={() => copy('iso-ms', String(fromIso.getTime()))}>
                {copied === 'iso-ms' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        )}
      </section>
      </main>
    </div>
  );
}
