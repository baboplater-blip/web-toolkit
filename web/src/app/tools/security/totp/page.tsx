'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type Algo = 'SHA-1' | 'SHA-256' | 'SHA-512';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/[\s=-]/g, '');
  if (!cleaned) return new Uint8Array(0);
  for (const ch of cleaned) {
    if (!BASE32_ALPHABET.includes(ch)) {
      throw new Error(`잘못된 Base32 문자: ${ch}`);
    }
  }
  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;
  for (const ch of cleaned) {
    const v = BASE32_ALPHABET.indexOf(ch);
    buffer = (buffer << 5) | v;
    bitsCollected += 5;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

async function hmac(
  algo: Algo,
  keyBytes: Uint8Array,
  msgBytes: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    { name: 'HMAC', hash: algo },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgBytes as BufferSource);
  return new Uint8Array(sig);
}

function counterToBytes(counter: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x1_0000_0000));
  view.setUint32(4, counter >>> 0);
  return new Uint8Array(buf);
}

async function generateOTP(
  secret: string,
  counter: number,
  digits: number,
  algo: Algo,
): Promise<string> {
  const key = base32Decode(secret);
  if (key.length === 0) throw new Error('비밀키가 비어있습니다.');
  const msg = counterToBytes(counter);
  const h = await hmac(algo, key, msg);
  const offset = h[h.length - 1] & 0x0f;
  const code =
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff);
  const otp = (code % 10 ** digits).toString().padStart(digits, '0');
  return otp;
}

export default function TotpPage() {
  const [secret, setSecret] = useState('JBSWY3DPEHPK3PXP');
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [algo, setAlgo] = useState<Algo>('SHA-1');
  const [showSecret, setShowSecret] = useState(false);
  const [otp, setOtp] = useState<string>('');
  const [next, setNext] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [copied, setCopied] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 200);
    tickRef.current = t;
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    const counter = Math.floor(now / 1000 / period);
    try {
      const cur = await generateOTP(secret, counter, digits, algo);
      const nxt = await generateOTP(secret, counter + 1, digits, algo);
      setOtp(cur);
      setNext(nxt);
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패');
      setOtp('');
      setNext('');
    }
  }, [secret, digits, period, algo, now]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const elapsedInPeriod = Math.floor(now / 1000) % period;
  const remaining = period - elapsedInPeriod;
  const progressPct = Math.round(((period - remaining) / period) * 100);

  const copyOtp = async () => {
    if (!otp) return;
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const maskedSecret = useMemo(() => {
    if (!secret) return '';
    if (showSecret) return secret;
    return secret.replace(/./g, '•');
  }, [secret, showSecret]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
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
            <Fingerprint className="h-5 w-5" />
            <h1 className="font-semibold text-base">TOTP 인증코드 생성기</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium block" htmlFor="totp-secret">
              비밀키 (Base32)
            </label>
            <div className="flex gap-1.5">
              <Input
                id="totp-secret"
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value.toUpperCase())}
                placeholder="예: JBSWY3DPEHPK3PXP"
                className="font-mono"
                aria-label="Base32 비밀키"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
                aria-label={showSecret ? '비밀키 숨기기' : '비밀키 보이기'}
                title={showSecret ? '숨기기' : '보이기'}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono break-all">
              {showSecret ? '' : maskedSecret}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="totp-digits">
                자릿수
              </label>
              <select
                id="totp-digits"
                value={digits}
                onChange={(e) => setDigits(Number(e.target.value))}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                aria-label="자릿수"
              >
                {[6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}자리
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="totp-period">
                갱신 주기
              </label>
              <select
                id="totp-period"
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                aria-label="갱신 주기 (초)"
              >
                {[15, 30, 60].map((n) => (
                  <option key={n} value={n}>
                    {n}초
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="totp-algo">
                알고리즘
              </label>
              <select
                id="totp-algo"
                value={algo}
                onChange={(e) => setAlgo(e.target.value as Algo)}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                aria-label="해시 알고리즘"
              >
                <option value="SHA-1">SHA-1 (기본)</option>
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-512">SHA-512</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && otp && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                현재 코드
              </h2>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {remaining}초 남음
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p
                className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-widest"
                aria-live="polite"
              >
                {otp.replace(/(\d{3})(?=\d)/g, '$1 ')}
              </p>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={copyOtp}
                >
                  {copied ? (
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={refresh}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  재생성
                </Button>
              </div>
            </div>
            <div
              className="h-1.5 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`코드 갱신까지 ${remaining}초 남음`}
            >
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${100 - progressPct}%` }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                다음 코드
              </span>
              <p className="text-base font-mono tabular-nums text-muted-foreground tracking-wider">
                {next.replace(/(\d{3})(?=\d)/g, '$1 ')}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1.5">
          <p>
            <strong className="text-foreground">RFC 6238 TOTP</strong> 표준 구현.
            Google Authenticator·Authy·1Password 등과 호환.
          </p>
          <p>
            otpauth URI 의 <code className="font-mono text-foreground">secret=...</code>{' '}
            파라미터를 그대로 붙여넣으면 됩니다. 비밀키는 브라우저 외부로 전송되지 않습니다.
          </p>
          <p>
            <strong className="text-foreground">기본 설정</strong>: SHA-1, 6자리, 30초.
            대부분의 서비스가 이 조합을 사용합니다.
          </p>
        </div>
      </main>
    </div>
  );
}
