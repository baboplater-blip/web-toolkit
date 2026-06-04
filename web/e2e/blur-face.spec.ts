import { test, expect } from '@playwright/test';

/**
 * 얼굴·번호판 가리기 (이미지) + 동영상 얼굴 블러 렌더 스모크.
 *
 * 실제 얼굴 감지는 MediaPipe CDN 모델 + GPU 에 의존해 헤드리스에서 깊은 검증이
 * 어렵다. 여기서는 페이지가 크래시 없이 렌더되고 핵심 컨트롤이 노출되는지 확인한다.
 */

test('이미지 얼굴 가리기 — 헤더와 대상 토글이 보인다', async ({ page }) => {
  await page.goto('/tools/image/blur-face');
  await expect(page.getByRole('heading', { name: '얼굴·번호판 가리기' })).toBeVisible();
  // 대상 유형 토글 (얼굴 / 번호판)
  await expect(page.getByRole('button', { name: /번호판·기타/ })).toBeVisible();
});

test('동영상 얼굴 블러 — 헤더가 보인다', async ({ page }) => {
  await page.goto('/tools/video/blur-face');
  await expect(page.getByRole('heading', { name: '동영상 얼굴 블러' })).toBeVisible();
});
