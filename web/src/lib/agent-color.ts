/**
 * 에이전트 ID 기반 색상 자동 할당.
 * 여러 PC 를 쓸 때 PCPicker·Dashboard·메시지 구별에 사용.
 *
 * 단순 hash → 팔레트 인덱싱. 동일 ID 는 항상 동일 색.
 * 팔레트는 dark/light 모드 모두에서 대비가 확보되는 범위로 고른다.
 */

const PALETTE = [
  { dot: 'bg-sky-500', text: 'text-sky-400', ring: 'ring-sky-500/30' },
  { dot: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  { dot: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  { dot: 'bg-rose-500', text: 'text-rose-400', ring: 'ring-rose-500/30' },
  { dot: 'bg-fuchsia-500', text: 'text-fuchsia-400', ring: 'ring-fuchsia-500/30' },
  { dot: 'bg-cyan-500', text: 'text-cyan-400', ring: 'ring-cyan-500/30' },
  { dot: 'bg-violet-500', text: 'text-violet-400', ring: 'ring-violet-500/30' },
  { dot: 'bg-orange-500', text: 'text-orange-400', ring: 'ring-orange-500/30' },
] as const;

export type AgentColor = (typeof PALETTE)[number];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorForAgent(agentId: string): AgentColor {
  return PALETTE[hashCode(agentId) % PALETTE.length];
}
