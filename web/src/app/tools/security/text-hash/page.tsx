'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * RFC 1321 MD5 구현 (의존성 없음).
 * WebCrypto 는 MD5 를 지원하지 않으므로 직접 구현한다.
 * 입력은 UTF-8 바이트 배열을 받는다.
 */
function md5(bytes: Uint8Array): string {
  const rotateLeft = (value: number, shift: number): number =>
    (value << shift) | (value >>> (32 - shift));

  // 모듈러 32비트 덧셈 (부호 문제 회피)
  const addUnsigned = (a: number, b: number): number => {
    const lsw = (a & 0xffff) + (b & 0xffff);
    const msw = (a >>> 16) + (b >>> 16) + (lsw >>> 16);
    return ((msw << 16) | (lsw & 0xffff)) >>> 0;
  };

  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, (b & c) | (~b & d)), addUnsigned(x, t)), s), b);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, (b & d) | (c & ~d)), addUnsigned(x, t)), s), b);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, b ^ c ^ d), addUnsigned(x, t)), s), b);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, c ^ (b | ~d)), addUnsigned(x, t)), s), b);

  // 메시지를 512비트(16 word) 블록으로 패딩
  const wordCount = (((bytes.length + 8) >>> 6) + 1) * 16;
  const words = new Array<number>(wordCount).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  }
  words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
  const bitLength = bytes.length * 8;
  words[wordCount - 2] = bitLength >>> 0;
  words[wordCount - 1] = Math.floor(bitLength / 0x100000000) >>> 0;

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let i = 0; i < wordCount; i += 16) {
    const oldA = a;
    const oldB = b;
    const oldC = c;
    const oldD = d;

    a = ff(a, b, c, d, words[i + 0], 7, 0xd76aa478);
    d = ff(d, a, b, c, words[i + 1], 12, 0xe8c7b756);
    c = ff(c, d, a, b, words[i + 2], 17, 0x242070db);
    b = ff(b, c, d, a, words[i + 3], 22, 0xc1bdceee);
    a = ff(a, b, c, d, words[i + 4], 7, 0xf57c0faf);
    d = ff(d, a, b, c, words[i + 5], 12, 0x4787c62a);
    c = ff(c, d, a, b, words[i + 6], 17, 0xa8304613);
    b = ff(b, c, d, a, words[i + 7], 22, 0xfd469501);
    a = ff(a, b, c, d, words[i + 8], 7, 0x698098d8);
    d = ff(d, a, b, c, words[i + 9], 12, 0x8b44f7af);
    c = ff(c, d, a, b, words[i + 10], 17, 0xffff5bb1);
    b = ff(b, c, d, a, words[i + 11], 22, 0x895cd7be);
    a = ff(a, b, c, d, words[i + 12], 7, 0x6b901122);
    d = ff(d, a, b, c, words[i + 13], 12, 0xfd987193);
    c = ff(c, d, a, b, words[i + 14], 17, 0xa679438e);
    b = ff(b, c, d, a, words[i + 15], 22, 0x49b40821);

    a = gg(a, b, c, d, words[i + 1], 5, 0xf61e2562);
    d = gg(d, a, b, c, words[i + 6], 9, 0xc040b340);
    c = gg(c, d, a, b, words[i + 11], 14, 0x265e5a51);
    b = gg(b, c, d, a, words[i + 0], 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, words[i + 5], 5, 0xd62f105d);
    d = gg(d, a, b, c, words[i + 10], 9, 0x02441453);
    c = gg(c, d, a, b, words[i + 15], 14, 0xd8a1e681);
    b = gg(b, c, d, a, words[i + 4], 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, words[i + 9], 5, 0x21e1cde6);
    d = gg(d, a, b, c, words[i + 14], 9, 0xc33707d6);
    c = gg(c, d, a, b, words[i + 3], 14, 0xf4d50d87);
    b = gg(b, c, d, a, words[i + 8], 20, 0x455a14ed);
    a = gg(a, b, c, d, words[i + 13], 5, 0xa9e3e905);
    d = gg(d, a, b, c, words[i + 2], 9, 0xfcefa3f8);
    c = gg(c, d, a, b, words[i + 7], 14, 0x676f02d9);
    b = gg(b, c, d, a, words[i + 12], 20, 0x8d2a4c8a);

    a = hh(a, b, c, d, words[i + 5], 4, 0xfffa3942);
    d = hh(d, a, b, c, words[i + 8], 11, 0x8771f681);
    c = hh(c, d, a, b, words[i + 11], 16, 0x6d9d6122);
    b = hh(b, c, d, a, words[i + 14], 23, 0xfde5380c);
    a = hh(a, b, c, d, words[i + 1], 4, 0xa4beea44);
    d = hh(d, a, b, c, words[i + 4], 11, 0x4bdecfa9);
    c = hh(c, d, a, b, words[i + 7], 16, 0xf6bb4b60);
    b = hh(b, c, d, a, words[i + 10], 23, 0xbebfbc70);
    a = hh(a, b, c, d, words[i + 13], 4, 0x289b7ec6);
    d = hh(d, a, b, c, words[i + 0], 11, 0xeaa127fa);
    c = hh(c, d, a, b, words[i + 3], 16, 0xd4ef3085);
    b = hh(b, c, d, a, words[i + 6], 23, 0x04881d05);
    a = hh(a, b, c, d, words[i + 9], 4, 0xd9d4d039);
    d = hh(d, a, b, c, words[i + 12], 11, 0xe6db99e5);
    c = hh(c, d, a, b, words[i + 15], 16, 0x1fa27cf8);
    b = hh(b, c, d, a, words[i + 2], 23, 0xc4ac5665);

    a = ii(a, b, c, d, words[i + 0], 6, 0xf4292244);
    d = ii(d, a, b, c, words[i + 7], 10, 0x432aff97);
    c = ii(c, d, a, b, words[i + 14], 15, 0xab9423a7);
    b = ii(b, c, d, a, words[i + 5], 21, 0xfc93a039);
    a = ii(a, b, c, d, words[i + 12], 6, 0x655b59c3);
    d = ii(d, a, b, c, words[i + 3], 10, 0x8f0ccc92);
    c = ii(c, d, a, b, words[i + 10], 15, 0xffeff47d);
    b = ii(b, c, d, a, words[i + 1], 21, 0x85845dd1);
    a = ii(a, b, c, d, words[i + 8], 6, 0x6fa87e4f);
    d = ii(d, a, b, c, words[i + 15], 10, 0xfe2ce6e0);
    c = ii(c, d, a, b, words[i + 6], 15, 0xa3014314);
    b = ii(b, c, d, a, words[i + 13], 21, 0x4e0811a1);
    a = ii(a, b, c, d, words[i + 4], 6, 0xf7537e82);
    d = ii(d, a, b, c, words[i + 11], 10, 0xbd3af235);
    c = ii(c, d, a, b, words[i + 2], 15, 0x2ad7d2bb);
    b = ii(b, c, d, a, words[i + 9], 21, 0xeb86d391);

    a = addUnsigned(a, oldA);
    b = addUnsigned(b, oldB);
    c = addUnsigned(c, oldC);
    d = addUnsigned(d, oldD);
  }

  // little-endian 32비트 word 4개 → 16진 문자열
  const toHex = (value: number): string => {
    let hex = '';
    for (let i = 0; i < 4; i++) {
      hex += ((value >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return hex;
  };
  return toHex(a) + toHex(b) + toHex(c) + toHex(d);
}

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
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Fingerprint className="h-5 w-5 text-primary" aria-hidden />
          텍스트 해시
        </h1>
        <p className="text-sm text-muted-foreground">
          입력한 텍스트의 MD5·SHA-1·SHA-256·SHA-512 해시를 생성합니다.
        </p>
      </header>

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
  );
}
