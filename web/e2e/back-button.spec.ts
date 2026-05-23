import { test, expect } from '@playwright/test';

test.describe('뒤로가기 ← 버튼 검증', () => {
  test('이미지 일괄 압축 → ← 클릭 → /tools 로 이동', async ({ page }) => {
    await page.goto('/tools/image/batch-compress');
    await expect(page.getByRole('heading', { name: /일괄 압축/ })).toBeVisible();

    const back = page.getByRole('link', { name: '도구 목록으로' });
    await expect(back).toBeVisible();
    await back.click();

    await expect(page).toHaveURL(/\/tools\/?$/);
    await expect(page.getByText('도구 모음').or(page.getByText('Web Toolkit'))).toBeVisible();
  });

  test('PDF 합치기 → ← 클릭', async ({ page }) => {
    await page.goto('/tools/pdf/merge');
    const back = page.getByRole('link', { name: '도구 목록으로' });
    await back.click();
    await expect(page).toHaveURL(/\/tools\/?$/);
  });

  test('이미지 변환 → ← 클릭', async ({ page }) => {
    await page.goto('/tools/image/convert');
    const back = page.getByRole('link', { name: '도구 목록으로' });
    await back.click();
    await expect(page).toHaveURL(/\/tools\/?$/);
  });

  test('← 버튼이 a 태그로 렌더링되는지 확인', async ({ page }) => {
    await page.goto('/tools/image/batch-compress');
    const back = page.getByRole('link', { name: '도구 목록으로' });
    const tagName = await back.evaluate((el) => el.tagName);
    expect(tagName).toBe('A');
    const inside = await back.evaluate((el) => el.querySelector('button'));
    expect(inside).toBeNull();
  });
});
