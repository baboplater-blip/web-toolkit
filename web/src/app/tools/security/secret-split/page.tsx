'use client';

import { useState } from 'react';
import { Check, Copy, Split, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Shamir's Secret Sharing (SSS) 브라우저 전용 구현.
 *
 * GF(256) (다항식 x^8 + x^4 + x^3 + x + 1, 0x11b) 위에서 비밀의 각 바이트마다
 * 독립적인 (K-1)차 다항식을 만들고, x = 1..N 지점의 값을 share 로 분배한다.
 * K 개의 share 가 모이면 라그랑주 보간으로 비밀을 정확히 복원할 수 있다.
 *
 * share 인코딩: 1바이트 x 좌표(1..255) + 비밀과 동일 길이의 y 바이트열.
 * 사용자에게는 16진 또는 base64 문자열로 노출한다.
 *
 * 모든 연산은 브라우저 내부에서만 수행되며 비밀은 서버로 전송되지 않는다.
 */

type ShareEncoding = 'hex' | 'base64';
type Mode = 'split' | 'combine';

// GF(256) 곱셈을 위한 지수/로그 테이블. generator(3) 기준으로 1회 생성한다.
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function buildGaloisTables() {
  let value = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = value;
    GF_LOG[value] = i;
    // generator 3 곱셈: value = value*2 XOR (value*3 - value*2)
    let next = value << 1;
    if (next & 0x100) next ^= 0x11b;
    next ^= value; // 3 = 2 XOR 1 곱
    value = next & 0xff;
  }
  // exp 테이블을 두 배로 확장해 모듈러 없이 인덱싱한다.
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

/** GF(256) 곱셈. 0 은 곱셈 항등원이 없으므로 별도 처리한다. */
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/** GF(256) 나눗셈 (a / b). b 는 0 이 아니어야 한다. */
function gfDiv(a: number, b: number): number {
  if (a === 0) return 0;
  // log[a] - log[b] 가 음수가 될 수 있으므로 255 를 더해 양수화한다.
  return GF_EXP[GF_LOG[a] + 255 - GF_LOG[b]];
}

/**
 * 계수 배열(상수항이 [0])로 표현된 다항식을 x 에서 평가한다(호너 방식).
 */
function evaluatePolynomial(coefficients: Uint8Array, x: number): number {
  let result = 0;
  for (let i = coefficients.length - 1; i >= 0; i--) {
    result = gfMul(result, x) ^ coefficients[i];
  }
  return result;
}

/**
 * 비밀 바이트열을 N 개 share 로 분할한다. 각 share 는 [x, ...y] 바이트 배열.
 * x 좌표는 1..N 을 사용한다(0 은 비밀 자체이므로 share 로 노출하지 않는다).
 */
function splitSecret(secret: Uint8Array, totalShares: number, threshold: number): Uint8Array[] {
  const shares: Uint8Array[] = [];
  for (let shareIndex = 0; shareIndex < totalShares; shareIndex++) {
    const x = shareIndex + 1;
    const shareBytes = new Uint8Array(secret.length + 1);
    shareBytes[0] = x;
    shares.push(shareBytes);
  }

  // 비밀의 각 바이트마다 독립 다항식을 생성한다.
  const randomCoefficients = new Uint8Array(threshold - 1);
  for (let byteIndex = 0; byteIndex < secret.length; byteIndex++) {
    // coefficients[0] = 비밀 바이트(상수항), 나머지는 암호학적 난수.
    if (threshold > 1) {
      crypto.getRandomValues(randomCoefficients);
    }
    const coefficients = new Uint8Array(threshold);
    coefficients[0] = secret[byteIndex];
    for (let i = 1; i < threshold; i++) {
      coefficients[i] = randomCoefficients[i - 1];
    }

    for (let shareIndex = 0; shareIndex < totalShares; shareIndex++) {
      const x = shareIndex + 1;
      shares[shareIndex][byteIndex + 1] = evaluatePolynomial(coefficients, x);
    }
  }

  return shares;
}

/**
 * K 개 이상의 share 로 비밀을 복원한다. 라그랑주 보간을 x = 0 에서 평가한다.
 * 모든 share 는 동일한 y 길이를 가져야 하며 x 좌표는 서로 달라야 한다.
 */
function combineShares(shares: Uint8Array[]): Uint8Array {
  const secretLength = shares[0].length - 1;
  const secret = new Uint8Array(secretLength);
  const xCoordinates = shares.map((share) => share[0]);

  for (let byteIndex = 0; byteIndex < secretLength; byteIndex++) {
    let accumulated = 0;

    for (let i = 0; i < shares.length; i++) {
      const xi = xCoordinates[i];
      const yi = shares[i][byteIndex + 1];

      // 라그랑주 기저 다항식 L_i(0) 계산.
      let numerator = 1;
      let denominator = 1;
      for (let j = 0; j < shares.length; j++) {
        if (i === j) continue;
        const xj = xCoordinates[j];
        numerator = gfMul(numerator, xj); // (0 - xj) = xj (GF 에서 뺄셈=XOR, 0^xj=xj)
        denominator = gfMul(denominator, xi ^ xj);
      }

      const lagrange = gfDiv(numerator, denominator);
      accumulated ^= gfMul(yi, lagrange);
    }

    secret[byteIndex] = accumulated;
  }

  return secret;
}

/** 바이트열을 소문자 16진 문자열로 변환한다. */
function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/** 16진 문자열을 바이트열로 변환한다. 형식이 잘못되면 null 을 반환한다. */
function hexToBytes(hex: string): Uint8Array | null {
  const cleaned = hex.trim().toLowerCase();
  if (cleaned.length === 0 || cleaned.length % 2 !== 0 || !/^[0-9a-f]+$/.test(cleaned)) {
    return null;
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** 바이트열을 base64 문자열로 변환한다. */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** base64 문자열을 바이트열로 변환한다. 형식이 잘못되면 null 을 반환한다. */
function base64ToBytes(value: string): Uint8Array | null {
  const cleaned = value.trim();
  if (cleaned.length === 0) return null;
  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/** 인코딩 방식에 따라 바이트열을 문자열로 변환한다. */
function encodeShare(bytes: Uint8Array, encoding: ShareEncoding): string {
  return encoding === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes);
}

/** 인코딩 방식에 따라 문자열을 바이트열로 디코드한다. */
function decodeShare(value: string, encoding: ShareEncoding): Uint8Array | null {
  return encoding === 'hex' ? hexToBytes(value) : base64ToBytes(value);
}

export default function SecretSplitPage() {
  const [mode, setMode] = useState<Mode>('split');
  const [encoding, setEncoding] = useState<ShareEncoding>('hex');

  // 분할 모드 상태
  const [secret, setSecret] = useState('');
  const [totalShares, setTotalShares] = useState('5');
  const [threshold, setThreshold] = useState('3');
  const [splitOutput, setSplitOutput] = useState('');

  // 복원 모드 상태
  const [combineInput, setCombineInput] = useState('');
  const [restoredSecret, setRestoredSecret] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSplit(): void {
    setError(null);
    setSplitOutput('');
    setCopied(false);

    if (!secret) {
      setError('나눌 비밀(secret)을 입력하세요.');
      return;
    }

    const n = Number.parseInt(totalShares, 10);
    const k = Number.parseInt(threshold, 10);
    if (!Number.isInteger(n) || !Number.isInteger(k)) {
      setError('조각 수(N)와 임계값(K)은 정수여야 합니다.');
      return;
    }
    if (k < 2) {
      setError('임계값(K)은 2 이상이어야 합니다.');
      return;
    }
    if (n < k) {
      setError('조각 수(N)는 임계값(K)보다 크거나 같아야 합니다.');
      return;
    }
    if (n > 255) {
      setError('조각 수(N)는 최대 255 까지 가능합니다(GF(256) 제약).');
      return;
    }

    try {
      const secretBytes = new TextEncoder().encode(secret);
      const shares = splitSecret(secretBytes, n, k);
      const lines = shares.map((share, index) => `share-${index + 1}: ${encodeShare(share, encoding)}`);
      setSplitOutput(lines.join('\n'));
    } catch (err) {
      console.error('[secret-split] split failed', err);
      setError('분할 중 오류가 발생했습니다. 입력값을 확인하세요.');
    }
  }

  function handleCombine(): void {
    setError(null);
    setRestoredSecret('');
    setCopied(false);

    // 한 줄에 하나의 share. "share-1: <값>" 또는 "<값>" 모두 허용한다.
    const rawLines = combineInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const colonIndex = line.lastIndexOf(':');
        return colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : line;
      });

    if (rawLines.length < 2) {
      setError('복원하려면 최소 2개 이상의 조각(share)을 한 줄에 하나씩 입력하세요.');
      return;
    }

    const shares: Uint8Array[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const decoded = decodeShare(rawLines[i], encoding);
      if (decoded === null || decoded.length < 2) {
        setError(`${i + 1}번째 조각의 형식이 올바르지 않습니다. 인코딩(16진/base64) 설정을 확인하세요.`);
        return;
      }
      shares.push(decoded);
    }

    // 모든 share 의 y 길이가 같은지, x 좌표가 중복되지 않는지 검증한다.
    const expectedLength = shares[0].length;
    const seenX = new Set<number>();
    for (let i = 0; i < shares.length; i++) {
      if (shares[i].length !== expectedLength) {
        setError('조각들의 길이가 서로 다릅니다. 같은 비밀에서 생성된 조각인지 확인하세요.');
        return;
      }
      if (shares[i][0] === 0) {
        setError(`${i + 1}번째 조각의 좌표가 0 입니다. 손상된 조각입니다.`);
        return;
      }
      if (seenX.has(shares[i][0])) {
        setError('서로 다른 조각을 입력하세요. 같은 좌표의 조각이 중복되었습니다.');
        return;
      }
      seenX.add(shares[i][0]);
    }

    try {
      const secretBytes = combineShares(shares);
      // UTF-8 로 디코드. 분할 시 비밀이 텍스트였으므로 정상 복원되면 읽을 수 있다.
      const decoder = new TextDecoder('utf-8', { fatal: false });
      setRestoredSecret(decoder.decode(secretBytes));
    } catch (err) {
      console.error('[secret-split] combine failed', err);
      setError('복원 중 오류가 발생했습니다. 조각이 올바른지 확인하세요.');
    }
  }

  async function copy(text: string): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[secret-split] clipboard write failed', err);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Split className="h-5 w-5 text-primary" aria-hidden />
          비밀 분할(샤미르)
        </h1>
        <p className="text-sm text-muted-foreground">
          비밀을 N개 조각으로 나누고, 임계값 K개 이상을 모아 복원합니다(Shamir, GF(256)).
        </p>
      </header>

      <div className="flex gap-2">
        <Button
          variant={mode === 'split' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('split'); setError(null); }}
        >
          분할
        </Button>
        <Button
          variant={mode === 'combine' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('combine'); setError(null); }}
        >
          복원
        </Button>
      </div>

      <fieldset className="flex items-center gap-4 rounded-lg border bg-card p-3 text-sm">
        <legend className="px-1 text-xs font-medium text-muted-foreground">조각 인코딩</legend>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="share-encoding"
            checked={encoding === 'hex'}
            onChange={() => setEncoding('hex')}
          />
          16진(hex)
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="share-encoding"
            checked={encoding === 'base64'}
            onChange={() => setEncoding('base64')}
          />
          base64
        </label>
      </fieldset>

      {mode === 'split' ? (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">비밀(secret)</span>
            <textarea
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              rows={3}
              spellCheck={false}
              className="w-full resize-y rounded-lg border bg-background p-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="나눌 비밀 문자열 (예: 복구 시드, 마스터 비밀번호)"
              aria-label="비밀"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">조각 수 (N)</span>
              <Input
                type="number"
                min={2}
                max={255}
                value={totalShares}
                onChange={(event) => setTotalShares(event.target.value)}
                aria-label="조각 수"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">임계값 (K)</span>
              <Input
                type="number"
                min={2}
                max={255}
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                aria-label="임계값"
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            N개 중 임의의 K개를 모으면 복원됩니다. K개 미만으로는 어떤 정보도 얻을 수 없습니다.
          </p>

          <Button onClick={handleSplit} className="w-full">조각 생성</Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">조각(share) 입력</span>
            <textarea
              value={combineInput}
              onChange={(event) => setCombineInput(event.target.value)}
              rows={6}
              spellCheck={false}
              className="w-full resize-y rounded-lg border bg-background p-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder={'한 줄에 조각 하나씩 (K개 이상)\nshare-1: 01a2b3...\nshare-3: 03c4d5...'}
              aria-label="조각 입력"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {'"share-N: <값>" 형식 또는 값만 붙여넣어도 됩니다. 위에서 선택한 인코딩과 일치해야 합니다.'}
          </p>

          <Button onClick={handleCombine} className="w-full">비밀 복원</Button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {mode === 'split' && splitOutput && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              생성된 조각
            </span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => copy(splitOutput)}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                복사
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSplitOutput('');
                  setCopied(false);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                지우기
              </Button>
            </div>
          </div>
          <textarea
            value={splitOutput}
            readOnly
            rows={Math.min(splitOutput.split('\n').length + 1, 12)}
            spellCheck={false}
            className="w-full resize-y break-all rounded-lg bg-muted p-3 font-mono text-xs outline-none"
            aria-label="생성된 조각"
          />
          <p className="text-xs text-muted-foreground">
            ⚠️ 민감정보입니다 — 클립보드·화면에 남을 수 있으니 조각을 안전하게 분산 보관한 뒤
            지우세요.
          </p>
        </div>
      )}

      {mode === 'combine' && restoredSecret && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              복원된 비밀
            </span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => copy(restoredSecret)}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                복사
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRestoredSecret('');
                  setCopied(false);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                지우기
              </Button>
            </div>
          </div>
          <textarea
            value={restoredSecret}
            readOnly
            rows={3}
            spellCheck={false}
            className="w-full resize-y break-all rounded-lg bg-muted p-3 font-mono text-sm outline-none"
            aria-label="복원된 비밀"
          />
          <p className="text-xs text-muted-foreground">
            ⚠️ 민감정보입니다 — 클립보드·화면에 남을 수 있으니 사용 후 지우세요.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        모든 연산은 브라우저 내부에서만 수행되며 비밀과 조각은 서버로 전송되지 않습니다.
      </p>
    </main>
  );
}
