import { describe, it, expect } from 'vitest';
import { parseInput, type Converted } from './base-converter';

const ok = (r: ReturnType<typeof parseInput>): Converted => {
  if ('error' in r) throw new Error('expected success');
  return r;
};

describe('parseInput', () => {
  it('255(10진) → FF / 11111111', () => {
    const r = ok(parseInput('255', 10));
    expect(r.hex).toBe('FF');
    expect(r.binary).toBe('11111111');
    expect(r.octal).toBe('377');
    expect(r.decimal).toBe('255');
    expect(r.bitLength).toBe(8);
  });
  it('FF(16진) → 255', () => {
    expect(ok(parseInput('FF', 16)).decimal).toBe('255');
    expect(ok(parseInput('ff', 16)).decimal).toBe('255'); // 대소문자 무관
  });
  it('11111111(2진) → 255', () => {
    expect(ok(parseInput('11111111', 2)).decimal).toBe('255');
  });
  it('0 → bitLength 1', () => {
    const r = ok(parseInput('0', 10));
    expect(r.decimal).toBe('0');
    expect(r.bitLength).toBe(1);
  });
  it('음수 부호 보존', () => {
    const r = ok(parseInput('-255', 10));
    expect(r.decimal).toBe('-255');
    expect(r.hex).toBe('-FF');
    expect(r.negative).toBe(true);
  });
  it('거대 정수도 BigInt 로 정확히', () => {
    const big = '123456789012345678901234567890';
    expect(ok(parseInput(big, 10)).decimal).toBe(big);
  });
  it('빈 입력 → 빈 에러(무메시지)', () => {
    const r = parseInput('   ', 10);
    expect('error' in r && r.error).toBe('');
  });
  it('진법에 안 맞는 문자 → 에러', () => {
    const r = parseInput('2', 2); // 2진수에 2
    expect('error' in r && r.error).toContain('진법');
  });
});
