'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** RFC 4122 미리 정의된 네임스페이스 UUID. */
const PRESETS: ReadonlyArray<{ label: string; uuid: string }> = [
  { label: 'DNS', uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'URL', uuid: '6ba7b811-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'OID', uuid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'X500', uuid: '6ba7b814-9dad-11d1-80b4-00c04fd430c8' },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID 문자열을 16바이트 배열로 변환. 형식이 틀리면 null. */
function uuidToBytes(uuid: string): Uint8Array | null {
  const hex = uuid.trim().replace(/-/g, '');
  if (hex.length !== 32 || !/^[0-9a-f]{32}$/i.test(hex)) return null;
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 16바이트를 표준 UUID 문자열로 포맷. */
function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** 네임스페이스 UUID + 이름으로 RFC 4122 v5(SHA-1) UUID 생성. */
async function generateUuidV5(namespace: Uint8Array, name: string): Promise<string> {
  const nameBytes = new TextEncoder().encode(name);
  const message = new Uint8Array(namespace.length + nameBytes.length);
  message.set(namespace, 0);
  message.set(nameBytes, namespace.length);

  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', message));
  const uuid = digest.slice(0, 16);
  // 버전(5) 및 variant(RFC 4122) 비트 설정.
  uuid[6] = (uuid[6] & 0x0f) | 0x50;
  uuid[8] = (uuid[8] & 0x3f) | 0x80;
  return bytesToUuid(uuid);
}

export default function UuidNamespacePage() {
  const [namespace, setNamespace] = useState(PRESETS[0].uuid);
  const [name, setName] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const namespaceValid = useMemo(() => UUID_RE.test(namespace.trim()), [namespace]);

  async function generate() {
    setError(null);
    setResult('');
    const bytes = uuidToBytes(namespace);
    if (!bytes) {
      setError('네임스페이스 UUID 형식이 올바르지 않습니다. (예: 6ba7b810-9dad-11d1-80b4-00c04fd430c8)');
      return;
    }
    try {
      setResult(await generateUuidV5(bytes, name));
    } catch (e) {
      console.error('UUID v5 generation failed', e);
      setError('UUID 를 생성하지 못했습니다.');
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed', e);
      setError('복사에 실패했습니다.');
    }
  }

  function reset() {
    setNamespace(PRESETS[0].uuid);
    setName('');
    setResult('');
    setError(null);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="UUID v5 (네임스페이스)" onReset={reset} widthClass="max-w-xl" />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          네임스페이스 UUID 와 이름으로 결정적 UUID v5(SHA-1)를 생성합니다.
        </p>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">네임스페이스 프리셋</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant={namespace.trim().toLowerCase() === preset.uuid ? 'default' : 'outline'}
                  onClick={() => setNamespace(preset.uuid)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">네임스페이스 UUID</span>
            <Input
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="6ba7b810-9dad-11d1-80b4-00c04fd430c8"
              aria-invalid={!namespaceValid}
              className="font-mono"
            />
            {!namespaceValid && namespace.trim() !== '' && (
              <span className="text-xs text-destructive">UUID 형식이 올바르지 않습니다.</span>
            )}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">이름</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="example.com" />
          </label>

          <Button onClick={generate} disabled={!namespaceValid}>
            생성
          </Button>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-card p-4">
            <p className="break-all font-mono text-sm">{result}</p>
            <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
