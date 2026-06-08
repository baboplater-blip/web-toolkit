'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Copy, Download, EyeOff } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Rule {
  key: string;
  label: string;
  re: RegExp;
  /** 매치 문자열을 마스킹된 형태로 변환 */
  mask: (m: string) => string;
}

/** 영숫자 위치 기준으로 가운데를 마스킹. */
function maskMiddle(s: string, keepFront: number, keepBack: number): string {
  const alnum = [...s].filter((c) => /[0-9a-zA-Z]/.test(c));
  let idx = 0;
  return [...s]
    .map((ch) => {
      if (!/[0-9a-zA-Z]/.test(ch)) return ch;
      const pos = idx++;
      if (pos < keepFront || pos >= alnum.length - keepBack) return ch;
      return '*';
    })
    .join('');
}

const RULES: Rule[] = [
  {
    key: 'rrn',
    label: '주민등록번호',
    re: /\b\d{6}[-\s]?\d{7}\b/g,
    mask: (m) => m.replace(/\d/g, '*'),
  },
  {
    key: 'card',
    label: '카드번호',
    re: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    mask: (m) => maskMiddle(m, 4, 4),
  },
  {
    key: 'phone',
    label: '전화·휴대폰',
    re: /\b(01[016789]|0\d{1,2})[-\s]?\d{3,4}[-\s]?\d{4}\b/g,
    mask: (m) => maskMiddle(m, 3, 4),
  },
  {
    key: 'email',
    label: '이메일',
    re: /\b([A-Za-z0-9._%+-]{1,})@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
    mask: (m) => {
      const [id, domain] = m.split('@');
      const keep = Math.max(1, Math.min(3, id.length - 1));
      return id.slice(0, keep) + '*'.repeat(Math.max(1, id.length - keep)) + '@' + domain;
    },
  },
  {
    key: 'account',
    label: '계좌번호 (숫자 그룹)',
    re: /\b\d{2,6}[-\s]\d{2,6}[-\s]\d{2,7}(?:[-\s]\d{1,6})?\b/g,
    mask: (m) => maskMiddle(m, 3, 3),
  },
];

export default function RedactPage() {
  const [text, setText] = useState('');
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    rrn: true,
    card: true,
    phone: true,
    email: true,
    account: false,
  });
  const [copied, setCopied] = useState(false);

  const { masked, counts } = useMemo(() => {
    let out = text;
    const counts: Record<string, number> = {};
    for (const rule of RULES) {
      if (!enabled[rule.key]) continue;
      let n = 0;
      out = out.replace(rule.re, (m) => {
        n++;
        return rule.mask(m);
      });
      counts[rule.key] = n;
    }
    return { masked: out, counts };
  }, [text, enabled]);

  const totalFound = Object.values(counts).reduce((a, b) => a + b, 0);

  function toggle(key: string) {
    setEnabled((e) => ({ ...e, [key]: !e[key] }));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(masked);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  function download() {
    const blob = new Blob([masked], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'masked.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <EyeOff className="h-5 w-5" />
          <h1 className="font-semibold text-base">문서 민감정보 마스킹</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {RULES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => toggle(r.key)}
                aria-pressed={enabled[r.key]}
                className={`rounded-full border px-3 py-1 text-[12px] font-medium ${
                  enabled[r.key]
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
                {counts[r.key] ? ` ${counts[r.key]}` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" htmlFor="src">원문 (붙여넣기)</label>
            <textarea
              id="src"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="개인정보가 포함된 문서를 붙여넣으세요. 주민번호·카드·전화·이메일 등을 자동 검출해 가립니다."
              className="w-full rounded-md border bg-background p-3 text-sm font-mono leading-relaxed"
              aria-label="원문"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" htmlFor="out">
                마스킹 결과 {totalFound > 0 && <span className="text-primary">· {totalFound}건 가림</span>}
              </label>
              <div className="flex gap-1.5">
                <button type="button" onClick={copy} disabled={!text} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1 h-7' })}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? '복사됨' : '복사'}
                </button>
                <button type="button" onClick={download} disabled={!text} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1 h-7' })}>
                  <Download className="h-3.5 w-3.5" />
                  .txt
                </button>
              </div>
            </div>
            <textarea
              id="out"
              value={masked}
              readOnly
              rows={8}
              className="w-full rounded-md border bg-muted/30 p-3 text-sm font-mono leading-relaxed"
              aria-label="마스킹 결과"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            주민등록번호·카드번호·전화·이메일·계좌번호를 정규식으로 검출해 가운데 자리를
            가립니다. 외부 공유·캡처 전 개인정보를 비식별 처리하세요. <strong>계좌번호</strong>는
            형식이 다양해 오검출·누락이 있을 수 있으니 결과를 꼭 확인하세요. 모든 처리는
            브라우저 안에서 이뤄지며 입력 문서는 어디로도 전송되지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
