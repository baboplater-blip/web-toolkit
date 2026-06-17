'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'hash' | 'verify';
type VerifyResult = 'match' | 'mismatch';

const MIN_COST = 4;
const MAX_COST = 15;
const SLOW_COST_THRESHOLD = 13;

export default function BcryptPage() {
  const [mode, setMode] = useState<Mode>('hash');

  // 해시 생성
  const [password, setPassword] = useState('');
  const [cost, setCost] = useState(10);
  const [hashResult, setHashResult] = useState('');

  // 검증
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setMode('hash');
    setPassword('');
    setCost(10);
    setHashResult('');
    setVerifyPassword('');
    setVerifyHash('');
    setVerifyResult(null);
    setBusy(false);
    setError(null);
    setCopied(false);
  }

  async function generateHash() {
    if (!password) {
      setError('비밀번호를 입력하세요.');
      return;
    }
    setBusy(true);
    setError(null);
    setHashResult('');
    try {
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(cost);
      const hash = await bcrypt.hash(password, salt);
      setHashResult(hash);
    } catch (err) {
      console.error('bcrypt hash failed', err);
      setError('해시 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!verifyPassword) {
      setError('비밀번호를 입력하세요.');
      return;
    }
    if (!verifyHash) {
      setError('bcrypt 해시를 입력하세요.');
      return;
    }
    setBusy(true);
    setError(null);
    setVerifyResult(null);
    try {
      const bcrypt = (await import('bcryptjs')).default;
      const matched = await bcrypt.compare(verifyPassword, verifyHash.trim());
      setVerifyResult(matched ? 'match' : 'mismatch');
    } catch (err) {
      console.error('bcrypt compare failed', err);
      setError('검증에 실패했습니다. 올바른 bcrypt 해시인지 확인하세요.');
    } finally {
      setBusy(false);
    }
  }

  async function copyHash() {
    if (!hashResult) return;
    try {
      await navigator.clipboard.writeText(hashResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('복사에 실패했습니다.');
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="bcrypt 해시" onReset={reset} widthClass="max-w-xl" />

      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          비밀번호의 bcrypt 해시를 생성하거나 검증합니다. 모든 처리는 브라우저 안에서 이뤄지며
          비밀번호는 서버로 전송되지 않습니다.
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          {(['hash', 'verify'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex h-10 items-center justify-center rounded-md border text-sm ${
                mode === m
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {m === 'hash' ? '해시 생성' : '검증'}
            </button>
          ))}
        </div>

        {mode === 'hash' && (
          <div className="space-y-4 rounded-xl border bg-card p-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">비밀번호</span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="해시할 비밀번호"
                aria-label="비밀번호"
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">cost (rounds)</span>
                <span className="text-sm text-muted-foreground">{cost}</span>
              </div>
              <input
                type="range"
                min={MIN_COST}
                max={MAX_COST}
                step={1}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="cost"
              />
              {cost >= SLOW_COST_THRESHOLD && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  cost 가 높아 해시 생성이 느릴 수 있습니다.
                </p>
              )}
            </div>

            <Button onClick={generateHash} disabled={busy} className="w-full">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {busy ? '해시 생성 중...' : '해시 생성'}
            </Button>

            {hashResult && (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">결과</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyHash}>
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
                <p className="break-all font-mono text-sm">{hashResult}</p>
              </div>
            )}
          </div>
        )}

        {mode === 'verify' && (
          <div className="space-y-4 rounded-xl border bg-card p-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">비밀번호</span>
              <Input
                type="password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder="확인할 비밀번호"
                aria-label="비밀번호"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">bcrypt 해시</span>
              <textarea
                className="min-h-20 w-full rounded-lg border bg-background p-2.5 font-mono text-sm"
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder="$2a$10$..."
                aria-label="bcrypt 해시"
              />
            </label>

            <Button onClick={verify} disabled={busy} className="w-full">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {busy ? '검증 중...' : '검증'}
            </Button>

            {verifyResult === 'match' && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                일치합니다. 비밀번호가 해시와 맞습니다.
              </div>
            )}
            {verifyResult === 'mismatch' && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                일치하지 않습니다. 비밀번호가 해시와 맞지 않습니다.
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
