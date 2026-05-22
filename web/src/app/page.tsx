'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tools');
  }, [router]);
  return (
    <>
      {/* JS 비활성 환경 폴백 */}
      <meta httpEquiv="refresh" content="0;url=/tools" />
      <noscript>
        <p>
          <a href="/tools">도구 허브로 이동</a>
        </p>
      </noscript>
    </>
  );
}
