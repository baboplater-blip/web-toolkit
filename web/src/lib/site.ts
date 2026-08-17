/**
 * 사이트 절대 URL 단일 출처.
 *
 * canonical·OpenGraph·JSON-LD·sitemap·hreflang 의 절대 URL 기준이 된다.
 * 운영 도메인은 `NEXT_PUBLIC_SITE_URL` 환경변수로 주입한다(Vercel 등).
 * 도메인 연결 전까지는 아래 fallback 이 쓰이며, 실제 도메인 연결 시
 * 환경변수만 설정하면 전 표면(생성 JSON-LD 포함)이 자동 정합된다.
 *
 * BOM(U+FEFF) trim — 환경변수에 invisible 문자가 prefix 되는 사고 방어.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/^﻿/, '').replace(/\/$/, '') ??
  'https://agent-control-panel-phi.vercel.app';
