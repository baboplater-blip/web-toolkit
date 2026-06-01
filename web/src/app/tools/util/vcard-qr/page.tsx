'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Contact, Copy, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';

interface Card {
  name: string;
  org: string;
  title: string;
  phone: string;
  mobile: string;
  email: string;
  url: string;
  address: string;
}

/** vCard 3.0 문자열 생성 (스캔 시 연락처 저장). */
function buildVCard(c: Card): string {
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').trim();
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (c.name) {
    lines.push(`N:${esc(c.name)};;;`);
    lines.push(`FN:${esc(c.name)}`);
  }
  if (c.org) lines.push(`ORG:${esc(c.org)}`);
  if (c.title) lines.push(`TITLE:${esc(c.title)}`);
  if (c.phone) lines.push(`TEL;TYPE=WORK,VOICE:${esc(c.phone)}`);
  if (c.mobile) lines.push(`TEL;TYPE=CELL:${esc(c.mobile)}`);
  if (c.email) lines.push(`EMAIL;TYPE=WORK:${esc(c.email)}`);
  if (c.url) lines.push(`URL:${esc(c.url)}`);
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${esc(c.address)};;;;`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

const FIELDS: { key: keyof Card; label: string; ph: string; type?: string }[] = [
  { key: 'name', label: '이름', ph: '홍길동' },
  { key: 'org', label: '회사', ph: '주식회사 예시' },
  { key: 'title', label: '직책', ph: '대리' },
  { key: 'mobile', label: '휴대폰', ph: '010-1234-5678', type: 'tel' },
  { key: 'phone', label: '회사 전화', ph: '02-123-4567', type: 'tel' },
  { key: 'email', label: '이메일', ph: 'hong@example.com', type: 'email' },
  { key: 'url', label: '웹사이트', ph: 'https://example.com', type: 'url' },
  { key: 'address', label: '주소', ph: '서울시 ...' },
];

export default function VCardQrPage() {
  const [card, setCard] = useState<Card>({
    name: '',
    org: '',
    title: '',
    phone: '',
    mobile: '',
    email: '',
    url: '',
    address: '',
  });
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const vcard = useMemo(() => buildVCard(card), [card]);
  const hasData = !!(card.name || card.org || card.mobile || card.email);

  useEffect(() => {
    if (!hasData) {
      setQr(null);
      return;
    }
    let cancelled = false;
    import('qrcode').then((QR) => {
      QR.toDataURL(
        vcard,
        { errorCorrectionLevel: 'M', width: 600, margin: 2 },
        (err, url) => {
          if (!cancelled) setQr(err ? null : url);
        },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [vcard, hasData]);

  function set<K extends keyof Card>(key: K, value: string) {
    setCard((c) => ({ ...c, [key]: value }));
  }

  function download() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `${card.name || 'contact'}-vcard-qr.png`;
    a.click();
  }

  async function copyVcard() {
    try {
      await navigator.clipboard.writeText(vcard);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
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
          <Contact className="h-5 w-5" />
          <h1 className="font-semibold text-base">vCard 명함 QR 생성기</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === 'address' ? 'sm:col-span-2' : ''}>
              <label className="text-xs font-medium block mb-1" htmlFor={`f-${f.key}`}>
                {f.label}
              </label>
              <Input
                id={`f-${f.key}`}
                type={f.type ?? 'text'}
                value={card[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.ph}
                aria-label={f.label}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4 flex flex-col items-center gap-3">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="vCard QR" width={240} height={240} className="h-56 w-56" />
            ) : (
              <div className="h-56 w-56 flex items-center justify-center rounded-lg border border-dashed text-center text-xs text-muted-foreground p-4">
                이름·회사·연락처 중 하나 이상 입력하면 QR이 생성됩니다.
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={download}
                disabled={!qr}
                className={buttonVariants({ className: 'gap-1.5', size: 'sm' })}
              >
                <Download className="h-4 w-4" />
                PNG 저장
              </button>
              <button
                type="button"
                onClick={copyVcard}
                disabled={!hasData}
                className={buttonVariants({ variant: 'outline', className: 'gap-1.5', size: 'sm' })}
              >
                <Copy className="h-4 w-4" />
                {copied ? '복사됨' : 'vCard 복사'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
            <p>
              스마트폰 카메라로 스캔하면 연락처에 바로 저장되는 vCard QR을 만듭니다. 명함·
              이메일 서명·행사 부스에 활용하세요. 모든 처리는 브라우저 안에서 이뤄지며
              입력값은 어디로도 전송되지 않습니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
