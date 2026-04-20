import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service Role Key 없이 에이전트가 Supabase 에 접근할 수 있도록,
 * 서버 (/api/agent/auth) 로부터 짧은 수명의 JWT 를 주기적으로 교환한다.
 *
 * 전략: 메모리에 현재 토큰을 유지하고, 만료 60 초 전에 선제 재발급.
 * supabase-js 의 accessToken 콜백은 매 요청마다 호출되므로 Realtime 도 자동 반영된다.
 */

interface AuthTokens {
  access_token: string;
  expires_at: number; // unix seconds
  agent_id: string;
  user_id: string;
}

const REFRESH_SKEW_MS = 60_000; // 만료 60 초 전에 갱신
const FETCH_TIMEOUT_MS = 10_000;

async function requestToken(apiBase: string, apiKey: string): Promise<AuthTokens> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${apiBase.replace(/\/+$/, '')}/api/agent/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`auth ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as AuthTokens;
  } finally {
    clearTimeout(timer);
  }
}

export interface AgentAuth {
  supabase: SupabaseClient;
  agentId: string;
  userId: string;
  /** 현재 유효한 access_token. 만료 임박 시 자동 갱신. */
  getAccessToken: () => Promise<string>;
  /** API_BASE_URL (e.g. https://...) */
  apiBase: string;
  /** 자원 정리 — SIGINT/SIGTERM 에서 호출 */
  stop: () => void;
}

export async function createAuthedAgentClient(options: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBase: string;
  apiKey: string;
}): Promise<AgentAuth> {
  let current: AuthTokens = await requestToken(options.apiBase, options.apiKey);
  let refreshing: Promise<void> | null = null;

  const refresh = async (): Promise<void> => {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          current = await requestToken(options.apiBase, options.apiKey);
          return;
        } catch (err) {
          const delay = Math.min(30_000, 1000 * Math.pow(2, attempt));
          await new Promise((r) => setTimeout(r, delay));
          if (attempt === 4) {
            throw err;
          }
        }
      }
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  };

  const isExpiring = (): boolean =>
    current.expires_at * 1000 - Date.now() < REFRESH_SKEW_MS;

  const supabase = createClient(options.supabaseUrl, options.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
    accessToken: async () => {
      if (isExpiring()) {
        try {
          await refresh();
        } catch {
          // 실패해도 기존 토큰으로 시도 — 완전 만료면 Supabase 가 거절할 뿐
        }
      }
      return current.access_token;
    },
  });

  // Realtime 웹소켓은 연결 시점의 토큰을 그대로 유지한다. 토큰이 갱신됐는데 setAuth 를
  // 호출해주지 않으면 서버가 만료 인식 후 채널을 CLOSED 로 끊고, 재연결 시도도 같은
  // 옛 토큰이라 또 끊기는 루프에 빠진다. refresh 에 성공할 때마다 명시적으로 전파한다.
  const pushRealtimeAuth = () => {
    try {
      supabase.realtime.setAuth(current.access_token);
    } catch {}
  };

  // 백그라운드 자동 갱신 타이머: 30 초마다 만료 임박 여부 확인
  const interval = setInterval(async () => {
    if (isExpiring()) {
      try {
        await refresh();
        pushRealtimeAuth();
      } catch {}
    }
  }, 30_000);

  // 최초 연결 시점에도 한 번 맞춰준다 (동일 토큰이지만 무해).
  pushRealtimeAuth();

  const getAccessToken = async (): Promise<string> => {
    if (isExpiring()) {
      try {
        await refresh();
        pushRealtimeAuth();
      } catch {}
    }
    return current.access_token;
  };

  return {
    supabase,
    agentId: current.agent_id,
    userId: current.user_id,
    apiBase: options.apiBase.replace(/\/+$/, ''),
    getAccessToken,
    stop: () => clearInterval(interval),
  };
}
