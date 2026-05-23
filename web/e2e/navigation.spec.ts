import { test, expect } from '@playwright/test';

test.describe('도구 네비게이션', () => {
  test('도구 페이지에 prev/next 네비가 노출된다', async ({ page }) => {
    await page.goto('/tools/text/case');
    // 같은 카테고리 (text) 안에 다른 도구가 있으므로 nav 가 보여야 함
    const nav = page.getByRole('navigation', { name: '도구 네비게이션' });
    await expect(nav).toBeVisible();
    // 다음/이전 중 적어도 하나는 활성
    await expect(nav.getByText('다음')).toBeVisible();
  });

  test('카테고리 메뉴를 열어 다른 도구로 이동', async ({ page }) => {
    await page.goto('/tools/text/case');
    const nav = page.getByRole('navigation', { name: '도구 네비게이션' });
    const menuBtn = nav.getByRole('button');
    await menuBtn.click();
    await expect(page.getByRole('listbox')).toBeVisible();
  });

  test('허브 페이지에는 네비가 표시되지 않는다', async ({ page }) => {
    await page.goto('/tools');
    const nav = page.getByRole('navigation', { name: '도구 네비게이션' });
    await expect(nav).toHaveCount(0);
  });
});
