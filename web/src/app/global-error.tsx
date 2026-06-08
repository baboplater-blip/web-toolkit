'use client';

import { useEffect } from 'react';

/**
 * 최상위 안전망 — RootLayout 의 렌더 중 에러가 발생하면 여기로 폴백된다.
 * html/body 태그를 직접 쓰는 컴포넌트여야 한다 (layout 자체가 깨진 상태 가정).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#09090b',
          color: '#fafafa',
          minHeight: '100dvh',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '360px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}
        >
          <h1 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            앱 로딩 중 오류
          </h1>
          <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#a1a1aa' }}>
            페이지를 새로고침하면 해결되는 경우가 많습니다. 계속되면 브라우저 캐시를 지우거나
            다른 브라우저로 접속해 주세요.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: '12px',
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                color: '#71717a',
                wordBreak: 'break-all',
              }}
            >
              {error.digest}
            </p>
          )}
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {/* reset() 이 실패해도 사용자가 갇히지 않도록 홈 이동 경로를 항상 제공. */}
            <button
              type="button"
              onClick={() => window.location.assign('/tools')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'transparent',
                color: '#fafafa',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              홈으로
            </button>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#fafafa',
                color: '#09090b',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
