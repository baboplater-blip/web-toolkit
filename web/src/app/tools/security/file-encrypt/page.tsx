'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  FileLock,
  Loader2,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { decryptBytes, encryptBytes } from '@/lib/tools/crypto-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type Mode = 'encrypt' | 'decrypt';

const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export default function FileEncryptPage() {
  const [mode, setMode] = useState<Mode>('encrypt');
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

  const accept = mode === 'encrypt' ? '*/*' : '.wtk,application/octet-stream';

  const onFile = (f: File) => {
    if (f.size > MAX_SIZE) {
      setError(`파일이 너무 큽니다 (${formatBytes(f.size)} / 최대 ${formatBytes(MAX_SIZE)})`);
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
  };

  const swapMode = (m: Mode) => {
    setMode(m);
    setFile(null);
    setResult(null);
    setError(null);
    setConfirmPass('');
  };

  const run = async () => {
    if (!file) return;
    if (!passphrase) {
      setError('비밀번호를 입력하세요.');
      return;
    }
    if (mode === 'encrypt' && passphrase !== confirmPass) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setError(null);
    setResult(null);
    setProcessing(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      if (mode === 'encrypt') {
        const { bytes } = await encryptBytes(buf, passphrase);
        const blob = new Blob([bytes as unknown as BlobPart], {
          type: 'application/octet-stream',
        });
        setResult({ blob, fileName: `${file.name}.wtk` });
      } else {
        const plain = await decryptBytes(buf, passphrase);
        const blob = new Blob([plain as unknown as BlobPart], {
          type: 'application/octet-stream',
        });
        const originalName = file.name.endsWith('.wtk')
          ? file.name.slice(0, -4)
          : `${stripExtension(file.name)}-decrypted`;
        setResult({ blob, fileName: originalName });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 실패');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <FileLock className="h-5 w-5" />
            <h1 className="font-semibold text-base">파일 암호화·복호화</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-3">
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

        {!file && (
          <FileDropZone
            accept={accept}
            description={
              mode === 'encrypt'
                ? '암호화할 파일 (모든 형식 가능, 최대 500MB)'
                : '복호화할 .wtk 파일 (Web Toolkit 형식)'
            }
            onFiles={(files) => onFile(files[0])}
          />
        )}

        {file && (
          <div className="rounded-xl border bg-card p-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              변경
            </Button>
          </div>
        )}

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <label className="text-[11px] font-medium text-muted-foreground">
            비밀번호
          </label>
          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="안전한 비밀번호 입력"
              className="h-9 pr-9 font-mono text-xs"
              autoComplete="new-password"
            />
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
            <>
              <label className="text-[11px] font-medium text-muted-foreground">
                비밀번호 확인
              </label>
              <Input
                type={showPass ? 'text' : 'password'}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="동일한 비밀번호 재입력"
                className="h-9 font-mono text-xs"
                autoComplete="new-password"
              />
            </>
          )}

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            ⚠️ 비밀번호를 잃어버리면 복구가 불가능합니다. AES-256-GCM · PBKDF2-SHA256 (250k iters).
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <Button onClick={run} disabled={!file || processing} className="w-full">
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === 'encrypt' ? '암호화 중...' : '복호화 중...'}
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

        {result && (
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과
            </h2>
            <p className="text-xs">
              <span className="font-mono">{result.fileName}</span>
              {' · '}
              <span className="text-muted-foreground">{formatBytes(result.blob.size)}</span>
            </p>
            <Separator />
            <Button
              className="w-full"
              onClick={() => triggerDownload(result.blob, result.fileName)}
            >
              <Download className="h-4 w-4" />
              다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
