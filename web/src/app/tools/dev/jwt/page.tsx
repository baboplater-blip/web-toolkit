'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToolHeader } from '@/components/tools/ToolHeader';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFpZGVuIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.dQw4w9WgXcQ';

function base64UrlDecode(s: string): string {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

export default function JwtPage() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const decoded = useMemo(() => {
    const cleaned = token.trim().replace(/^Bearer\s+/i, '');
    if (!cleaned) return null;
    const parts = cleaned.split('.');
    if (parts.length !== 3) {
      return { error: 'JWT 형식이 아닙니다 (3 파트 필요: header.payload.signature)' };
    }
    try {
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const signature = parts[2];

      let expStatus: string | null = null;
      if (typeof payload.exp === 'number') {
        // eslint-disable-next-line react-hooks/purity
        const now = Math.floor(Date.now() / 1000);
        expStatus = payload.exp < now ? 'expired' : 'valid';
      }

      return {
        header,
        payload,
        signature,
        expStatus,
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : '디코딩 실패' };
    }
  }, [token]);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => setToken(SAMPLE_JWT);

  const formatTs = (ts: number) => {
    if (!Number.isFinite(ts)) return String(ts);
    const d = new Date(ts * 1000);
    if (isNaN(d.getTime())) return String(ts);
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="JWT 디코더"
        widthClass="max-w-4xl"
        onReset={token !== SAMPLE_JWT ? handleReset : undefined}
      />

      <main className="p-4 max-w-4xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <label className="text-xs font-medium">JWT 토큰 (Bearer 접두사 허용)</label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y break-all"
            spellCheck={false} aria-label="JWT 토큰 (Bearer 접두사 허용)" />
          <p className="text-[10px] text-muted-foreground">
            토큰은 브라우저에서만 해독되며 서버로 전송되지 않습니다.
          </p>
        </div>

        {decoded && 'error' in decoded && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {decoded.error}
          </div>
        )}

        {decoded && 'header' in decoded && (
          <>
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  헤더 (Header)
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => copy('header', JSON.stringify(decoded.header, null, 2))}
                >
                  {copiedKey === 'header' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <pre className="text-xs font-mono bg-muted rounded-lg p-3 overflow-auto">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </div>

            <div className="rounded-xl border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  페이로드 (Payload)
                </h2>
                <div className="flex items-center gap-2">
                  {decoded.expStatus === 'expired' && (
                    <span className="text-[10px] text-destructive">만료됨</span>
                  )}
                  {decoded.expStatus === 'valid' && (
                    <span className="text-[10px] text-green-500">유효</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => copy('payload', JSON.stringify(decoded.payload, null, 2))}
                  >
                    {copiedKey === 'payload' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <pre className="text-xs font-mono bg-muted rounded-lg p-3 overflow-auto">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
              {/* 표준 클레임 해석 */}
              <div className="space-y-1 text-[11px]">
                {(
                  [
                    ['iat', '발급 시각'],
                    ['exp', '만료 시각'],
                    ['nbf', '활성화 시각'],
                  ] as const
                ).map(([k, label]) => {
                  const v = decoded.payload?.[k];
                  if (typeof v !== 'number') return null;
                  return (
                    <div key={k} className="flex gap-2">
                      <span className="text-muted-foreground w-24">
                        {k} ({label})
                      </span>
                      <span className="font-mono">{formatTs(v)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  시그니처 (Signature)
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => copy('sig', decoded.signature ?? '')}
                >
                  {copiedKey === 'sig' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-xs font-mono bg-muted rounded-lg p-3 break-all">
                {decoded.signature}
              </p>
              <p className="text-[10px] text-muted-foreground">
                시그니처 검증에는 서버 비밀키가 필요하므로 이 도구에서는 수행하지 않습니다.
              </p>
            </div>
          </>
        )}

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          표준 RFC 7519 기반 · Base64URL 디코딩
        </p>
      </main>
    </div>
  );
}
