/**
 * 구형 수동 등록 스크립트 — Service Role Key 의존성 때문에 제거되었습니다.
 * `npx tsx src/setup.ts` 또는 install.bat 을 사용하세요.
 */

console.error(
  [
    '',
    '[폐지됨] src/register.ts 는 더 이상 사용되지 않습니다.',
    '',
    '새 등록 절차:',
    '  1) 웹 UI > "PC 추가" 로 설치 토큰을 발급받으세요.',
    '  2) 원클릭: PowerShell 에 표시된 명령 (irm ... | iex) 을 실행하세요.',
    '  3) 또는 수동: 이 폴더에서 `npx tsx src/setup.ts` 실행.',
    '',
    'Service Role Key 는 더는 PC 에 저장하지 않습니다.',
    '',
  ].join('\n'),
);
process.exit(1);
