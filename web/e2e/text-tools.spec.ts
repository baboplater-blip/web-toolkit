import { test, expect } from '@playwright/test';

test.describe('텍스트 도구', () => {
  test('text/case — 대소문자 변환 결과가 즉시 표시된다', async ({ page }) => {
    await page.goto('/tools/text/case');
    const textarea = page.getByRole('textbox').first();
    await textarea.fill('Hello World');
    // 대문자 카드
    await expect(page.getByText('HELLO WORLD').first()).toBeVisible();
    // snake_case 카드 (결과 카드가 먼저 — 예시 라벨과 구분)
    await expect(page.getByText('hello_world', { exact: true }).first()).toBeVisible();
    // PascalCase
    await expect(page.getByText('HelloWorld').first()).toBeVisible();
  });

  test('text/sort — 정렬 후 결과 영역에 정렬된 줄이 보인다', async ({ page }) => {
    await page.goto('/tools/text/sort');
    const inputArea = page.locator('textarea').first();
    await inputArea.fill('banana\napple\ncherry');
    const result = page.locator('textarea').nth(1);
    await expect(result).toHaveValue(/apple\nbanana\ncherry/);
  });

  test('text/replace — 치환 결과가 즉시 반영된다', async ({ page }) => {
    await page.goto('/tools/text/replace');
    // 기본 텍스트가 'Hello' → 'Hi' 로 치환된 상태이므로 결과 영역 확인
    const result = page.locator('textarea').nth(1);
    await expect(result).toContainText('Hi World');
  });

  test('text/count — 단어/문자 카운트가 표시된다', async ({ page }) => {
    await page.goto('/tools/text/count');
    const textarea = page.getByRole('textbox').first();
    await textarea.fill('Hello World');
    await expect(page.getByText(/문자[\s\S]*공백[\s\S]*단어/).first()).toBeVisible();
  });

  test('text/html-entities — 인코드 결과', async ({ page }) => {
    await page.goto('/tools/text/html-entities');
    const result = page.locator('textarea').nth(1);
    // 기본 입력 '<div class="hello">...' 의 인코드 결과
    await expect(result).toContainText('&lt;div');
  });
});
