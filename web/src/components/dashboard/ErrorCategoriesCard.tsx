import { cn } from '@/lib/utils';
import type { ErrorCategory } from '@/lib/error-classify';

const LABELS: Record<ErrorCategory, string> = {
  token_limit: '토큰 한도',
  rate_limit_tpm: 'Rate limit (TPM)',
  rate_limit_rpm: 'Rate limit (RPM)',
  rate_limit: 'Rate limit',
  timeout: '타임아웃',
  permission_windows: 'Windows 권한',
  permission: '권한 거부',
  network: '네트워크',
  auth: '인증 실패',
  cancelled: '사용자 중단',
  cli_missing: 'CLI 누락',
  cli_error: 'CLI 실행 오류',
  disk_full: '디스크 가득참',
  unknown: '기타',
};

const COLORS: Record<ErrorCategory, string> = {
  token_limit: 'bg-violet-500/15 border-violet-500/40 text-violet-300',
  rate_limit_tpm: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  rate_limit_rpm: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  rate_limit: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  timeout: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
  permission_windows: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
  permission: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
  network: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
  auth: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
  cancelled: 'bg-zinc-500/15 border-zinc-500/40 text-zinc-300',
  cli_missing: 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300',
  cli_error: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
  disk_full: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
  unknown: 'bg-muted border-border text-muted-foreground',
};

interface ErrorCategoriesCardProps {
  categories: Partial<Record<ErrorCategory, number>>;
  selected: ErrorCategory | null;
  onSelect: (cat: ErrorCategory | null) => void;
}

/**
 * 최근 7일 에러 원인 카드 — 에러가 있을 때만 렌더.
 * 클릭으로 필터 토글. 같은 카테고리 재클릭 시 해제.
 */
export function ErrorCategoriesCard({
  categories,
  selected,
  onSelect,
}: ErrorCategoriesCardProps) {
  const entries = Object.entries(categories).filter(([, n]) => (n ?? 0) > 0) as Array<
    [ErrorCategory, number]
  >;
  const total = entries.reduce((a, [, n]) => a + n, 0);
  if (total === 0) return null;

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          최근 7일 에러 원인
        </h2>
        <span className="text-xs text-muted-foreground">총 {total}건</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sorted.map(([cat, count]) => {
          const active = selected === cat;
          return (
            <button
              type="button"
              key={cat}
              onClick={() => onSelect(active ? null : cat)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-transform',
                COLORS[cat],
                active && 'ring-2 ring-offset-2 ring-offset-card ring-primary scale-105',
              )}
              title={active ? '선택 해제' : '에러 목록을 이 카테고리로 필터'}
            >
              <span>{LABELS[cat]}</span>
              <span className="font-mono text-[11px] opacity-90">{count}</span>
            </button>
          );
        })}
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[11px] underline text-muted-foreground ml-auto"
          >
            필터 해제
          </button>
        )}
      </div>
    </section>
  );
}
