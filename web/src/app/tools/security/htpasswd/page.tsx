'use client';

import { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * .htpasswd 한 줄을 생성하는 브라우저 전용 도구.
 *
 * 지원 방식:
 *  - {SHA}: SHA-1 해시 → base64 (crypto.subtle 사용). 솔트 없음(Apache 표준 동작).
 *  - APR1-MD5: Apache 의 md5crypt($apr1$...). 외부 라이브러리 없이 순수 JS 로 구현.
 *
 * bcrypt 는 순수 JS 로 안전·빠르게 구현하기 어렵고 별도 라이브러리가 필요하므로
 * 본 도구에서는 제외하고 안내 문구로 대체한다.
 *
 * 모든 계산은 브라우저 내부에서만 수행되며 비밀번호는 서버로 전송되지 않는다.
 */

type HashMethod = 'sha' | 'apr1';

/** APR1/base64 전용 알파벳 (표준 base64 와 순서가 다름). */
const APR1_ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** 솔트 생성에 사용할 문자 집합 ([./0-9A-Za-z]). */
const SALT_CHARS = APR1_ITOA64;

/**
 * crypto.getRandomValues 기반으로 지정 길이의 랜덤 솔트를 생성한다.
 * Math.random 은 암호학적으로 안전하지 않으므로 사용하지 않는다.
 */
function generateSalt(length: number): string {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += SALT_CHARS[randomBytes[i] % SALT_CHARS.length];
  }
  return salt;
}

/** {SHA} 방식: UTF-8 비밀번호의 SHA-1 → base64. */
async function hashSha(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-1', data);
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `{SHA}${btoa(binary)}`;
}

/**
 * Apache md5crypt 출력의 마지막 16바이트 다이제스트를 24자 base64(APR1 알파벳)로
 * 인코딩한다. 바이트 순서·그룹 매핑은 원본 md5crypt 구현(to64 루프)을 따른다.
 */
function encodeApr1Digest(digest: Uint8Array): string {
  let result = '';

  /** 3바이트(24비트)를 4개의 6비트 인덱스로 쪼개 인코딩한다. */
  const appendGroup = (b0: number, b1: number, b2: number, count: number): void => {
    let value = (b0 << 16) | (b1 << 8) | b2;
    for (let i = 0; i < count; i++) {
      result += APR1_ITOA64[value & 0x3f];
      value >>= 6;
    }
  };

  // md5crypt 고정 바이트 순서 (RFC 가 아닌 Apache 구현 관례).
  appendGroup(digest[0], digest[6], digest[12], 4);
  appendGroup(digest[1], digest[7], digest[13], 4);
  appendGroup(digest[2], digest[8], digest[14], 4);
  appendGroup(digest[3], digest[9], digest[15], 4);
  appendGroup(digest[4], digest[10], digest[5], 4);
  appendGroup(0, 0, digest[11], 2);

  return result;
}

/**
 * crypto.subtle.digest('MD5') 는 브라우저에서 지원되지 않으므로 MD5 를 자체 구현한다.
 * (RFC 1321) 입력·출력 모두 바이트 배열로 처리해 멀티바이트 문자도 안전하게 다룬다.
 */
function md5(message: Uint8Array): Uint8Array {
  const rotateLeft = (value: number, shift: number): number =>
    (value << shift) | (value >>> (32 - shift));
  const toUnsigned = (value: number): number => value >>> 0;

  // 비트 길이를 64비트로 보존하기 위해 하위/상위 32비트를 분리해 다룬다.
  const originalLengthBits = message.length * 8;
  const paddedLength = ((message.length + 8) >> 6 << 6) + 64;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(message);
  bytes[message.length] = 0x80;

  const lengthLow = toUnsigned(originalLengthBits);
  const lengthHigh = Math.floor(originalLengthBits / 0x100000000);
  bytes[paddedLength - 8] = lengthLow & 0xff;
  bytes[paddedLength - 7] = (lengthLow >>> 8) & 0xff;
  bytes[paddedLength - 6] = (lengthLow >>> 16) & 0xff;
  bytes[paddedLength - 5] = (lengthLow >>> 24) & 0xff;
  bytes[paddedLength - 4] = lengthHigh & 0xff;
  bytes[paddedLength - 3] = (lengthHigh >>> 8) & 0xff;
  bytes[paddedLength - 2] = (lengthHigh >>> 16) & 0xff;
  bytes[paddedLength - 1] = (lengthHigh >>> 24) & 0xff;

  const shiftAmounts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  // 상수 K[i] = floor(2^32 * abs(sin(i + 1))).
  const sineConstants = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    sineConstants[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const block = new Uint32Array(16);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      const j = offset + i * 4;
      block[i] = bytes[j] | (bytes[j + 1] << 8) | (bytes[j + 2] << 16) | (bytes[j + 3] << 24);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const sum = toUnsigned(a + f + sineConstants[i] + block[g]);
      a = d;
      d = c;
      c = b;
      b = toUnsigned(b + rotateLeft(sum, shiftAmounts[i]));
    }

    a0 = toUnsigned(a0 + a);
    b0 = toUnsigned(b0 + b);
    c0 = toUnsigned(c0 + c);
    d0 = toUnsigned(d0 + d);
  }

  const digest = new Uint8Array(16);
  const words = [a0, b0, c0, d0];
  for (let i = 0; i < 4; i++) {
    digest[i * 4] = words[i] & 0xff;
    digest[i * 4 + 1] = (words[i] >>> 8) & 0xff;
    digest[i * 4 + 2] = (words[i] >>> 16) & 0xff;
    digest[i * 4 + 3] = (words[i] >>> 24) & 0xff;
  }
  return digest;
}

/** 여러 Uint8Array 를 하나로 이어 붙인다. */
function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let position = 0;
  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }
  return result;
}

/**
 * Apache APR1 md5crypt 해시($apr1$<salt>$<digest>)를 생성한다.
 * 알고리즘은 Apache/Glibc md5crypt 원본을 그대로 따른다(1000회 스트레칭 포함).
 */
function hashApr1(password: string, salt: string): string {
  const magic = '$apr1$';
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const magicBytes = encoder.encode(magic);
  const saltBytes = encoder.encode(salt);

  // altSum = md5(password + salt + password) — 길이 채움에 사용할 보조 다이제스트.
  const altSum = md5(concatBytes(passwordBytes, saltBytes, passwordBytes));

  // 1차 컨텍스트는 password + magic + salt 로 시작한 뒤, altSum 을 password 길이만큼
  // 반복해 "이어 붙이고" 한 번에 해시한다(원본 md5crypt 는 누적 컨텍스트에 추가).
  const contextParts: Uint8Array[] = [passwordBytes, magicBytes, saltBytes];

  for (let remaining = passwordBytes.length; remaining > 0; remaining -= 16) {
    const take = Math.min(remaining, 16);
    contextParts.push(altSum.subarray(0, take));
  }

  // password 길이의 비트에 따라 0x00 또는 password 첫 바이트를 추가한다.
  const tail: number[] = [];
  for (let bits = passwordBytes.length; bits > 0; bits >>= 1) {
    tail.push((bits & 1) !== 0 ? 0 : passwordBytes[0]);
  }
  contextParts.push(Uint8Array.from(tail));

  let digest = md5(concatBytes(...contextParts));

  // 1000회 반복 스트레칭.
  for (let round = 0; round < 1000; round++) {
    const parts: Uint8Array[] = [];
    parts.push((round & 1) !== 0 ? passwordBytes : digest);
    if (round % 3 !== 0) parts.push(saltBytes);
    if (round % 7 !== 0) parts.push(passwordBytes);
    parts.push((round & 1) !== 0 ? digest : passwordBytes);
    digest = md5(concatBytes(...parts));
  }

  return `${magic}${salt}$${encodeApr1Digest(digest)}`;
}

export default function HtpasswdPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<HashMethod>('apr1');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function generate(): Promise<void> {
    setError(null);
    setResult('');
    setCopied(false);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('사용자명을 입력하세요.');
      return;
    }
    if (trimmedUsername.includes(':')) {
      setError('사용자명에는 콜론(:)을 사용할 수 없습니다. .htpasswd 형식에서 콜론은 구분자입니다.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력하세요.');
      return;
    }

    setGenerating(true);
    try {
      let hashed: string;
      if (method === 'sha') {
        hashed = await hashSha(password);
      } else {
        hashed = hashApr1(password, generateSalt(8));
      }
      setResult(`${trimmedUsername}:${hashed}`);
    } catch (err) {
      console.error('[htpasswd] hashing failed', err);
      setError('해시 생성 중 오류가 발생했습니다. 브라우저가 WebCrypto 를 지원하는지 확인하세요.');
    } finally {
      setGenerating(false);
    }
  }

  async function copy(): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[htpasswd] clipboard write failed', err);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden />
          .htpasswd 생성기
        </h1>
        <p className="text-sm text-muted-foreground">
          사용자명·비밀번호로 Apache .htpasswd 항목을 만듭니다(APR1-MD5 / SHA-1).
        </p>
      </header>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">사용자명</span>
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="예: admin"
            autoComplete="off"
            aria-label="사용자명"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">비밀번호</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
            autoComplete="new-password"
            aria-label="비밀번호"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">해시 방식</legend>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="htpasswd-method"
              checked={method === 'apr1'}
              onChange={() => setMethod('apr1')}
              className="mt-1"
            />
            <span>
              <span className="font-medium">APR1-MD5</span> (<code className="font-mono text-xs">$apr1$</code>)
              <span className="block text-xs text-muted-foreground">
                Apache 전용 MD5. 솔트 포함. 모든 Apache 버전·플랫폼에서 권장.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="htpasswd-method"
              checked={method === 'sha'}
              onChange={() => setMethod('sha')}
              className="mt-1"
            />
            <span>
              <span className="font-medium">SHA-1</span> (<code className="font-mono text-xs">{'{SHA}'}</code>)
              <span className="block text-xs text-muted-foreground">
                솔트 없는 SHA-1. 호환성 목적 외에는 APR1-MD5 를 권장합니다.
              </span>
            </span>
          </label>
        </fieldset>

        <Button onClick={generate} disabled={generating} className="w-full">
          {generating ? '생성 중…' : '.htpasswd 항목 생성'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              .htpasswd 항목
            </span>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              복사
            </Button>
          </div>
          <textarea
            value={result}
            readOnly
            rows={2}
            spellCheck={false}
            className="w-full resize-y break-all rounded-lg bg-muted p-3 font-mono text-xs outline-none"
            aria-label="생성된 .htpasswd 항목"
          />
        </div>
      )}

      <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        bcrypt(<code className="font-mono">$2y$</code>)는 안전한 순수 JS 구현에 별도 라이브러리가 필요해 본 도구에서는
        제공하지 않습니다. bcrypt 가 필요하면 서버에서 <code className="font-mono">htpasswd -B</code> 를 사용하세요.
      </p>
      <p className="text-xs text-muted-foreground">
        모든 해시는 브라우저 내부에서만 계산되며 비밀번호는 서버로 전송되지 않습니다.
      </p>
    </main>
  );
}
