'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';

type Usage = 'encrypt' | 'sign';
type Bits = 2048 | 3072 | 4096;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(binary);
}

function chunk(s: string, n: number): string {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out.join('\n');
}

function toPem(label: string, der: ArrayBuffer): string {
  const b64 = bytesToBase64(new Uint8Array(der));
  return `-----BEGIN ${label}-----\n${chunk(b64, 64)}\n-----END ${label}-----\n`;
}

async function generateKeyPair(
  bits: Bits,
  usage: Usage,
): Promise<{ publicPem: string; privatePem: string }> {
  const algo =
    usage === 'sign'
      ? {
          name: 'RSA-PSS',
          modulusLength: bits,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        }
      : {
          name: 'RSA-OAEP',
          modulusLength: bits,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        };
  const usages: KeyUsage[] =
    usage === 'sign' ? ['sign', 'verify'] : ['encrypt', 'decrypt'];
  const pair = (await crypto.subtle.generateKey(algo, true, usages)) as CryptoKeyPair;
  const pub = await crypto.subtle.exportKey('spki', pair.publicKey);
  const priv = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  return {
    publicPem: toPem('PUBLIC KEY', pub),
    privatePem: toPem('PRIVATE KEY', priv),
  };
}

export default function RsaKeypairPage() {
  const [bits, setBits] = useState<Bits>(2048);
  const [usage, setUsage] = useState<Usage>('sign');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    publicPem: string;
    privatePem: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'pub' | 'priv' | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const pair = await generateKeyPair(bits, usage);
      setResult(pair);
    } catch (err) {
      setError(err instanceof Error ? err.message : '키 생성 실패');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (kind: 'pub' | 'priv', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  };

  const download = (name: string, content: string) => {
    const blob = new Blob([content], { type: 'application/x-pem-file' });
    triggerDownload(blob, name);
  };

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
            <KeyRound className="h-5 w-5" />
            <h1 className="font-semibold text-base">RSA 키페어 생성</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="rsa-bits">
                키 크기
              </label>
              <select
                id="rsa-bits"
                value={bits}
                onChange={(e) => setBits(Number(e.target.value) as Bits)}
                disabled={busy}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                aria-label="키 크기"
              >
                <option value={2048}>2048비트 (권장 · 빠름)</option>
                <option value={3072}>3072비트 (강함)</option>
                <option value={4096}>4096비트 (매우 강함 · 느림)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="rsa-usage">
                용도
              </label>
              <select
                id="rsa-usage"
                value={usage}
                onChange={(e) => setUsage(e.target.value as Usage)}
                disabled={busy}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                aria-label="용도"
              >
                <option value="sign">서명·검증 (RSA-PSS)</option>
                <option value="encrypt">암호화·복호화 (RSA-OAEP)</option>
              </select>
            </div>
          </div>
          <Button onClick={generate} disabled={busy} className="w-full">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4 mr-1.5" />
                키페어 생성
              </>
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            4096비트는 기기에 따라 5~30초 걸릴 수 있습니다.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <>
            <KeyPanel
              title="공개 키 (Public Key)"
              hint="다른 사람에게 공유해도 안전합니다. PEM/SPKI 형식."
              pem={result.publicPem}
              copied={copied === 'pub'}
              onCopy={() => copy('pub', result.publicPem)}
              onDownload={() => download(`rsa-${bits}-public.pem`, result.publicPem)}
            />
            <KeyPanel
              title="개인 키 (Private Key)"
              hint="절대 공개·전송 금지. PEM/PKCS#8 형식. 안전한 곳에 보관하세요."
              pem={result.privatePem}
              copied={copied === 'priv'}
              onCopy={() => copy('priv', result.privatePem)}
              onDownload={() => download(`rsa-${bits}-private.pem`, result.privatePem)}
              danger
            />
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1.5">
          <p>
            <strong className="text-foreground">Web Crypto API</strong> 의{' '}
            <code className="font-mono">SubtleCrypto.generateKey</code> 로 브라우저
            내에서 직접 생성됩니다.
          </p>
          <p>
            <strong className="text-foreground">2048비트</strong> 는 현재 대부분의 용도에
            충분합니다. NIST 권장은 2030년까지 2048비트, 이후 3072비트 이상.
          </p>
          <p>
            출력은 <strong className="text-foreground">PEM (Base64 + 헤더)</strong> 형식.
            OpenSSH·OpenSSL·JWT 라이브러리에서 그대로 사용 가능.
          </p>
        </div>
      </main>
    </div>
  );
}

function KeyPanel({
  title,
  hint,
  pem,
  copied,
  onCopy,
  onDownload,
  danger,
}: {
  title: string;
  hint: string;
  pem: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 space-y-3 ${
        danger ? 'border-destructive/40' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h2
          className={`text-sm font-semibold ${
            danger ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {title}
        </h2>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCopy}>
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
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onDownload}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            .pem
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      <Separator />
      <textarea
        readOnly
        value={pem}
        rows={8}
        className="w-full rounded-lg border bg-muted px-3 py-2 text-[11px] font-mono resize-y"
        aria-label={title}
      />
    </div>
  );
}
