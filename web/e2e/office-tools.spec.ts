import { test, expect } from '@playwright/test';

/**
 * 오피스/회사원 실무 도구 골든패스 (2026-06-01 라운드).
 * 정적 빌드(out/) 대상으로 핵심 동작만 검증 — 정확한 금액이 아니라 계산·생성이
 * 일어나는지를 확인한다.
 */

test.describe('급여·세무 계산기', () => {
  test('연봉 실수령액 — 입력하면 실수령액이 나온다', async ({ page }) => {
    await page.goto('/tools/util/salary');
    await page.getByLabel('급여 금액').fill('45000000');
    await expect(page.getByText('월 실수령액')).toBeVisible();
    // 실수령액(원)이 렌더 — 공제 내역 섹션도 노출
    await expect(page.getByText('공제 내역 (월)')).toBeVisible();
    await expect(page.getByText('국민연금 (4.5%)')).toBeVisible();
  });

  test('부가세 — 합계에서 공급가액·세액 역산', async ({ page }) => {
    await page.goto('/tools/util/vat');
    await page.getByLabel('금액').fill('1100000');
    // 합계 1,100,000 → 공급가액 1,000,000 · 부가세 100,000 (결과 숫자는 고유)
    await expect(page.getByText('1,000,000원', { exact: true })).toBeVisible();
    await expect(page.getByText('100,000원', { exact: true })).toBeVisible();
  });

  test('퇴직금 — 날짜+급여 입력 시 예상 퇴직금', async ({ page }) => {
    await page.goto('/tools/util/severance');
    await page.getByLabel('입사일').fill('2021-01-01');
    await page.getByLabel('퇴사일').fill('2024-12-31');
    await page.getByLabel('3개월 임금총액').fill('11250000');
    await expect(page.getByText('예상 퇴직금')).toBeVisible();
  });
});

test.describe('생성기', () => {
  test('직인 — 캔버스 미리보기 + 저장 버튼', async ({ page }) => {
    await page.goto('/tools/image/seal');
    await expect(page.getByLabel('도장 미리보기')).toBeVisible();
    await expect(page.getByRole('button', { name: /투명 PNG 저장/ })).toBeVisible();
  });

  test('vCard QR — 입력하면 QR 이미지 생성', async ({ page }) => {
    await page.goto('/tools/util/vcard-qr');
    await page.getByLabel('이름').fill('홍길동');
    await page.getByLabel('휴대폰').fill('010-1234-5678');
    await expect(page.getByAltText('vCard QR')).toBeVisible();
  });
});

test.describe('문서 실무', () => {
  test('민감정보 마스킹 — 주민번호가 가려진다', async ({ page }) => {
    await page.goto('/tools/security/redact');
    await page.getByLabel('원문').fill('내 번호는 901201-1234567 입니다');
    const out = page.getByLabel('마스킹 결과');
    // 주민등록번호는 생년월일 노출 차단을 위해 전 숫자를 마스킹한다(보안 강화, redact 규칙 `\d→*`).
    await expect(out).toHaveValue(/\*{6}[-\s]?\*{7}/);
    await expect(out).not.toHaveValue(/901201/);
  });

  test('Excel 수식 — VLOOKUP 수식이 생성된다', async ({ page }) => {
    await page.goto('/tools/docs/excel-formula');
    await expect(page.getByText('생성된 수식')).toBeVisible();
    await expect(page.getByText(/=VLOOKUP\(/)).toBeVisible();
  });
});
