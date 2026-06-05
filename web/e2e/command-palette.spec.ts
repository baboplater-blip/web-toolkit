import { test, expect } from '@playwright/test';

test.describe('명령 팔레트 (⌘K)', () => {
  test('Ctrl+K 로 열고 빈 상태에 바로가기(변환·비교·활용법)가 보인다', async ({ page }) => {
    await page.goto('/tools');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('바로가기')).toBeVisible();
    await expect(dialog.getByRole('option', { name: /파일 변환 모음/ })).toBeVisible();
  });

  test('검색하면 변환·활용법 버킷이 노출된다', async ({ page }) => {
    await page.goto('/tools');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByRole('textbox', { name: '검색' }).fill('webp');
    // 변환 버킷에 WebP 변환 항목이 떠야 한다
    await expect(dialog.getByRole('option', { name: /WebP/ }).first()).toBeVisible();
  });

  test('초성 검색으로 도구를 찾는다', async ({ page }) => {
    await page.goto('/tools');
    await page.keyboard.press('Control+k');
    await page.getByRole('textbox', { name: '검색' }).fill('ㅇㄱ');
    // 얼굴… 도구가 결과에 떠야 한다
    await expect(page.getByRole('option', { name: /얼굴/ }).first()).toBeVisible();
  });
});
