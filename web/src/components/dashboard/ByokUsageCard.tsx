import type { Agent } from '@/lib/supabase/types';

interface ByokUsage {
  calls: number;
  chars: number;
}

interface ByokUsageCardProps {
  agents: Agent[];
  usage: Record<string, ByokUsage>;
}

/**
 * BYOK 사용량 카드 — BYOK 모드 에이전트가 있을 때만 렌더.
 * 이번 달 기준 총 응답 수·문자 수·대략 토큰 수.
 * 호출부에서 `agents.filter(a => a.api_mode === 'byok')` 결과가 비어있으면 null 반환.
 */
export function ByokUsageCard({ agents, usage }: ByokUsageCardProps) {
  const byokAgents = agents.filter((a) => a.api_mode === 'byok');
  if (byokAgents.length === 0) return null;

  const totalCalls = Object.values(usage).reduce((s, v) => s + v.calls, 0);
  const totalChars = Object.values(usage).reduce((s, v) => s + v.chars, 0);
  const estTokens = Math.round(totalChars / 4);
  const monthName = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <section className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          BYOK 사용량
        </h2>
        <span className="text-[10px] text-muted-foreground">· {monthName}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold text-violet-300">
            {totalCalls.toLocaleString('ko-KR')}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">응답 수</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-violet-300">
            {totalChars > 0 ? (totalChars / 1000).toFixed(1) + 'k' : '0'}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">총 문자</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-violet-300">
            {estTokens > 0 ? (estTokens / 1000).toFixed(1) + 'k' : '0'}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">대략 토큰*</p>
        </div>
      </div>
      {byokAgents.length > 1 && (
        <div className="mt-3 space-y-1">
          {byokAgents.map((a) => {
            const u = usage[a.id];
            if (!u || u.calls === 0) return null;
            return (
              <div key={a.id} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate">{a.name}</span>
                <span className="text-violet-300 font-medium">
                  {u.calls} · {(u.chars / 1000).toFixed(1)}k자
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">
        * 문자 수 ÷ 4 기준 대략 추정. 한국어는 실제 토큰 수가 더 많을 수 있음.
      </p>
    </section>
  );
}
