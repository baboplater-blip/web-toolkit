import { test, expect } from '@playwright/test';

/**
 * 지연 로드 오버레이 런처 회귀 가드.
 *
 * 성능을 위해 CommandPalette·CategoryDrawer·ShortcutsOverlay 는 전역 공유 청크에서
 * 빠지고 첫 트리거 시에만 `next/dynamic` 으로 로드된다(base-ui Dialog 를 초기
 * First-Load JS 에서 제거). 가벼운 런처만 단축키/이벤트를 감시하므로, **트리거 시
 * 실제로 오버레이가 마운트·표시되는지** 검증해 지연 로드 회귀를 막는다.
 */

test.describe('지연 로드 오버레이 — 트리거 시 정상 표시', () => {
  test('Ctrl+K → 명령 팔레트 열림(지연 로드)', async ({ page }) => {
    await page.goto('/tools');
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('? 키 → 단축키 오버레이 열림(지연 로드)', async ({ page }) => {
    await page.goto('/tools');
    // 입력 포커스가 아닌 곳에서 '?' (Shift+/) 입력
    await page.locator('body').click();
    await page.keyboard.press('Shift+Slash');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('open-category-drawer 이벤트 → 카테고리 드로어 열림(지연 로드)', async ({ page }) => {
    await page.goto('/tools');
    // 정적 export 하이드레이션이 끝나 런처 리스너가 붙기 전이면 이벤트를 놓칠 수
    // 있으므로(실사용은 버튼 클릭이라 무관), 표시될 때까지 재디스패치한다.
    await expect(async () => {
      await page.evaluate(() =>
        window.dispatchEvent(new Event('webtoolkit:open-category-drawer')),
      );
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 8000 });
  });
});
