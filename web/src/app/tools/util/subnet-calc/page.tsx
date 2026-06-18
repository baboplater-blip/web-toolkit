'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { parseIpv4, computeSubnet, type SubnetResult } from '@/lib/tools/subnet-calc';

function ResultRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm tabular-nums">{value}</p>
      </div>
      <Button variant="outline" size="xs" onClick={copy}>
        {copied ? '복사됨' : '복사'}
      </Button>
    </div>
  );
}

export default function SubnetCalcPage() {
  const [ip, setIp] = useState('192.168.0.1');
  const [prefix, setPrefix] = useState(24);

  const parsed = useMemo(() => {
    if (ip.trim() === '') return { value: null, error: null as string | null };
    const value = parseIpv4(ip);
    if (value === null) {
      return { value: null, error: '올바른 IPv4 주소를 입력하세요. (예: 192.168.0.1)' };
    }
    return { value, error: null };
  }, [ip]);

  const result = useMemo<SubnetResult | null>(() => {
    if (parsed.value === null) return null;
    return computeSubnet(parsed.value, prefix);
  }, [parsed.value, prefix]);

  function reset(): void {
    setIp('192.168.0.1');
    setPrefix(24);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="서브넷 계산기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">IPv4 주소</span>
            <Input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="예: 192.168.0.1"
              spellCheck={false}
              aria-invalid={parsed.error !== null}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">프리픽스 (CIDR): /{prefix}</span>
            <input
              type="range"
              min={0}
              max={32}
              step={1}
              value={prefix}
              onChange={(e) => setPrefix(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="CIDR 프리픽스"
            />
          </label>
        </div>

        {parsed.error !== null && (
          <p className="text-sm text-destructive">{parsed.error}</p>
        )}

        {result !== null && (
          <div className="rounded-xl border bg-card p-4">
            <ResultRow label="넷마스크" value={result.netmask} />
            <ResultRow label="와일드카드 마스크" value={result.wildcard} />
            <ResultRow label="네트워크 주소" value={result.network} />
            <ResultRow label="브로드캐스트 주소" value={result.broadcast} />
            <ResultRow label="첫 사용가능 호스트" value={result.firstHost} />
            <ResultRow label="끝 사용가능 호스트" value={result.lastHost} />
            <ResultRow label="사용가능 호스트 수" value={result.usableHosts.toLocaleString('ko-KR')} />
          </div>
        )}
      </main>
    </div>
  );
}
