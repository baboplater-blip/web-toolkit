'use client';

import { useMemo, useState } from 'react';
import { Network } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface SubnetResult {
  netmask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  usableHosts: number;
}

const OCTET_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** 점-십진 IPv4 문자열을 32비트 부호 없는 정수로 변환. 형식·범위 오류 시 null. */
function parseIpv4(ip: string): number | null {
  const match = OCTET_PATTERN.exec(ip.trim());
  if (!match) return null;

  let value = 0;
  for (let i = 1; i <= 4; i += 1) {
    const octet = Number(match[i]);
    if (octet > 255) return null;
    // 선행 0 (예: 01) 은 모호하므로 거부.
    if (match[i].length > 1 && match[i].startsWith('0')) return null;
    value = value * 256 + octet;
  }
  return value >>> 0;
}

/** 32비트 부호 없는 정수를 점-십진 IPv4 문자열로 변환. */
function formatIpv4(value: number): string {
  const v = value >>> 0;
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff].join('.');
}

function computeSubnet(ipValue: number, prefix: number): SubnetResult {
  // prefix 0 일 때 0xFFFFFFFF << 32 는 JS 에서 정의되지 않으므로 분기 처리.
  const maskValue = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardValue = (~maskValue) >>> 0;
  const networkValue = (ipValue & maskValue) >>> 0;
  const broadcastValue = (networkValue | wildcardValue) >>> 0;

  // /31, /32 는 사용 가능 호스트 관례가 다르다(호스트 비트 0~1개).
  const totalAddresses = prefix === 32 ? 1 : 2 ** (32 - prefix);
  const usableHosts = totalAddresses > 2 ? totalAddresses - 2 : 0;

  const hasUsableRange = usableHosts > 0;
  const firstHostValue = hasUsableRange ? (networkValue + 1) >>> 0 : networkValue;
  const lastHostValue = hasUsableRange ? (broadcastValue - 1) >>> 0 : broadcastValue;

  return {
    netmask: formatIpv4(maskValue),
    wildcard: formatIpv4(wildcardValue),
    network: formatIpv4(networkValue),
    broadcast: formatIpv4(broadcastValue),
    firstHost: formatIpv4(firstHostValue),
    lastHost: formatIpv4(lastHostValue),
    usableHosts,
  };
}

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
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Network className="h-5 w-5 text-primary" aria-hidden />
            서브넷 계산기
          </h1>
          <p className="text-sm text-muted-foreground">
            IPv4 CIDR 의 넷마스크·네트워크·브로드캐스트·호스트 범위를 계산합니다.
          </p>
        </header>

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
