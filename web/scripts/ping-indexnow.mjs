#!/usr/bin/env node
/**
 * IndexNow API 핑 — Bing·Yandex·Seznam·DuckDuckGo 등 IndexNow 채택
 * 검색엔진에 sitemap 의 URL 목록을 일괄 통보한다.
 *
 * 환경변수:
 *   INDEXNOW_KEY                  — 사용자가 발급한 키 (필수). 미설정 시 no-op
 *   NEXT_PUBLIC_SITE_URL          — 사이트 root URL. 기본 https://agent-control-panel-phi.vercel.app
 *   INDEXNOW_KEY_LOCATION         — 키 파일 위치 (기본: https://{HOST}/{KEY}.txt)
 *
 * 키 파일:
 *   public/{KEY}.txt 에 KEY 와 동일한 문자열 한 줄만 들어 있어야 한다.
 *   키 생성: https://www.bing.com/indexnow/getstarted 또는 random hex 24자 이상
 *
 * 호출:
 *   npm run seo:ping
 *   또는 GHA seo-ping.yml 에서 schedule/manual 트리거
 *
 * Google 은 2023년 6월 sitemap ping API 를 deprecate 했다. GSC 에서 sitemap 을
 * 한 번 제출하면 이후 변경은 자동 감지된다. 따라서 Google 은 ping 대상이 아님.
 */

const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.log('[indexnow] INDEXNOW_KEY 미설정 — 스킵');
  process.exit(0);
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app').replace(/\/$/, '');
const HOST = SITE_URL.replace(/^https?:\/\//, '');
const KEY_LOCATION = process.env.INDEXNOW_KEY_LOCATION ?? `${SITE_URL}/${KEY}.txt`;

async function fetchSitemap() {
  const url = `${SITE_URL}/sitemap.xml`;
  console.log(`[indexnow] sitemap fetch: ${url}`);
  const res = await fetch(url, { headers: { Accept: 'application/xml' } });
  if (!res.ok) throw new Error(`sitemap fetch 실패: HTTP ${res.status}`);
  return res.text();
}

function extractUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function ping(urls) {
  // IndexNow 한 번 호출당 최대 10000 URL. 우린 100여 개라 한 번에 충분.
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  console.log(`[indexnow] POST api.indexnow.org — ${urls.length} URL`);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => '');
  if (res.status === 200 || res.status === 202) {
    console.log(`[indexnow] OK ${res.status} — 검색엔진이 변경 사항을 수집 대기열에 넣었습니다`);
    return;
  }
  // 일반적인 실패 코드 안내
  const tips = {
    400: '요청 형식 오류 — body 의 host/key 가 정확한지 확인',
    403: '키 검증 실패 — keyLocation 의 파일이 KEY 와 정확히 일치해야 함',
    422: 'URL 이 host 와 불일치 — 모든 URL 이 같은 호스트인지 확인',
    429: '너무 잦은 호출 — IndexNow 는 변경 시에만 ping',
  };
  const tip = tips[res.status] ?? '응답 본문 확인';
  throw new Error(`[indexnow] 실패 HTTP ${res.status}: ${tip}\n${text.slice(0, 400)}`);
}

async function main() {
  console.log(`[indexnow] HOST=${HOST}, KEY=${KEY.slice(0, 6)}…`);
  const sitemap = await fetchSitemap();
  const urls = extractUrls(sitemap);
  if (urls.length === 0) {
    console.warn('[indexnow] sitemap 에 URL 없음 — 스킵');
    return;
  }
  console.log(`[indexnow] ${urls.length} URL 추출 완료`);

  // 호스트 정합성 가드: sitemap 의 URL 호스트가 ping host(=키 검증 도메인)와
  // 다르면 IndexNow 가 422 로 거부한다. 이는 보통 프로덕션 빌드에
  // NEXT_PUBLIC_SITE_URL 이 안 걸려 sitemap 이 엉뚱한 도메인을 내보낼 때 발생.
  // 알림 폭탄(exit 1) 대신 원인을 로그로 크게 남기고 스킵(exit 0)한다.
  const sameHost = urls.filter((u) => u === `https://${HOST}` || u.startsWith(`https://${HOST}/`));
  if (sameHost.length === 0) {
    console.warn(
      `[indexnow] 스킵 — sitemap URL 호스트(${new URL(urls[0]).host})가 ping HOST(${HOST})와 불일치.\n` +
        `  프로덕션 빌드의 NEXT_PUBLIC_SITE_URL 과 워크플로/스크립트 HOST 를 같은 도메인으로 맞추세요.`,
    );
    return;
  }
  await ping(sameHost);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
