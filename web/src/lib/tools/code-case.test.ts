import { describe, it, expect } from 'vitest';
import { tokenize, convertAll } from './code-case';

const get = (input: string, label: string) =>
  convertAll(input).find((r) => r.label === label)!.value;

describe('tokenize', () => {
  it('camelCase 경계 분리', () => {
    expect(tokenize('userProfileId')).toEqual(['user', 'profile', 'id']);
  });
  it('snake/kebab/공백 분리', () => {
    expect(tokenize('user_profile_id')).toEqual(['user', 'profile', 'id']);
    expect(tokenize('user-profile-id')).toEqual(['user', 'profile', 'id']);
    expect(tokenize('User Profile Id')).toEqual(['user', 'profile', 'id']);
  });
  it('연속 대문자(약어) 경계', () => {
    expect(tokenize('HTMLParser')).toEqual(['html', 'parser']);
    expect(tokenize('parseHTMLString')).toEqual(['parse', 'html', 'string']);
  });
});

describe('convertAll 케이스 출력', () => {
  it('userProfileId → 각 케이스', () => {
    expect(get('userProfileId', 'camelCase')).toBe('userProfileId');
    expect(get('userProfileId', 'PascalCase')).toBe('UserProfileId');
    expect(get('userProfileId', 'snake_case')).toBe('user_profile_id');
    expect(get('userProfileId', 'kebab-case')).toBe('user-profile-id');
    expect(get('userProfileId', 'CONSTANT_CASE')).toBe('USER_PROFILE_ID');
    expect(get('userProfileId', 'Title Case')).toBe('User Profile Id');
  });
  it('여러 줄은 줄별로 변환', () => {
    expect(get('fooBar\nbazQux', 'snake_case')).toBe('foo_bar\nbaz_qux');
  });
  it('빈 줄은 빈 줄로 보존', () => {
    expect(get('fooBar\n\nbazQux', 'kebab-case')).toBe('foo-bar\n\nbaz-qux');
  });
  it('항상 6개 케이스 반환', () => {
    expect(convertAll('test')).toHaveLength(6);
  });
});
