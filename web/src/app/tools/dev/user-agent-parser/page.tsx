'use client';

import { useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type DeviceType = '데스크톱' | '모바일' | '태블릿' | '봇';

interface UaInfo {
  browser: string;
  engine: string;
  os: string;
  device: DeviceType;
}

interface Matcher {
  regex: RegExp;
  format: (match: RegExpMatchArray) => string;
}

const BROWSER_MATCHERS: Matcher[] = [
  { regex: /Edg(?:e|A|iOS)?\/([\d.]+)/, format: (m) => `Edge ${m[1]}` },
  { regex: /OPR\/([\d.]+)/, format: (m) => `Opera ${m[1]}` },
  { regex: /Opera\/([\d.]+)/, format: (m) => `Opera ${m[1]}` },
  { regex: /SamsungBrowser\/([\d.]+)/, format: (m) => `Samsung Internet ${m[1]}` },
  { regex: /Firefox\/([\d.]+)/, format: (m) => `Firefox ${m[1]}` },
  { regex: /FxiOS\/([\d.]+)/, format: (m) => `Firefox ${m[1]}` },
  { regex: /Chrome\/([\d.]+)/, format: (m) => `Chrome ${m[1]}` },
  { regex: /CriOS\/([\d.]+)/, format: (m) => `Chrome ${m[1]}` },
  // Safari 는 Version/ 토큰에 실제 버전이 있고 Safari/ 는 빌드 번호
  { regex: /Version\/([\d.]+).*Safari\//, format: (m) => `Safari ${m[1]}` },
];

const ENGINE_MATCHERS: Matcher[] = [
  { regex: /Gecko\/[\d.]+ Firefox/, format: () => 'Gecko' },
  { regex: /AppleWebKit\/([\d.]+)/, format: (m) => `WebKit ${m[1]}` },
  { regex: /Trident\/([\d.]+)/, format: (m) => `Trident ${m[1]}` },
  { regex: /Presto\/([\d.]+)/, format: (m) => `Presto ${m[1]}` },
];

function detectBrowser(ua: string): string {
  for (const matcher of BROWSER_MATCHERS) {
    const match = ua.match(matcher.regex);
    if (match) return matcher.format(match);
  }
  return '알 수 없음';
}

function detectEngine(ua: string): string {
  // Chromium 계열은 Blink — AppleWebKit 와 함께 Chrome/Edg 토큰이 있으면 Blink
  if (/(Chrome|Chromium|Edg|OPR|SamsungBrowser)\//.test(ua) && /AppleWebKit/.test(ua)) {
    return 'Blink';
  }
  for (const matcher of ENGINE_MATCHERS) {
    const match = ua.match(matcher.regex);
    if (match) return matcher.format(match);
  }
  return '알 수 없음';
}

function detectOs(ua: string): string {
  const windowsNt = ua.match(/Windows NT ([\d.]+)/);
  if (windowsNt) {
    const versions: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    return `Windows ${versions[windowsNt[1]] ?? windowsNt[1]}`;
  }
  const iphone = ua.match(/iPhone OS ([\d_]+)/);
  if (iphone) return `iOS ${iphone[1].replace(/_/g, '.')}`;
  const ipad = ua.match(/CPU OS ([\d_]+) like Mac/);
  if (ipad) return `iPadOS ${ipad[1].replace(/_/g, '.')}`;
  const android = ua.match(/Android ([\d.]+)/);
  if (android) return `Android ${android[1]}`;
  const mac = ua.match(/Mac OS X ([\d_]+)/);
  if (mac) return `macOS ${mac[1].replace(/_/g, '.')}`;
  if (/CrOS/.test(ua)) return 'Chrome OS';
  if (/Linux/.test(ua)) return 'Linux';
  return '알 수 없음';
}

function detectDevice(ua: string): DeviceType {
  if (/bot|crawler|spider|crawling|slurp|googlebot|bingbot|duckduckbot|baiduspider|yandex/i.test(ua)) {
    return '봇';
  }
  // iPad / Android 태블릿(Mobile 토큰 없는 Android)
  if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) || /Tablet/i.test(ua)) {
    return '태블릿';
  }
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) {
    return '모바일';
  }
  return '데스크톱';
}

function parseUserAgent(ua: string): UaInfo {
  return {
    browser: detectBrowser(ua),
    engine: detectEngine(ua),
    os: detectOs(ua),
    device: detectDevice(ua),
  };
}

export default function UserAgentParserPage() {
  const [input, setInput] = useState('');

  const info = useMemo(() => (input.trim() ? parseUserAgent(input.trim()) : null), [input]);

  function fillCurrent() {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      setInput(navigator.userAgent);
    }
  }

  function reset() {
    setInput('');
  }

  const rows: ReadonlyArray<{ label: string; value: string }> = info
    ? [
        { label: '브라우저', value: info.browser },
        { label: '렌더링 엔진', value: info.engine },
        { label: '운영체제', value: info.os },
        { label: '기기 유형', value: info.device },
      ]
    : [];

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="User-Agent 분석" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4 text-primary" aria-hidden />
          User-Agent 문자열에서 브라우저·엔진·OS·기기를 추출합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">User-Agent 문자열</span>
          <textarea
            className="min-h-28 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="User-Agent 문자열을 붙여넣으세요"
            aria-label="User-Agent 입력"
          />
        </label>

        <Button variant="outline" onClick={fillCurrent}>
          내 User-Agent 채우기
        </Button>

        {info && (
          <div className="overflow-hidden rounded-xl border bg-card">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b px-4 py-2.5 last:border-b-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="font-mono text-sm font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
