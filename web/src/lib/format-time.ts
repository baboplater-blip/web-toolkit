/**
 * "~분 오프라인" 같은 간결한 한국어 지속시간 표현.
 * 기준이 되는 `since` 가 없거나 미래 시점이면 null.
 */
export function formatOfflineDuration(since: string | null | undefined): string | null {
  if (!since) return null;
  const diffMs = Date.now() - new Date(since).getTime();
  if (diffMs < 0) return null;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return '방금';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `약 ${minutes}분 오프라인`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remMin = minutes % 60;
    return remMin >= 10
      ? `약 ${hours}시간 ${remMin}분 오프라인`
      : `약 ${hours}시간 오프라인`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) return `약 ${days}일 오프라인`;
  if (days < 30) return `${Math.floor(days / 7)}주 넘게 오프라인`;
  return `한 달 넘게 오프라인`;
}

/**
 * 온라인인 에이전트가 얼마나 오래 유휴 상태인지를 돌려준다.
 * 기준은 마지막 대화 활동(`last_activity_at`) 또는 전혀 활동이 없는 경우 null 입력.
 * 24시간 미만이면 null (= 유휴 아님), 그 이후만 라벨을 반환한다.
 */
export function formatIdleDuration(lastActivityAt: string | null | undefined): string | null {
  if (!lastActivityAt) return '활동 기록 없음';
  const diffMs = Date.now() - new Date(lastActivityAt).getTime();
  if (diffMs < 24 * 60 * 60 * 1000) return null;

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 7) return `${days}일간 유휴`;
  if (days < 30) return `${Math.floor(days / 7)}주간 유휴`;
  return '한 달 넘게 유휴';
}

