'use client';

import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { loadAdsConfig, type NoticeConfig } from '@/lib/ads-config';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'webtoolkit/notice/dismissed';

/**
 * 사이트 상단 공지 배너.
 *
 * ads-config.json 의 notice 필드를 읽어 표시.
 * 사용자가 닫으면 message 해시를 localStorage 에 저장 → 같은 공지면 다시 띄우지 않음.
 * 새 공지가 올라오면(메시지 해시 변경) 자동으로 다시 표시.
 */
export function NoticeBanner() {
  const [notice, setNotice] = useState<NoticeConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadAdsConfig().then((cfg) => {
      if (!cfg.notice || !cfg.notice.enabled || !cfg.notice.message.trim()) return;
      const hash = simpleHash(cfg.notice.message);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === String(hash)) {
          setDismissed(true);
        }
      } catch {}
      setNotice(cfg.notice);
    });
  }, []);

  function handleDismiss() {
    setDismissed(true);
    if (!notice) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(simpleHash(notice.message)));
    } catch {}
  }

  if (!notice || dismissed) return null;

  const tone = notice.tone ?? 'info';
  const Icon = tone === 'warning' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info;
  // 경고는 즉시 알림(alert=assertive), 그 외는 부드럽게(status=polite).
  const isWarning = tone === 'warning';

  return (
    <div
      role={isWarning ? 'alert' : 'status'}
      aria-live={isWarning ? 'assertive' : 'polite'}
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-xs sm:text-sm border-b',
        tone === 'warning'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          : tone === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-primary/10 border-primary/30 text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <p className="flex-1 leading-relaxed">
        {notice.message}
        {notice.href && (
          <>
            {' '}
            <a href={notice.href} target="_blank" rel="noopener noreferrer" className="underline font-medium ml-1">
              자세히
            </a>
          </>
        )}
      </p>
      <button onClick={handleDismiss} aria-label="공지 닫기" className="rounded p-0.5 hover:bg-foreground/10 shrink-0">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}
