'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Mail, XCircle } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';

/**
 * 실용적 이메일 형식 검사: local@domain, 공백 불가, 도메인에 점 하나 이상(= TLD 존재),
 * TLD 는 영문 2자 이상. RFC 5322 전체가 아닌 일반적 합의 패턴.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TLD_PATTERN = /\.[A-Za-z]{2,}$/;

interface LineResult {
  raw: string;
  valid: boolean;
}

function isValidEmail(email: string): boolean {
  if (!EMAIL_PATTERN.test(email)) return false;
  const domain = email.slice(email.lastIndexOf('@') + 1);
  // TLD 가 영문 2자 이상이어야 한다(예: example.c 거부).
  return TLD_PATTERN.test(domain);
}

export default function EmailValidatorPage() {
  const [input, setInput] = useState('');

  const results = useMemo<LineResult[]>(() => {
    return input
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ({ raw: line, valid: isValidEmail(line) }));
  }, [input]);

  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.length - validCount;

  const handleReset = () => setInput('');

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이메일 형식 검증" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 text-primary" aria-hidden />
          이메일 주소 형식을 검사합니다. 한 줄에 하나씩 입력하면 여러 개를 일괄 확인합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">이메일 (한 줄에 하나)</span>
          <textarea
            className="min-h-48 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'user@example.com\nhello@도메인'}
            spellCheck={false}
            aria-label="이메일 입력"
          />
        </label>

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">전체</p>
                <p className="text-lg font-semibold tabular-nums">{results.length}</p>
              </div>
              <div className="rounded-lg border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">유효</p>
                <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {validCount}
                </p>
              </div>
              <div className="rounded-lg border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">무효</p>
                <p className="text-lg font-semibold tabular-nums text-destructive">{invalidCount}</p>
              </div>
            </div>

            <div className="max-h-[50vh] space-y-1 overflow-y-auto rounded-xl border bg-card p-2">
              {results.map((result, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 font-mono text-sm"
                >
                  {result.valid ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
                  )}
                  <span className="flex-1 truncate">{result.raw}</span>
                  <span
                    className={`shrink-0 text-xs ${
                      result.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {result.valid ? '유효' : '무효'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
