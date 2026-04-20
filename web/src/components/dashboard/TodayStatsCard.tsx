interface TodayStatsCardProps {
  stats: {
    total: number;
    completed: number;
    errors: number;
    cancelled: number;
  };
}

export function TodayStatsCard({ stats }: TodayStatsCardProps) {
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        오늘 작업
      </h2>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">총 작업</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">완료</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">오류</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-400">{stats.cancelled}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">취소</p>
        </div>
      </div>
      {stats.total > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-emerald-400">
            {completionRate}%
          </span>
        </div>
      )}
    </section>
  );
}
