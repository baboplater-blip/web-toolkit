'use client';

import { useState } from 'react';
import { Check, Copy, KeySquare, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * 바이트 배열을 base64url (패딩 없음) 로 인코딩한다.
 * jwt-decoder(dev/jwt) 의 base64UrlDecode 와 역대칭 컨벤션을 따른다:
 *   '+' → '-', '/' → '_', '=' 패딩 제거.
 */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 문자열을 UTF-8 바이트로 인코딩 후 base64url 로 변환한다. */
function base64UrlEncodeString(value: string): string {
  return base64UrlEncode(new TextEncoder().encode(value));
}

const DEFAULT_PAYLOAD = JSON.stringify(
  {
    sub: '1234567890',
    name: 'Aiden',
    iat: 1700000000,
    exp: 1900000000,
  },
  null,
  2,
);

const HEADER = { alg: 'HS256', typ: 'JWT' } as const;

export default function JwtEncoderPage() {
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [signing, setSigning] = useState(false);

  async function sign(): Promise<void> {
    setError(null);
    setToken('');
    setCopied(false);

    // 페이로드 JSON 검증
    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      setError('페이로드가 올바른 JSON 형식이 아닙니다. 중괄호와 따옴표를 확인하세요.');
      return;
    }
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      setError('페이로드는 JSON 객체여야 합니다 (예: { "sub": "123" }).');
      return;
    }

    if (!secret) {
      setError('서명에 사용할 시크릿을 입력하세요.');
      return;
    }

    setSigning(true);
    try {
      // header.payload 의 서명 대상 문자열 구성
      const encodedHeader = base64UrlEncodeString(JSON.stringify(HEADER));
      const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
      const signingInput = `${encodedHeader}.${encodedPayload}`;

      // HMAC-SHA256 키 import 후 서명
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(signingInput),
      );
      const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));

      setToken(`${signingInput}.${encodedSignature}`);
    } catch (err) {
      console.error('[jwt-encoder] signing failed', err);
      setError('서명 생성 중 오류가 발생했습니다. 브라우저가 WebCrypto HMAC 을 지원하는지 확인하세요.');
    } finally {
      setSigning(false);
    }
  }

  async function copy(): Promise<void> {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[jwt-encoder] clipboard write failed', err);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <KeySquare className="h-5 w-5 text-primary" aria-hidden />
          JWT 서명 생성
        </h1>
        <p className="text-sm text-muted-foreground">
          헤더·페이로드·시크릿으로 HS256 서명된 JWT 를 만듭니다.
        </p>
      </header>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">헤더 (Header)</span>
          <pre className="rounded-lg bg-muted p-3 font-mono text-xs">
            {JSON.stringify(HEADER, null, 2)}
          </pre>
          <p className="text-xs text-muted-foreground">알고리즘은 HS256 으로 고정됩니다.</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">페이로드 (Payload, JSON)</span>
          <textarea
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full resize-y rounded-lg border bg-background p-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder='{ "sub": "123", "name": "홍길동" }'
            aria-label="페이로드 JSON"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">시크릿 (Secret)</span>
          <Input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="HMAC 서명에 사용할 비밀 키"
            autoComplete="off"
            className="font-mono"
            aria-label="시크릿"
          />
        </label>

        <Button onClick={sign} disabled={signing} className="w-full">
          {signing ? '서명 중…' : 'JWT 생성'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {token && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              생성된 토큰
            </span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                복사
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setToken('');
                  setCopied(false);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                지우기
              </Button>
            </div>
          </div>
          <p className="break-all rounded-lg bg-muted p-3 font-mono text-xs">{token}</p>
          <p className="text-xs text-muted-foreground">
            ⚠️ 민감정보입니다 — 토큰은 인증에 사용되므로 클립보드·화면에 남지 않도록 사용 후
            지우세요.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        서명은 브라우저 내부 WebCrypto 로만 계산되며 시크릿과 페이로드는 서버로 전송되지 않습니다.
      </p>
    </main>
  );
}
