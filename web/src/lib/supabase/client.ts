import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 브라우저용 Supabase 클라이언트 — 전역 싱글톤.
 *
 * 매 컴포넌트 렌더마다 새 클라이언트를 만들면 내부 auth 리스너·realtime 채널 매니저가
 * 중복 설정된다. `@supabase/ssr` 는 보통 같은 쿠키 저장소를 공유하므로 안전하지만,
 * 동일 페이지에서 여러 인스턴스가 auth 상태 변화에 대해 각자 반응하는 것을 막기 위해
 * 한 번만 생성한다.
 *
 * 개발자 도구의 HMR 환경에서도 module 재평가 때마다 새로 생성되지 않도록
 * `globalThis` 에 캐시한다.
 */

declare global {
  // eslint-disable-next-line no-var
  var __acpSupabaseClient: SupabaseClient | undefined;
}

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // 서버 (e.g. RSC) 에서는 매번 생성 — 요청 컨텍스트 격리.
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  if (!globalThis.__acpSupabaseClient) {
    globalThis.__acpSupabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return globalThis.__acpSupabaseClient;
}
