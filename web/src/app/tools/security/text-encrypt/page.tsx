'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
  Trash2,
  Unlock,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  base64ToBytes,
  bytesToBase64,
  decryptBytes,
  encryptBytes,
  TEXT_DEC,
  TEXT_ENC,
} from '@/lib/tools/crypto-common';

type Mode = 'encrypt' | 'decrypt';

export default function TextEncryptPage() {
  const [mode, setMode] = useState<Mode>('encrypt');
  const [input, setInput] = useState('비밀 메시지\nMy secret note 2026');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [output, setOutput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const swapMode = (m: Mode) => {
    setMode(m);
    setOutput('');
    setError(null);
    setConfirmPass('');
  };

  const run = async () => {
    if (!input) {
      setError('내용을 입력하세요.');
      return;
    }
    if (!passphrase) {
      setError('비밀번호를 입력하세요.');
      return;
    }
    if (mode === 'encrypt' && passphrase !== confirmPass) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setError(null);
    setOutput('');
    setProcessing(true);
    try {
      if (mode === 'encrypt') {
        const plain = TEXT_ENC.encode(input);
        const { bytes } = await encryptBytes(plain, passphrase);
        setOutput(bytesToBase64(bytes));
      } else {
        const data = base64ToBytes(input.trim());
        const plain = await decryptBytes(data, passphrase);
        setOutput(TEXT_DEC.decode(plain));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 실패');
    } finally {
      setProcessing(false);
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Shield className="h-5 w-5" />
            <h1 className="font-semibold text-base">텍스트 암호화·복호화</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3">
          <div className="grid grid-cols-2 gap-1">
            {(
              [
                ['encrypt', '암호화', Lock],
                ['decrypt', '복호화', Unlock],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => swapMode(v)}
                className={`h-9 text-xs rounded-md border flex items-center justify-center gap-1.5 ${
                  mode === v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <label className="text-[11px] font-medium text-muted-foreground">
            {mode === 'encrypt' ? '평문' : '암호문 (Base64)'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y"
            placeholder={mode === 'encrypt' ? '암호화할 텍스트' : 'WTK1... 형식 Base64 문자열'}
            spellCheck={false} aria-label="encrypt" />
        </div>

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <label className="text-[11px] font-medium text-muted-foreground">비밀번호</label>
          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="h-9 pr-9 font-mono text-xs"
              autoComplete="new-password" aria-label="비밀번호" />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted"
              aria-label={showPass ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {mode === 'encrypt' && (
            <Input
              type={showPass ? 'text' : 'password'}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="비밀번호 확인"
              className="h-9 font-mono text-xs"
              autoComplete="new-password" aria-label="비밀번호 확인" />
          )}
        </div>

        {mode === 'encrypt' && (
          <p className="text-[11px] text-destructive leading-relaxed px-1">
            ⚠️ 비밀번호를 잃으면 복구할 수 없습니다. 안전한 곳에 따로 보관하세요.
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <Button onClick={run} disabled={processing} className="w-full">
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : mode === 'encrypt' ? (
            <>
              <Lock className="h-4 w-4" />
              암호화
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4" />
              복호화
            </>
          )}
        </Button>

        {output && (
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과
              </h2>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span className="ml-1">복사</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setOutput('');
                    setCopied(false);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="ml-1">지우기</span>
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={6}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y break-all" aria-label="결과" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ⚠️ 민감정보입니다 — 클립보드·화면에 남을 수 있으니 사용 후 지우세요.
            </p>
          </div>
        )}

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          AES-256-GCM · PBKDF2-SHA256 (250k iters) · 출력은 Base64 인코딩 · 같은 비밀번호로
          재암호화해도 매번 다른 출력 (salt + IV 무작위)
        </p>
      </main>
    </div>
  );
}
