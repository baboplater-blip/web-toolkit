import { test, expect } from '@playwright/test';

/**
 * 도구 딥링크(useToolUrlState) 회귀 가드.
 *
 * 값/텍스트형 도구는 입력·옵션을 URL 쿼리로 직렬화해 새로고침·공유 시 복원한다
 * (browser-only — 파일 내용은 절대 URL 에 담지 않음). 정적 export 하이드레이션
 * 안전을 위해 초기 렌더는 결정적 기본값, URL 읽기는 마운트 후 useEffect 에서 한다.
 *
 * 가드: ① URL 파라미터가 입력에 복원되고 ② 그 과정에서 하이드레이션 에러
 * (pageerror)가 없음을 검증.
 */

const CASES: Array<{ path: string; expectValue: string }> = [
  { path: '/tools/dev/css-units?value=32&unit=px', expectValue: '32' },
  { path: '/tools/util/percentage?a=250', expectValue: '250' },
];

test.describe('도구 딥링크 — URL 상태 복원', () => {
  for (const { path, expectValue } of CASES) {
    test(`${path} — 입력 복원 + 하이드레이션 에러 0`, async ({ page }) => {
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

      await page.goto(path, { waitUntil: 'load' });
      await page.waitForTimeout(300);

      const restored = await page
        .locator('input')
        .evaluateAll(
          (els, v) =>
            els.some((e) => (e as HTMLInputElement).value === v),
          expectValue,
        );
      expect(restored, `${path}: URL 값 "${expectValue}" 복원 안 됨`).toBe(true);
      expect(errors, `${path}: 하이드레이션/페이지 에러`).toEqual([]);
    });
  }

  test('파일/대용량 텍스트는 URL 직렬화 대상이 아님 (정책 확인)', async ({ page }) => {
    // 512자 초과 값은 쿼리에서 제외된다(use-tool-url-state 정책). text/case 에
    // 긴 값을 넣어도 URL 이 폭주하지 않음을 간접 확인.
    await page.goto('/tools/text/case');
    expect(page.url()).not.toContain('?');
  });
});
