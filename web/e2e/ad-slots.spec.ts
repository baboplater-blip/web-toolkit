import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });

test.describe('광고 배너 슬롯', () => {
  test('상단 + 좌측 + 우측 슬롯이 표시 (xl 화면)', async ({ page }) => {
    await page.goto('/tools');
    const top = page.locator('[data-ad-slot="top-banner"]');
    const left = page.locator('[data-ad-slot="sidebar-left"]');
    const right = page.locator('[data-ad-slot="sidebar-right"]');
    await expect(top).toBeVisible();
    await expect(left).toBeVisible();
    await expect(right).toBeVisible();

    const leftBox = await left.boundingBox();
    const rightBox = await right.boundingBox();
    expect(leftBox).toBeTruthy();
    expect(rightBox).toBeTruthy();
    if (leftBox && rightBox) expect(leftBox.x).toBeLessThan(rightBox.x);
  });

  test('모바일에서는 사이드는 숨고 상단만 표시', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/tools');
    await expect(page.locator('[data-ad-slot="top-banner"]')).toBeVisible();
    await expect(page.locator('[data-ad-slot="sidebar-left"]')).toBeHidden();
    await expect(page.locator('[data-ad-slot="sidebar-right"]')).toBeHidden();
  });

  test('도구 페이지에서 ← 클릭 + 광고가 함께 표시', async ({ page }) => {
    await page.goto('/tools/image/batch-compress');
    await expect(page.locator('[data-ad-slot="top-banner"]')).toBeVisible();
    const back = page.getByRole('link', { name: '도구 목록으로' });
    await back.click();
    await expect(page).toHaveURL(/\/tools\/?$/);
  });
});
