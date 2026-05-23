import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test.describe('어드민 페이지', () => {
  test('잘못된 키 → 접근 불가 안내', async ({ page }) => {
    await page.goto('/admin?key=wrong-key');
    await expect(page.getByText('접근 불가')).toBeVisible();
  });

  test('키 없음 → 접근 불가 안내', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('접근 불가')).toBeVisible();
  });

  test('올바른 키 → 어드민 UI 노출', async ({ page }) => {
    await page.goto('/admin?key=test-key');
    await expect(page.getByRole('heading', { name: '어드민' })).toBeVisible();
    await expect(page.getByText('상단 가로 배너')).toBeVisible();
    await expect(page.getByText('좌측 세로 배너')).toBeVisible();
    await expect(page.getByText('우측 세로 배너')).toBeVisible();
    await expect(page.getByText('GitHub Personal Access Token')).toBeVisible();
    await expect(page.getByText('사이트 사용 통계')).toBeVisible();
  });

  test('광고 코드 입력 + 미리보기 토글', async ({ page }) => {
    await page.goto('/admin?key=test-key');
    const textarea = page.locator('textarea').first();
    await textarea.fill('<div data-test="ad">광고 샘플</div>');
    await page.getByRole('button', { name: /미리보기/ }).first().click();
    await expect(page.locator('[data-test="ad"]')).toBeVisible();
  });

  test('GitHub 커밋 버튼은 토큰 없으면 비활성', async ({ page }) => {
    await page.goto('/admin?key=test-key');
    const btn = page.getByRole('button', { name: /GitHub 에 커밋/ });
    await expect(btn).toBeDisabled();
  });
});
