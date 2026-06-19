import { test, expect } from '@playwright/test';

/**
 * 유스케이스(/use/{slug}) 회귀 가드 — 라운드8 신규 14종.
 *
 * 유스케이스는 작업 의도(task intent)로 검색하는 사용자를 잡아 여러 도구를
 * 단계(HowTo 스키마)로 묶어 안내한다. 각 step.href 는 실제 ready 도구여야 하며
 * (죽은 링크 금지), 정적 export 하이드레이션 안전해야 한다.
 *
 * 가드: ① 페이지가 뜨고 ② 핵심 단계 도구 링크가 실제로 렌더되며
 * ③ HowTo JSON-LD 가 들어가고 ④ 하이드레이션/페이지 에러가 없음.
 */

const CASES: Array<{ slug: string; prefix: string; expectHref: string }> = [
  { slug: 'prepare-page-seo-tags', prefix: '', expectHref: '/tools/dev/meta-tags' },
  { slug: 'build-responsive-design-system', prefix: '', expectHref: '/tools/dev/tailwind-shades' },
  { slug: 'api-json-to-types', prefix: '', expectHref: '/tools/dev/json-schema' },
  { slug: 'schedule-cron-job', prefix: '', expectHref: '/tools/dev/crontab-builder' },
  { slug: 'style-social-bio-text', prefix: '', expectHref: '/tools/text/strikethrough' },
  { slug: 'improve-writing-readability', prefix: '', expectHref: '/tools/text/readability' },
  { slug: 'split-the-bill', prefix: '', expectHref: '/tools/util/bill-split' },
  { slug: 'track-time-across-timezones', prefix: '/en', expectHref: '/tools/util/world-clock' },
  { slug: 'generate-test-card-numbers', prefix: '', expectHref: '/tools/security/luhn-generator' },
  { slug: 'identify-unknown-hash', prefix: '', expectHref: '/tools/security/hash-identifier' },
  { slug: 'polish-screenshot-for-post', prefix: '', expectHref: '/tools/image/screenshot-shadow' },
  { slug: 'make-data-table-for-web', prefix: '/ja', expectHref: '/tools/docs/csv-to-html' },
  { slug: 'apply-vintage-photo-filter', prefix: '', expectHref: '/tools/image/sepia' },
  { slug: 'clean-up-pdf-pages', prefix: '/zh', expectHref: '/tools/pdf/delete-pages' },
];

test.describe('유스케이스 — 신규 14종 렌더 + 단계 링크', () => {
  for (const { slug, prefix, expectHref } of CASES) {
    test(`${prefix}/use/${slug} — 단계 도구 링크 + HowTo + 하이드레이션 0`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (
          m.type() === 'error' &&
          /Minified React error #(418|421|423|425)|Hydration failed/i.test(m.text())
        ) {
          errors.push(`[hydration] ${m.text()}`);
        }
      });

      await page.goto(`${prefix}/use/${slug}`, { waitUntil: 'load' });

      await expect(page.locator('h1')).toBeVisible();

      const html = await page.content();
      // 로케일 use 페이지도 도구는 프리픽스 없이(/tools/...) 링크한다(공유 도구·ko canonical).
      expect(html.includes(`href="${expectHref}"`), `${slug}: 단계 링크 ${expectHref} 누락`).toBe(true);
      expect(html.includes('"HowTo"'), `${slug}: HowTo JSON-LD 누락`).toBe(true);
      expect(errors, `${slug}: 하이드레이션/페이지 에러`).toEqual([]);
    });
  }
});
