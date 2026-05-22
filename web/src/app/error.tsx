'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * App Router route-level 에러 경계. 페이지 렌더 중 throw 된 오류가 잡힌다.
 * 빌드된 환경에서 에러 메시지는 난독화되므로 사용자 친화 문구 + 복구 액션 2종 제공.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 브라우저 콘솔에는 원본 메시지를 남겨 디버깅 가능.
    console.error('[route error]', error);
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-rose-500/15 p-2">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold">일시적인 오류</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              화면을 표시하는 중 문제가 발생했습니다. 다시 시도하거나 홈으로 이동해 주세요.
            </p>
            {error.digest && (
              <p className="mt-2 text-[10px] text-muted-foreground font-mono break-all">
                {error.digest}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = '/tools';
            }}
            className="h-9"
          >
            <Home className="h-4 w-4 mr-1.5" />
            홈으로
          </Button>
          <Button size="sm" onClick={() => reset()} className="h-9">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
