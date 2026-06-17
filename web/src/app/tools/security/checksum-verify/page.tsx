'use client';

import { useState } from 'react';
import { Check, Copy, FileCheck, Loader2 } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Algorithm = 'SHA-256' | 'SHA-512';

/** arrayBuffer 로 전체를 메모리에 올리므로 매우 큰 파일은 경고만 표시(처리는 허용). */
const WARN_BYTES = 512 * 1024 * 1024; // 512MB

/** ArrayBuffer → 소문자 hex 문자열. */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, '0');
  }
  return out;
}

/** 비교용 정규화: 공백 제거 + 소문자. */
function normalizeHash(raw: string): string {
  return raw.replace(/\s+/g, '').toLowerCase();
}

export default function ChecksumVerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [hash, setHash] = useState('');
  const [expected, setExpected] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setFile(null);
    setAlgorithm('SHA-256');
    setHash('');
    setExpected('');
    setProcessing(false);
    setError(null);
    setCopied(false);
  }

  function handleFiles(files: File[]) {
    setError(null);
    setHash('');
    setFile(files[0] ?? null);
  }

  async function computeHash() {
    if (!file) {
      setError('파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setHash('');
    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest(algorithm, buffer);
      setHash(bufferToHex(digest));
    } catch (e) {
      console.error('checksum compute failed:', e);
      setError(e instanceof Error ? e.message : '해시 계산에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  async function copyHash() {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed:', e);
    }
  }

  const expectedTrimmed = expected.trim();
  const matches =
    hash && expectedTrimmed ? normalizeHash(hash) === normalizeHash(expectedTrimmed) : null;
  const tooLarge = file != null && file.size > WARN_BYTES;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="체크섬 검증" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <FileCheck className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          파일의 해시를 계산해 기대값과 일치하는지 확인합니다.
        </p>

        <FileDropZone accept="*/*" onFiles={handleFiles} onError={setError} description="검증할 파일을 선택하세요" />

        {file && (
          <p className="text-xs text-muted-foreground">
            선택됨: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
          </p>
        )}

        {tooLarge && (
          <div role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            파일이 매우 큽니다(512MB 초과). 브라우저 메모리 한계로 계산이 느리거나 실패할 수 있습니다.
          </div>
        )}

        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">알고리즘</legend>
          <div className="flex flex-wrap gap-2">
            {(['SHA-256', 'SHA-512'] as const).map((option) => (
              <label
                key={option}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                  algorithm === option ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name="algorithm"
                  value={option}
                  checked={algorithm === option}
                  onChange={() => {
                    setAlgorithm(option);
                    setHash('');
                  }}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <Button onClick={computeHash} disabled={processing || !file}>
          {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          해시 계산
        </Button>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {hash && (
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{algorithm} 해시</span>
              <Button variant="outline" size="sm" onClick={copyHash}>
                {copied ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" aria-hidden />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
                    복사
                  </>
                )}
              </Button>
            </div>
            <p className="break-all rounded-lg border bg-muted/40 p-3 font-mono text-sm">{hash}</p>
          </div>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-medium">기대 해시 (선택)</span>
          <Input
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="비교할 해시값을 붙여넣으세요"
            autoComplete="off"
            aria-label="기대 해시"
            className="font-mono"
          />
        </label>

        {matches !== null && (
          <div
            role="status"
            className={`rounded-md border p-3 text-sm font-medium ${
              matches
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-destructive/50 bg-destructive/10 text-destructive'
            }`}
          >
            {matches ? '일치합니다. 파일이 손상되지 않았습니다.' : '일치하지 않습니다. 해시가 다릅니다.'}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          모든 계산은 브라우저 안에서만 수행되며, 파일은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
