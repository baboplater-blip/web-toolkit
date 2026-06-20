'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

/** Adler-32 의 모듈러스(65521 미만의 가장 큰 소수). */
const ADLER_MOD = 65521;

/** UTF-8 바이트열의 Adler-32 체크섬(zlib, 부호 없는 32비트). */
function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    a = (a + bytes[i]) % ADLER_MOD;
    b = (b + a) % ADLER_MOD;
  }
  return ((b << 16) | a) >>> 0;
}

type Adler32Result = {
  hex: string;
  decimal: string;
};

type CopyField = 'hex' | 'decimal';

export default function Adler32HashPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<CopyField | null>(null);

  const result = useMemo<Adler32Result | null>(() => {
    if (!input) return null;
    const bytes = new TextEncoder().encode(input);
    const checksum = adler32(bytes);
    return {
      hex: checksum.toString(16).padStart(8, '0').toUpperCase(),
      decimal: checksum.toString(10),
    };
  }, [input]);

  async function copyField(field: CopyField): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result[field]);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error('[adler32-hash] clipboard write failed', err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="Adler-32 체크섬"
        widthClass="max-w-3xl"
        onReset={input ? () => setInput('') : undefined}
      />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          입력한 텍스트의 Adler-32 체크섬(zlib, mod 65521)을 16진수와 10진수로 계산합니다.
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="여기에 텍스트를 입력하면 실시간으로 체크섬이 계산됩니다"
          aria-label="입력 텍스트"
        />

        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-muted-foreground">
          ⚠️ Adler-32 는 CRC32 보다 빠른 무결성 체크섬입니다. 짧은 입력에서는 분포가 약하며,
          위변조 방지·보안 용도에는 SHA-256 이상을 사용하세요.
        </div>

        <div className="space-y-3">
          <ResultRow
            label="16진수 (8자리)"
            value={result?.hex ?? ''}
            copied={copied === 'hex'}
            onCopy={() => copyField('hex')}
          />
          <ResultRow
            label="10진수 (부호 없음)"
            value={result?.decimal ?? ''}
            copied={copied === 'decimal'}
            onCopy={() => copyField('decimal')}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          모든 계산은 브라우저 안에서만 이뤄지며 입력 내용은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}

type ResultRowProps = {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
};

function ResultRow({ label, value, copied, onCopy }: ResultRowProps) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          disabled={!value}
          aria-label={`${label} 복사`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          복사
        </Button>
      </div>
      <p className="break-all rounded-lg bg-muted p-2.5 font-mono text-sm text-foreground">
        {value || <span className="text-muted-foreground">결과가 여기에 표시됩니다</span>}
      </p>
    </div>
  );
}
