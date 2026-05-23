'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  FileText,
  Fingerprint,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { formatBytes } from '@/lib/compress/format';

type Mode = 'file' | 'text';
type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

interface HashResult {
  algo: Algorithm | 'MD5';
  hex: string;
}

const ALGORITHMS: (Algorithm | 'MD5')[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---- MD5 (RFC 1321 순수 JS 구현) ----
// Web Crypto API 는 MD5 미지원 — 자체 구현
function md5(bytes: Uint8Array): Uint8Array {
  const r = new Uint32Array([
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
    14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]);
  const k = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ]);

  const origLen = bytes.length;
  // padding
  const padLen = (origLen + 9 + 63) & ~63;
  const msg = new Uint8Array(padLen);
  msg.set(bytes);
  msg[origLen] = 0x80;
  // 길이 (64bit LE). origLen * 8 — 32bit 안전 범위까지만 분해
  const bitLenLow = (origLen * 8) >>> 0;
  const bitLenHigh = Math.floor((origLen * 8) / 0x100000000) >>> 0;
  for (let i = 0; i < 4; i++) msg[padLen - 8 + i] = (bitLenLow >>> (i * 8)) & 0xff;
  for (let i = 0; i < 4; i++) msg[padLen - 4 + i] = (bitLenHigh >>> (i * 8)) & 0xff;

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const rotateLeft = (x: number, n: number) => (x << n) | (x >>> (32 - n));

  for (let chunk = 0; chunk < padLen; chunk += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      M[i] =
        msg[chunk + i * 4] |
        (msg[chunk + i * 4 + 1] << 8) |
        (msg[chunk + i * 4 + 2] << 16) |
        (msg[chunk + i * 4 + 3] << 24);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + k[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotateLeft(F, r[i])) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((h, i) => {
    out[i * 4] = h & 0xff;
    out[i * 4 + 1] = (h >> 8) & 0xff;
    out[i * 4 + 2] = (h >> 16) & 0xff;
    out[i * 4 + 3] = (h >> 24) & 0xff;
  });
  return out;
}

async function computeHashes(bytes: ArrayBuffer): Promise<HashResult[]> {
  const results: HashResult[] = [];
  // MD5
  results.push({ algo: 'MD5', hex: bytesToHex(md5(new Uint8Array(bytes))) });
  // SHA 계열 - Web Crypto API
  for (const algo of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const) {
    const digest = await crypto.subtle.digest(algo, bytes);
    results.push({ algo, hex: bytesToHex(new Uint8Array(digest)) });
  }
  return results;
}

export default function HashPage() {
  const [mode, setMode] = useState<Mode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [results, setResults] = useState<HashResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);

  const acceptFile = async (f: File) => {
    setError(null);
    setResults([]);
    setFile(f);
    setProcessing(true);
    try {
      const buf = await f.arrayBuffer();
      setResults(await computeHashes(buf));
    } catch (err) {
      setError(err instanceof Error ? err.message : '해시 계산 실패');
    } finally {
      setProcessing(false);
    }
  };

  const computeTextHash = async () => {
    if (!text) {
      setResults([]);
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const buf = new TextEncoder().encode(text);
      setResults(await computeHashes(buf.buffer as ArrayBuffer));
    } catch (err) {
      setError(err instanceof Error ? err.message : '해시 계산 실패');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setText('');
    setResults([]);
    setError(null);
  };

  const copyHex = async (algo: string, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedAlgo(algo);
      setTimeout(() => setCopiedAlgo(null), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Fingerprint className="h-5 w-5" />
            <h1 className="font-semibold text-base">파일·텍스트 해시</h1>
          </div>
          {(file || text) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`h-10 text-sm rounded-md border ${
              mode === 'file'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            파일 해시
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`h-10 text-sm rounded-md border ${
              mode === 'text'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            텍스트 해시
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {mode === 'file' && (
          <>
            {!file && (
              <FileDropZone
                accept="*"
                description="해시를 계산할 파일을 업로드하세요"
                hint="파일은 브라우저에서만 처리되며 서버로 전송되지 않습니다."
                onFiles={(files) => acceptFile(files[0])}
              />
            )}
            {file && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'text' && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">텍스트</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="해시를 계산할 텍스트를 입력하세요"
                rows={5}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm font-mono resize-y"
              />
            </div>
            <Button onClick={computeTextHash} disabled={processing || !text} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  계산 중...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  해시 계산
                </>
              )}
            </Button>
          </div>
        )}

        {(results.length > 0 || processing) && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과
            </h2>
            <Separator />
            {processing && results.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                계산 중...
              </p>
            ) : (
              <div className="space-y-2">
                {ALGORITHMS.map((algo) => {
                  const r = results.find((x) => x.algo === algo);
                  return (
                    <div key={algo} className="rounded-lg border p-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                          {algo}
                        </p>
                        {r && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => copyHex(algo, r.hex)}
                          >
                            {copiedAlgo === algo ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] font-mono break-all text-foreground">
                        {r?.hex ?? '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Web Crypto API (SHA) + 순수 JS MD5 구현. 외부 전송 없음.
        </p>
      </main>
    </div>
  );
}
