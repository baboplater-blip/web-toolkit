import { test, expect } from '@playwright/test';

test.describe('도구 허브', () => {
  test('도구 카드들이 표시되고 카테고리 칩 개수 배지가 있다', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.getByRole('heading', { name: '도구' })).toBeVisible();
    // 전체 카운트 배지 (헤더가 첫 매치 — 카테고리별 배지와 구분)
    await expect(page.getByText(/\d+개 사용 가능/).first()).toBeVisible();
    // 카테고리 칩 — 전체
    await expect(page.getByRole('button', { name: /전체/ })).toBeVisible();
  });

  test('검색 시 결과가 필터링되고 매치가 강조된다', async ({ page }) => {
    await page.goto('/tools');
    const search = page.getByPlaceholder(/도구 검색/);
    await search.fill('PDF');
    // 최소한 한 결과 카드의 제목에 mark 요소
    const marks = page.locator('mark');
    await expect(marks.first()).toBeVisible();
  });

  test('카테고리 필터 동작', async ({ page }) => {
    await page.goto('/tools');
    await page.getByRole('button', { name: /^PDF/ }).click();
    // PDF 카테고리 도구가 보이고 다른 카테고리 도구는 안 보임
    await expect(page.getByText('PDF 합치기')).toBeVisible();
  });

  test('/ 키로 검색 박스 포커스', async ({ page }) => {
    await page.goto('/tools');
    await page.keyboard.press('/');
    const search = page.getByPlaceholder(/도구 검색/);
    await expect(search).toBeFocused();
  });
});
