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

test.describe('신규 도구 — 대표 기능 동작', () => {
  test('util/tip-calc — 금액·팁 입력 시 결과 노출', async ({ page }) => {
    await page.goto('/tools/util/tip-calc');
    // 입력창(계산서 금액)에 값 입력 — Input 은 textbox role
    await page.getByRole('textbox').first().fill('50000');
    // 결과 영역에 통화/숫자가 나타남 (구체 UI 비의존: 숫자 그룹 등장)
    await expect(page.getByText(/원|₩|[0-9],[0-9]{3}/).first()).toBeVisible();
  });

  test('security/base32 — 인코딩 결과 생성', async ({ page }) => {
    await page.goto('/tools/security/base32');
    const ta = page.getByRole('textbox').first();
    await ta.fill('hello');
    // RFC4648 'hello' → 'NBSWY3DP'
    await expect(page.getByText(/NBSWY3DP/i)).toBeVisible();
  });

  test('dev/css-units — 변환 표 노출', async ({ page }) => {
    await page.goto('/tools/dev/css-units');
    await page.getByRole('textbox').first().fill('16');
    // 16px = 1rem 환산 결과 어딘가 노출
    await expect(page.getByText(/rem/i).first()).toBeVisible();
  });
});
