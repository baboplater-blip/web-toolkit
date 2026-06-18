/**
 * 코드 식별자 케이스 변환 — camel/Pascal/snake/kebab/CONSTANT/Title.
 * (code-case 도구 page.tsx 에서 추출 — 동작 동일)
 */

/** 식별자를 케이스 경계(대문자·_·-·공백·숫자 경계) 기준으로 토큰 분리. */
export function tokenize(identifier: string): string[] {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);
}

function capitalize(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1);
}

export const CASES: ReadonlyArray<{ label: string; convert: (tokens: string[]) => string }> = [
  {
    label: 'camelCase',
    convert: (tokens) => tokens.map((token, index) => (index === 0 ? token : capitalize(token))).join(''),
  },
  { label: 'PascalCase', convert: (tokens) => tokens.map(capitalize).join('') },
  { label: 'snake_case', convert: (tokens) => tokens.join('_') },
  { label: 'kebab-case', convert: (tokens) => tokens.join('-') },
  { label: 'CONSTANT_CASE', convert: (tokens) => tokens.map((token) => token.toUpperCase()).join('_') },
  { label: 'Title Case', convert: (tokens) => tokens.map(capitalize).join(' ') },
];

/** 각 케이스에 대해 입력 줄별 변환 결과를 줄바꿈으로 합친다. */
export function convertAll(input: string): Array<{ label: string; value: string }> {
  const lines = input.split('\n');
  return CASES.map(({ label, convert }) => ({
    label,
    value: lines
      .map((line) => {
        const tokens = tokenize(line);
        return tokens.length === 0 ? '' : convert(tokens);
      })
      .join('\n'),
  }));
}
