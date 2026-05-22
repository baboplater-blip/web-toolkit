import type { NextConfig } from 'next';

/**
 * 정적 export 모드.
 * `next build` 의 결과물은 `web/out/` 디렉터리에 HTML/CSS/JS 로만 떨어진다.
 * 어느 정적 호스팅(Cloudflare Pages·GitHub Pages·S3·Nginx·Vercel 정적 모드)
 * 에서도 그대로 동작.
 *
 * 보안 헤더는 정적 export 에서 next.config 의 headers() 가 무시되므로
 * 호스팅 측 설정(예: vercel.json, _headers, nginx.conf)에 별도 적용.
 *
 * 코드 안에서 사용하지 않는 기능 (자동 확인 완료):
 *   - next/image: 0건 (사용 시 images.unoptimized 필요)
 *   - next/headers / cookies: 0건
 *   - API Routes: 모두 _legacy 이전 완료
 *   - middleware: _legacy 이전 완료
 *   - redirect() in server component: / 만 → page.tsx 가 클라이언트 redirect 로 대체
 */
const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
