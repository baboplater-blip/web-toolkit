import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const EMPTY_ADS_CONFIG = {
  version: 1,
  updatedAt: '1970-01-01T00:00:00Z',
  slots: {
    top: { enabled: true, html: '', image: null },
    sidebarLeft: { enabled: true, html: '', image: null },
    sidebarRight: { enabled: true, html: '', image: null },
  },
};

test.describe('어드민 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/ads-config.json**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(EMPTY_ADS_CONFIG) }),
    );
  });

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

  test('토큰 없으면 저장 버튼 대신 PAT 입력 안내', async ({ page }) => {
    await page.goto('/admin?key=test-key');
    await expect(page.getByText(/저장하려면 GitHub PAT 입력 필요/)).toBeVisible();
    await expect(page.getByText('미입력')).toBeVisible();
  });

  test('이미지 업로드 UI가 슬롯마다 표시', async ({ page }) => {
    await page.goto('/admin?key=test-key');
    const uploadLabels = page.getByText('이미지 업로드');
    // 슬롯 4종: top · sidebarLeft · sidebarRight · inline
    await expect(uploadLabels).toHaveCount(4);
    await expect(page.getByText(/PNG · JPG · WebP/)).toHaveCount(4);
  });

  test('이미지 파일 업로드 → WebP 자동 변환 + 슬롯 사이즈 적용', async ({ page }) => {
    await page.goto('/admin?key=test-key');

    // 업로드 전: 슬롯 비율 안내 표시 확인 (잘리지 않음 명시)
    await expect(page.getByText(/비율 유지/).first()).toBeVisible();
    await expect(page.getByText(/970:90/)).toBeVisible();

    // 100x100 PNG 업로드 → 자동으로 970x90 WebP 변환
    const redPng100 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAVklEQVR42u3PMQ0AIAwAsLEMfwoNiYDjF7K9Qzv30c5jHaMQQAcd6KCDDjroBC10oIMOOuiggw46QQsd6KCDDjrooIN' +
        'O0EIHOuiggw466KAT9CrQAUFnQ3kZqGRyAAAAAElFTkSuQmCC',
      'base64',
    );
    const input = page.locator('input[type="file"]').first();
    await input.setInputFiles({ name: 'red.png', mimeType: 'image/png', buffer: redPng100 });

    // WebP 로 변환된 이미지 렌더 확인
    const previewImg = page.locator('img[src^="data:image/webp"]').first();
    await expect(previewImg).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[placeholder*="클릭 URL"]').first()).toBeVisible();
  });
});
