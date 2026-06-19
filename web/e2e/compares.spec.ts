import { test, expect } from '@playwright/test';

/**
 * 비교(/compare/{slug}) 회귀 가드 — 라운드9 신규 10종.
 *
 * "X vs Y" 비교는 두 도구 중 무엇을 쓸지 검색하는 의도를 잡아 양쪽 도구로
 * 연결한다. 각 option.toolId 는 실제 큐레이트된 도구여야 하며, 정적 export
 * 하이드레이션 안전해야 한다. 로케일별 도구 링크 형태가 다르므로(ko:
 * /tools/{cat}/{id}, en·ja·zh: /{loc}/tools/{id}) 링크는 toolId 로 끝나는지로 검증.
 *
 * 가드: ① 페이지가 뜨고 ② 두 비교 대상 도구 링크가 모두 렌더되며
 * ③ 하이드레이션/페이지 에러가 없음.
 */

const CASES: Array<{ slug: string; prefix: string; a: string; b: string }> = [
  { slug: 'crontab-builder-vs-cron-explainer', prefix: '', a: 'crontab-builder', b: 'cron' },
  { slug: 'hash-identifier-vs-text-hash', prefix: '', a: 'hash-identifier', b: 'text-hash' },
  { slug: 'css-clamp-vs-css-units', prefix: '', a: 'css-clamp', b: 'css-units' },
  { slug: 'luhn-generator-vs-cc-validate', prefix: '', a: 'luhn-generator', b: 'cc-validate' },
  { slug: 'json-schema-vs-json-to-ts', prefix: '/en', a: 'json-schema', b: 'json-to-ts' },
  { slug: 'markdown-table-vs-html-table', prefix: '', a: 'markdown-table', b: 'csv-to-html' },
  { slug: 'world-clock-vs-timezone-converter', prefix: '/ja', a: 'world-clock', b: 'timezone' },
  { slug: 'readability-vs-word-count', prefix: '', a: 'readability', b: 'count' },
  { slug: 'bill-split-vs-tip-calculator', prefix: '', a: 'bill-split', b: 'tip-calc' },
  // 로케일(/zh) 도구 라우트는 registry id(bmi-calc)를 쓴다(ko 전체경로 세그먼트 bmi 와 다름).
  { slug: 'ideal-weight-vs-bmi', prefix: '/zh', a: 'ideal-weight', b: 'bmi-calc' },
  // 라운드12 — 팩5 비교 (ko prefix는 href 세그먼트, 로케일은 registry id)
  { slug: 'ovulation-vs-due-date', prefix: '', a: 'ovulation', b: 'due-date' },
  { slug: 'date-add-vs-date-diff', prefix: '', a: 'date-add', b: 'date-diff' },
  { slug: 'csv-to-sql-vs-csv-to-html', prefix: '', a: 'csv-to-sql', b: 'csv-to-html' },
  { slug: 'regex-escape-vs-string-escape', prefix: '/en', a: 'regex-escape', b: 'string-escape' },
  { slug: 'bpm-tap-vs-metronome', prefix: '', a: 'bpm-tap', b: 'metronome' },
];

test.describe('비교 — 신규 10종 렌더 + 양쪽 도구 링크', () => {
  for (const { slug, prefix, a, b } of CASES) {
    test(`${prefix}/compare/${slug} — 두 도구 링크 + 하이드레이션 0`, async ({ page }) => {
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

      await page.goto(`${prefix}/compare/${slug}`, { waitUntil: 'load' });
      await expect(page.locator('h1').first()).toBeVisible();

      const html = await page.content();
      // 로케일별 도구 경로 형태가 달라 toolId 로 끝나는 링크 존재로 검증.
      const reA = new RegExp(`href="[^"]*/${a}"`);
      const reB = new RegExp(`href="[^"]*/${b}"`);
      expect(reA.test(html), `${slug}: 도구 링크 …/${a} 누락`).toBe(true);
      expect(reB.test(html), `${slug}: 도구 링크 …/${b} 누락`).toBe(true);
      expect(errors, `${slug}: 하이드레이션/페이지 에러`).toEqual([]);
    });
  }
});
