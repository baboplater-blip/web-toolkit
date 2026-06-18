'use client';

import { useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';
import { analyze } from '@/lib/tools/cc-validate';

export default function CcValidatePage() {
  const [input, setInput] = useState('');

  const analysis = useMemo(() => analyze(input), [input]);

  function reset() {
    setInput('');
  }

  const overallValid = analysis?.luhnValid && analysis?.lengthValid;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="카드번호 검증 (Luhn)" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          신용카드 번호의 Luhn 체크섬과 발급사를 확인합니다. 공백·하이픈은 자동으로 무시됩니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">카드번호</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 4111 1111 1111 1111"
            inputMode="numeric"
            autoComplete="off"
            aria-label="카드번호"
            className="font-mono"
          />
        </label>

        {analysis && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" aria-hidden />
              <span className="text-sm font-medium">
                발급사: {analysis.issuer ? analysis.issuer.name : '알 수 없음'}
              </span>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">자릿수</dt>
              <dd>
                {analysis.digits.length}자리{' '}
                <span className={analysis.lengthValid ? 'text-emerald-600' : 'text-destructive'}>
                  ({analysis.lengthValid ? '허용 범위' : '범위 벗어남'})
                </span>
              </dd>
              <dt className="text-muted-foreground">Luhn 체크섬</dt>
              <dd className={analysis.luhnValid ? 'text-emerald-600' : 'text-destructive'}>
                {analysis.luhnValid ? '통과' : '실패'}
              </dd>
            </dl>

            <div
              role="status"
              className={`rounded-md border p-3 text-sm font-medium ${
                overallValid
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-destructive/50 bg-destructive/10 text-destructive'
              }`}
            >
              {overallValid ? '유효한 카드번호 형식입니다.' : '유효하지 않은 카드번호입니다.'}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          모든 검증은 브라우저 안에서만 수행되며, 입력한 카드번호는 서버로 전송되지 않습니다. 형식 유효성만 확인할 뿐
          실제 사용 가능 여부는 알 수 없습니다.
        </p>
      </main>
    </div>
  );
}
