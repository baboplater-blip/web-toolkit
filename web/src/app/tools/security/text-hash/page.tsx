'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { md5 } from '@/lib/tools/md5';

/** ArrayBuffer → 소문자 16진 문자열 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

const SUBTLE_ALGOS: ReadonlyArray<Exclude<HashAlgo, 'MD5'>> = ['SHA-1', 'SHA-256', 'SHA-512'];
const ROW_ORDER: ReadonlyArray<HashAlgo> = ['MD5', ...SUBTLE_ALGOS];

export default function TextHashPage() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Record<HashAlgo, string>>({
    MD5: '',
    'SHA-1': '',
    'SHA-256': '',
    'SHA-512': '',
  });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<HashAlgo | null>(null);

  // 입력이 바뀔 때마다 실시간으로 모든 해시를 다시 계산한다.
  useEffect(() => {
    let cancelled = false;

    async function computeHashes(): Promise<void> {
      // 첫 await 로 동기 setState 를 피한다(effect 내 즉시 setState 경고 회피).
      if (!input) {
        await Promise.resolve();
        if (cancelled) return;
        setHashes({ MD5: '', 'SHA-1': '', 'SHA-256': '', 'SHA-512': '' });
        setError(null);
        return;
      }

      const bytes = new TextEncoder().encode(input);
      try {
        const subtleResults = await Promise.all(
          SUBTLE_ALGOS.map((algo) => crypto.subtle.digest(algo, bytes)),
        );
        if (cancelled) return;

        const next: Record<HashAlgo, string> = {
          MD5: md5(bytes),
          'SHA-1': bufferToHex(subtleResults[0]),
          'SHA-256': bufferToHex(subtleResults[1]),
          'SHA-512': bufferToHex(subtleResults[2]),
        };
        setHashes(next);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('[text-hash] digest failed', err);
        setError('해시 계산 중 오류가 발생했습니다. 브라우저가 WebCrypto 를 지원하는지 확인하세요.');
      }
    }

    void computeHashes();
    return () => {
      cancelled = true;
    };
  }, [input]);

  async function copyHash(algo: HashAlgo): Promise<void> {
    const value = hashes[algo];
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(algo);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error('[text-hash] clipboard write failed', err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="텍스트 해시"
        widthClass="max-w-3xl"
        onReset={input ? () => setInput('') : undefined}
      />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          입력한 텍스트의 MD5·SHA-1·SHA-256·SHA-512 해시를 생성합니다.
        </p>

      <textarea
        className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="여기에 텍스트를 입력하면 실시간으로 해시가 계산됩니다"
        aria-label="입력 텍스트"
      />

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-muted-foreground leading-relaxed">
        ⚠️ MD5·SHA-1 은 무결성 체크섬용입니다. 비밀번호 저장·서명엔 충돌에 안전한 SHA-256 이상을
        쓰세요.
      </div>

      <div className="space-y-3">
        {ROW_ORDER.map((algo) => (
          <div key={algo} className="rounded-xl border bg-card p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {algo}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyHash(algo)}
                disabled={!hashes[algo]}
                aria-label={`${algo} 해시 복사`}
              >
                {copied === algo ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                복사
              </Button>
            </div>
            <p className="break-all rounded-lg bg-muted p-2.5 font-mono text-xs text-foreground">
              {hashes[algo] || <span className="text-muted-foreground">결과가 여기에 표시됩니다</span>}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        모든 해시는 브라우저 내부에서만 계산되며 입력 내용은 서버로 전송되지 않습니다.
      </p>
      </main>
    </div>
  );
}
