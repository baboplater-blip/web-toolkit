/**
 * Realtime 채널 연결 상태 전역 스토어 + 수동 재연결 레지스트리.
 *
 * `subscribeWithRetry` 가 구독 상태 전이마다 `reportStatus()` 를 호출하고,
 * UI 컴포넌트는 `subscribeRealtimeStatus()` 로 스냅샷을 관찰한다.
 *
 * 진단 모달은 채널별 상태를 나열하고 `reconnect(key)` / `reconnectAll()` 로
 * 직접 재연결을 트리거할 수 있다.
 *
 * 개별 채널 상태:
 *   - 'subscribed'   : 정상
 *   - 'reconnecting' : 오류 발생 → 재시도 중
 *   - 'closed'       : 최종 종료 (stop 호출됨)
 *
 * 집계(overall) 상태:
 *   - 'idle'         : 등록된 채널이 하나도 없음
 *   - 'connected'    : 모든 활성 채널이 subscribed
 *   - 'reconnecting' : 적어도 하나가 재시도 중
 */

export type ChannelState = 'subscribed' | 'reconnecting' | 'closed';
export type OverallState = 'idle' | 'connected' | 'reconnecting';

export interface ChannelEntry {
  key: string;
  label: string;
  state: ChannelState;
}

interface InternalEntry {
  label: string;
  state: ChannelState;
  reconnect?: () => void;
}

type Listener = () => void;

const channels = new Map<string, InternalEntry>();
const listeners = new Set<Listener>();

/**
 * `useSyncExternalStore` 는 getSnapshot 이 같은 참조를 돌려주어야 re-render 루프를 피한다.
 * 상태가 바뀔 때만 새 배열을 계산해 여기에 캐싱한다.
 */
let cachedEntries: ChannelEntry[] = [];
let cachedOverall: OverallState = 'idle';

function recomputeCaches() {
  let hasActive = false;
  let hasReconnecting = false;
  const next: ChannelEntry[] = [];
  for (const [key, entry] of channels) {
    next.push({ key, label: entry.label, state: entry.state });
    if (entry.state === 'closed') continue;
    hasActive = true;
    if (entry.state === 'reconnecting') hasReconnecting = true;
  }
  next.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
  cachedEntries = next;
  cachedOverall = !hasActive ? 'idle' : hasReconnecting ? 'reconnecting' : 'connected';
}

function emit() {
  recomputeCaches();
  for (const l of listeners) l();
}

export function registerChannel(key: string, label: string, reconnect: () => void) {
  const existing = channels.get(key);
  channels.set(key, {
    label,
    reconnect,
    state: existing?.state ?? 'reconnecting',
  });
  emit();
}

export function reportStatus(key: string, state: ChannelState) {
  const existing = channels.get(key);
  if (existing) {
    existing.state = state;
  } else {
    channels.set(key, { label: key, state });
  }
  emit();
}

export function clearStatus(key: string) {
  channels.delete(key);
  emit();
}

export function getOverallStatus(): OverallState {
  return cachedOverall;
}

export function getChannelEntries(): ChannelEntry[] {
  return cachedEntries;
}

export function subscribeRealtimeStatus(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function reconnectChannel(key: string) {
  const entry = channels.get(key);
  if (!entry?.reconnect) return;
  entry.state = 'reconnecting';
  emit();
  entry.reconnect();
}

export function reconnectAll() {
  for (const entry of channels.values()) {
    entry.state = 'reconnecting';
  }
  emit();
  for (const entry of channels.values()) {
    entry.reconnect?.();
  }
}
