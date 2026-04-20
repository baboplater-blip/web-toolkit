'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle } from 'lucide-react';

/**
 * sessionStorage 플래그 키. 사용자 주도 로그아웃 시 설정돼
 * 자동 만료와 구분된다. /login 이동 전에 로그아웃 버튼이 직접 설정.
 */
const INTENTIONAL_KEY = 'acp:intentional-signout';

export function markIntentionalSignOut() {
  try {
    sessionStorage.setItem(INTENTIONAL_KEY, '1');
  } catch {}
}

function consumeIntentionalSignOut(): boolean {
  try {
    const v = sessionStorage.getItem(INTENTIONAL_KEY);
    if (v) {
      sessionStorage.removeItem(INTENTIONAL_KEY);
      return true;
    }
  } catch {}
  return false;
}

/**
 * 자동 토큰 갱신 실패 / 리프레시 토큰 만료 시 복구 UI.
 * - SIGNED_OUT 이벤트를 감지. 사용자 주도 로그아웃이면 무시.
 * - 만료면 모달로 "다시 로그인" 안내. 현재 경로를 쿼리로 넘겨 로그인 후 복귀.
 */
export function SessionRecovery() {
  const router = useRouter();
  const pathname = usePathname() ?? '/chat';
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (consumeIntentionalSignOut()) return;
        // 로그인/회원가입 페이지에 있을 때는 복구 모달을 띄우지 않는다.
        if (pathname.startsWith('/login') || pathname.startsWith('/signup')) return;
        setExpired(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  if (!expired) return null;

  const target = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border bg-background p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-500/15 p-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold">세션이 만료되었습니다</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              보안을 위해 로그인이 종료되었습니다. 다시 로그인하면 이 화면으로 돌아옵니다.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={() => router.push(target)}
            className="h-9"
          >
            <LogIn className="h-4 w-4 mr-1.5" />
            다시 로그인
          </Button>
        </div>
      </div>
    </div>
  );
}
