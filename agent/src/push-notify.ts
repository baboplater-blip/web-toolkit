import { log } from './logger';

/**
 * 에이전트가 `/api/push/notify` 를 호출해 사용자 기기들로 Web Push 알림을 보낸다.
 * 실패해도 로그만 남기고 호출자에게 영향을 주지 않는다.
 */
export interface NotifyArgs {
  apiBase: string;
  getAccessToken: () => Promise<string>;
  title: string;
  body: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  agentId: string;
  conversationId?: string;
  tag?: string;
}

export async function pushNotify(args: NotifyArgs): Promise<void> {
  try {
    const token = await args.getAccessToken();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(`${args.apiBase.replace(/\/+$/, '')}/api/push/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: args.title,
          body: args.body,
          variant: args.variant,
          agentId: args.agentId,
          conversationId: args.conversationId,
          tag: args.tag,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        log(`push notify ${res.status}: ${txt.slice(0, 200)}`, 'warn');
      }
    } finally {
      clearTimeout(t);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`push notify 실패: ${msg}`, 'warn');
  }
}
