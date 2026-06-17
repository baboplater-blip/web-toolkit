'use client';

import { useState } from 'react';
import { Check, Copy, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
type OutputFormat = 'hex' | 'base64';

const ALGORITHMS: readonly HashAlgo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

/** ArrayBuffer 를 소문자 hex 문자열로 변환 */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** ArrayBuffer 를 Base64 문자열로 변환 */
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function HmacGenPage() {
  const [secretKey, setSecretKey] = useState('');
  const [message, setMessage] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgo>('SHA-256');
  const [format, setFormat] = useState<OutputFormat>('hex');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setSecretKey('');
    setMessage('');
    setAlgorithm('SHA-256');
    setFormat('hex');
    setOutput('');
    setBusy(false);
    setError(null);
    setCopied(false);
  }

  async function generate() {
    if (!secretKey) {
      setError('비밀키를 입력하세요.');
      return;
    }
    if (!message) {
      setError('메시지를 입력하세요.');
      return;
    }

    setBusy(true);
    setError(null);
    setOutput('');
    try {
      const encoder = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign'],
      );
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
      setOutput(format === 'hex' ? toHex(signature) : toBase64(signature));
    } catch (err) {
      console.error('HMAC generation failed', err);
      setError('HMAC 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('복사에 실패했습니다.');
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="HMAC 생성기" onReset={reset} widthClass="max-w-xl" />

      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          비밀키와 메시지로 HMAC 을 계산합니다. 모든 처리는 브라우저 안에서 이뤄지며 입력값은
          서버로 전송되지 않습니다.
        </p>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">비밀키</span>
            <Input
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="비밀키를 입력하세요"
              aria-label="비밀키"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">메시지</span>
            <textarea
              className="min-h-32 w-full rounded-lg border bg-background p-2.5 font-mono text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="HMAC 을 계산할 메시지"
              aria-label="메시지"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="block text-sm font-medium">알고리즘</span>
              <div className="grid grid-cols-2 gap-1">
                {ALGORITHMS.map((algo) => (
                  <button
                    key={algo}
                    type="button"
                    onClick={() => setAlgorithm(algo)}
                    className={`h-8 rounded-md border text-xs ${
                      algorithm === algo
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    {algo}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-medium">출력 형식</span>
              <div className="grid grid-cols-2 gap-1">
                {(['hex', 'base64'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`h-8 rounded-md border text-xs ${
                      format === fmt
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    {fmt === 'hex' ? 'Hex' : 'Base64'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={generate} disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {busy ? '계산 중...' : 'HMAC 생성'}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {output && (
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">결과 ({format === 'hex' ? 'Hex' : 'Base64'})</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copy}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    복사
                  </>
                )}
              </Button>
            </div>
            <p className="break-all rounded-lg border bg-muted/40 p-3 font-mono text-sm">{output}</p>
          </div>
        )}
      </main>
    </div>
  );
}
