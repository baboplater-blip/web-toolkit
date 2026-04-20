'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Supabase Auth 세션을 자동 갱신하는 Provider.
 * - onAuthStateChange로 토큰 만료 전 자동 갱신
 * - 10분마다 세션 상태 확인 및 강제 갱신
 * - 브라우저 탭 다시 활성화 시 즉시 갱신
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();

    // 1. Auth state 변경 리스너 (토큰 만료 전 자동 갱신)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] 토큰 갱신 완료');
        }
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] 로그아웃됨');
        }
      }
    );

    // 2. 10분마다 세션 강제 확인/갱신. 갱신 실패(=리프레시 토큰 만료)면
    //    SIGNED_OUT 을 트리거해서 SessionRecovery 가 모달을 띄우게 한다.
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const expiresAt = session.expires_at ?? 0;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt - now < 300) {
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.warn('[Auth] 세션 갱신 실패 → signOut 트리거:', error.message);
            await supabase.auth.signOut();
          } else {
            console.log('[Auth] 세션 사전 갱신');
          }
        }
      }
    }, 10 * 60 * 1000);

    // 3. 탭 다시 활성화 시 세션 확인. 실패 시 신호 발생.
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const expiresAt = session.expires_at ?? 0;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt - now < 300) {
            const { error } = await supabase.auth.refreshSession();
            if (error) {
              console.warn('[Auth] 탭 복귀 시 갱신 실패 → signOut:', error.message);
              await supabase.auth.signOut();
            } else {
              console.log('[Auth] 탭 복귀 시 세션 갱신');
            }
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <>{children}</>;
}
