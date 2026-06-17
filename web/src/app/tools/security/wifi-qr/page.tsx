'use client';

import { useState } from 'react';
import { Download, Loader2, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

type Security = 'WPA' | 'WEP' | 'nopass';

const QR_SIZE = 512;
const QR_MARGIN = 2;

/** WIFI 페이로드의 특수문자(`\ ; , : "`)를 백슬래시로 이스케이프 */
function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/gu, '\\$1');
}

/** SSID·비밀번호·보안유형으로 WIFI: 페이로드 문자열 생성 */
function buildWifiPayload(
  ssid: string,
  password: string,
  security: Security,
  hidden: boolean,
): string {
  const type = security === 'nopass' ? 'nopass' : security;
  const escapedSsid = escapeWifiValue(ssid);
  const passwordPart = security === 'nopass' ? '' : `P:${escapeWifiValue(password)};`;
  const hiddenPart = hidden ? 'H:true;' : '';
  return `WIFI:T:${type};S:${escapedSsid};${passwordPart}${hiddenPart};`;
}

export default function WifiQrPage() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [security, setSecurity] = useState<Security>('WPA');
  const [hidden, setHidden] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSsid('');
    setPassword('');
    setSecurity('WPA');
    setHidden(false);
    setQrDataUrl(null);
    setBusy(false);
    setError(null);
  }

  async function generate() {
    if (!ssid) {
      setError('네트워크 이름(SSID)을 입력하세요.');
      return;
    }
    if (security !== 'nopass' && !password) {
      setError('비밀번호를 입력하세요.');
      return;
    }

    setBusy(true);
    setError(null);
    setQrDataUrl(null);
    try {
      const payload = buildWifiPayload(ssid, password, security, hidden);
      const QR = (await import('qrcode')).default;
      const dataUrl = await QR.toDataURL(payload, { width: QR_SIZE, margin: QR_MARGIN });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('WiFi QR generation failed', err);
      setError('QR 코드 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      triggerDownload(blob, 'wifi-qr.png');
    } catch (err) {
      console.error('WiFi QR download failed', err);
      setError('다운로드에 실패했습니다.');
    }
  }

  const passwordDisabled = security === 'nopass';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="WiFi QR 생성기" onReset={reset} widthClass="max-w-xl" />

      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          WiFi 접속 정보를 QR 코드로 만들어 손쉽게 공유합니다. 모든 처리는 브라우저 안에서
          이뤄집니다.
        </p>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">네트워크 이름 (SSID)</span>
            <Input
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="WiFi 이름"
              aria-label="네트워크 이름"
            />
          </label>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium">보안 유형</span>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { value: 'WPA', label: 'WPA/WPA2' },
                  { value: 'WEP', label: 'WEP' },
                  { value: 'nopass', label: '없음' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSecurity(opt.value)}
                  className={`h-8 rounded-md border text-xs ${
                    security === opt.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">비밀번호</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={passwordDisabled ? '보안 없음' : 'WiFi 비밀번호'}
              disabled={passwordDisabled}
              aria-label="비밀번호"
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">숨김 네트워크</span>
          </label>

          <Button onClick={generate} disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            {busy ? '생성 중...' : 'QR 코드 생성'}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {qrDataUrl && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="WiFi QR 코드" className="max-h-[50vh] max-w-full" />
            </div>
            <Button onClick={download} className="w-full">
              <Download className="h-4 w-4" />
              PNG 다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
