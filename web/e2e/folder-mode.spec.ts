import { test, expect } from '@playwright/test';

test.describe('폴더 모드 UI', () => {
  test('이미지 변환 페이지에 파일/폴더 토글 탭이 있다', async ({ page }) => {
    await page.goto('/tools/image/convert');
    // 토글 — 파일/폴더 두 버튼
    await expect(page.getByRole('button', { name: '파일', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '폴더', exact: true })).toBeVisible();
  });

  test('폴더 모드 전환 시 폴더 드롭존 안내가 노출된다', async ({ page }) => {
    await page.goto('/tools/image/convert');
    await page.getByRole('button', { name: '폴더', exact: true }).click();
    await expect(page.getByText(/폴더 안의 모든 이미지/)).toBeVisible();
  });

  test('PDF 합치기에도 파일/폴더 모드 토글이 있다', async ({ page }) => {
    await page.goto('/tools/pdf/merge');
    await expect(page.getByRole('button', { name: '폴더', exact: true })).toBeVisible();
  });
});
