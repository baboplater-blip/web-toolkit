import { test, expect } from '@playwright/test';

/**
 * 신규 도구 36종(2026-06 라운드) 골든 패스 스모크.
 *
 * 각 도구 페이지가 ① 클라이언트 마운트 중 uncaught 에러 없이 로드되고,
 * ② 공통 ToolHeader("도구 목록" 뒤로가기 링크 + h1)가 렌더되는지 검증한다.
 * 마운트 시 throw(잘못된 import·초기 상태 버그)가 가장 흔한 회귀라 이를 우선 포착한다.
 */

const NEW_TOOLS: Array<{ route: string; title: string }> = [
  // dev 8
  { route: 'dev/curl-to-code', title: 'cURL 변환' },
  { route: 'dev/json-to-go', title: 'JSON → Go 구조체' },
  { route: 'dev/css-units', title: 'CSS 단위 변환' },
  { route: 'dev/chmod-calc', title: 'chmod 계산기' },
  { route: 'dev/user-agent-parser', title: 'User-Agent 분석' },
  { route: 'dev/http-status', title: 'HTTP 상태 코드' },
  { route: 'dev/dotenv-json', title: '.env ↔ JSON' },
  { route: 'dev/color-name', title: '색상 이름 찾기' },
  // text 6
  { route: 'text/reverse-text', title: '텍스트 뒤집기' },
  { route: 'text/line-numbers', title: '줄 번호 매기기' },
  { route: 'text/text-repeat', title: '텍스트 반복' },
  { route: 'text/bionic-reading', title: '바이오닉 리딩' },
  { route: 'text/ascii-banner', title: 'ASCII 배너' },
  { route: 'text/zalgo-text', title: '글리치(자고) 텍스트' },
  // util 8
  { route: 'util/tip-calc', title: '팁 계산기' },
  { route: 'util/dice-roller', title: '주사위 굴리기' },
  { route: 'util/coin-flip', title: '동전 던지기' },
  { route: 'util/subnet-calc', title: '서브넷 계산기' },
  { route: 'util/scientific-calc', title: '공학용 계산기' },
  { route: 'util/fuel-cost', title: '유류비 계산기' },
  { route: 'util/lottery-number', title: '로또 번호 생성기' },
  { route: 'util/random-number', title: '난수 생성기' },
  // security 4
  { route: 'security/hmac-gen', title: 'HMAC 생성기' },
  { route: 'security/base32', title: 'Base32 인코딩' },
  { route: 'security/bcrypt', title: 'bcrypt 해시' },
  { route: 'security/wifi-qr', title: 'WiFi QR 생성기' },
  // docs 4
  { route: 'docs/json-flatten', title: 'JSON 평탄화' },
  { route: 'docs/csv-merge', title: 'CSV 병합' },
  { route: 'docs/csv-split', title: 'CSV 분할' },
  { route: 'docs/jsonl-viewer', title: 'JSONL 뷰어' },
  // image 4
  { route: 'image/blur', title: '이미지 흐리게' },
  { route: 'image/border', title: '이미지 테두리' },
  { route: 'image/placeholder', title: '플레이스홀더 이미지' },
  { route: 'image/histogram', title: '이미지 히스토그램' },
  // pdf 2
  { route: 'pdf/reverse', title: 'PDF 페이지 역순' },
  { route: 'pdf/booklet', title: 'PDF 소책자 만들기' },
];

test.describe('신규 도구 36종 — 골든 패스 스모크', () => {
  for (const { route, title } of NEW_TOOLS) {
    test(`${route} — 마운트 에러 없이 ToolHeader 렌더`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto(`/tools/${route}`);

      // ToolHeader 공통 요소: "도구 목록" 뒤로가기 링크 + 제목 h1
      await expect(page.getByRole('link', { name: '도구 목록' })).toBeVisible();
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();

      // 마운트 중 uncaught 에러 0
      expect(errors, `pageerror on /tools/${route}: ${errors.join(' | ')}`).toEqual([]);
    });
  }
});

test.describe('신규 도구 — 기능 정확성', () => {
  test('dev/css-units — 16px = 1rem 환산', async ({ page }) => {
    await page.goto('/tools/dev/css-units');
    await page.getByPlaceholder('예: 16').fill('16');
    await expect(page.getByText('1rem')).toBeVisible();
  });

  test('dev/chmod-calc — 755 → rwxr-xr-x', async ({ page }) => {
    await page.goto('/tools/dev/chmod-calc');
    await page.getByRole('textbox').fill('755');
    await expect(page.getByText('rwxr-xr-x')).toBeVisible();
  });

  test('dev/color-name — #ff0000 → red 정확 일치', async ({ page }) => {
    await page.goto('/tools/dev/color-name');
    await page.getByRole('textbox').fill('#ff0000');
    await expect(page.getByText('정확히 일치')).toBeVisible();
    await expect(page.getByText(/\bred\b/)).toBeVisible();
  });

  test('dev/json-to-go — JSON → Go struct', async ({ page }) => {
    await page.goto('/tools/dev/json-to-go');
    await page.getByLabel('JSON 입력').fill('{"id":1,"title":"x"}');
    await expect(page.getByText(/struct/).first()).toBeVisible();
  });

  test('dev/http-status — 404 검색 → Not Found', async ({ page }) => {
    await page.goto('/tools/dev/http-status');
    await page.getByLabel('상태 코드 검색').fill('404');
    await expect(page.getByText(/Not Found/i).first()).toBeVisible();
  });

  test('text/reverse-text — abc → cba', async ({ page }) => {
    await page.goto('/tools/text/reverse-text');
    await page.getByLabel('입력').fill('abc');
    await expect(page.getByLabel('결과')).toHaveValue('cba');
  });

  test('text/line-numbers — 줄 번호 부여', async ({ page }) => {
    await page.goto('/tools/text/line-numbers');
    await page.getByLabel('입력').fill('foo\nbar');
    await expect(page.getByLabel('결과')).toHaveValue(/1\. foo[\s\S]*2\. bar/);
  });

  test('util/tip-calc — 50000 + 15% = 총액 ₩57,500', async ({ page }) => {
    await page.goto('/tools/util/tip-calc');
    await page.getByPlaceholder('예: 50000').fill('50000');
    await expect(page.getByText(/₩?57,500/).first()).toBeVisible();
  });

  test('util/subnet-calc — 기본 /24 결과', async ({ page }) => {
    await page.goto('/tools/util/subnet-calc');
    // 기본값 192.168.0.1 /24 → 즉시 결정적 결과
    await expect(page.getByText('255.255.255.0')).toBeVisible();
    await expect(page.getByText('192.168.0.255')).toBeVisible();
  });

  test('security/base32 — hello → NBSWY3DP', async ({ page }) => {
    await page.goto('/tools/security/base32');
    await page.getByLabel('입력').fill('hello');
    await expect(page.getByText(/NBSWY3DP/i)).toBeVisible();
  });

  test('security/hmac-gen — HMAC-SHA256 64자리 hex 생성', async ({ page }) => {
    await page.goto('/tools/security/hmac-gen');
    await page.getByLabel('비밀키').fill('key');
    await page.getByLabel('메시지').fill('hello');
    await page.getByRole('button', { name: 'HMAC 생성' }).click();
    await expect(page.getByText(/^[0-9a-f]{64}$/)).toBeVisible();
  });

  test('docs/json-flatten — 중첩 → 점 표기 키', async ({ page }) => {
    await page.goto('/tools/docs/json-flatten');
    await page.getByLabel('입력').fill('{"a":{"b":1}}');
    await expect(page.getByLabel('결과')).toHaveValue(/"a\.b": 1/);
  });

  // ── 도구 팩 3 (320) 대표 기능 ──
  test('text/remove-accents — café → cafe', async ({ page }) => {
    await page.goto('/tools/text/remove-accents');
    await page.getByLabel('입력').fill('café résumé');
    await expect(page.getByLabel('결과')).toHaveValue('cafe resume');
  });

  test('security/cc-validate — 4111... → Visa', async ({ page }) => {
    await page.goto('/tools/security/cc-validate');
    await page.getByPlaceholder('예: 4111 1111 1111 1111').fill('4111111111111111');
    await expect(page.getByText(/Visa/i).first()).toBeVisible();
  });

  test('dev/code-case — helloWorld → hello_world', async ({ page }) => {
    await page.goto('/tools/dev/code-case');
    await page.getByPlaceholder(/userProfileId/).fill('helloWorld');
    await expect(page.getByText('hello_world').first()).toBeVisible();
  });
});
