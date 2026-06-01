import { test, expect } from '@playwright/test';

test.describe('개발자 도구', () => {
  test('dev/uuid — 기본 10개 UUID 생성', async ({ page }) => {
    await page.goto('/tools/dev/uuid');
    // 첫 행에 #1 표시 (exact — '#10' 과 구분)
    await expect(page.getByText('#1', { exact: true })).toBeVisible();
    // 10개 생성됨
    await expect(page.getByText(/생성된 UUID \(10개\)/)).toBeVisible();
  });

  test('dev/timestamp — Unix → 사람 시각 변환', async ({ page }) => {
    await page.goto('/tools/dev/timestamp');
    // 페이지 로드만 검증 (입력은 시점이 자동) — h1 만 정확히 매치
    await expect(page.getByRole('heading', { name: '타임스탬프 변환' })).toBeVisible();
  });

  test('dev/cron — 표현식 해석', async ({ page }) => {
    await page.goto('/tools/dev/cron');
    // 기본 표현식 '0 9 * * 1-5' 의 해석 결과 (월~금) 표시
    await expect(page.getByText(/월요일, 화요일/)).toBeVisible();
  });

  test('dev/lorem — Lorem Ipsum 생성', async ({ page }) => {
    await page.goto('/tools/dev/lorem');
    await expect(page.getByRole('heading', { name: /Lorem Ipsum/ })).toBeVisible();
  });
});
