interface OverallStatusCardProps {
  total: number;
  online: number;
  offline: number;
}

export function OverallStatusCard({ total, online, offline }: OverallStatusCardProps) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        전체 현황
      </h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-3xl font-bold">{total}</p>
          <p className="mt-1 text-xs text-muted-foreground">총 PC</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-emerald-400">{online}</p>
          <p className="mt-1 text-xs text-muted-foreground">온라인</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-zinc-400">{offline}</p>
          <p className="mt-1 text-xs text-muted-foreground">오프라인</p>
        </div>
      </div>
    </section>
  );
}
