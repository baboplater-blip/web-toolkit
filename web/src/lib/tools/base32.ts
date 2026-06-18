/**
 * RFC 4648 Base32 인코딩/디코딩. 의존성 없음, 브라우저에서 동작.
 * (base32 도구 page.tsx 에서 추출 — 동작 동일)
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** 바이트 배열을 RFC 4648 Base32 문자열(대문자 + `=` 패딩)로 인코딩 */
export function encodeBase32(bytes: Uint8Array): string {
  let result = '';
  let buffer = 0;
  let bitsInBuffer = 0;

  for (let i = 0; i < bytes.length; i += 1) {
    buffer = (buffer << 8) | bytes[i];
    bitsInBuffer += 8;
    while (bitsInBuffer >= 5) {
      bitsInBuffer -= 5;
      result += BASE32_ALPHABET[(buffer >> bitsInBuffer) & 0x1f];
    }
  }

  if (bitsInBuffer > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bitsInBuffer)) & 0x1f];
  }

  // 8자 블록 단위로 패딩
  while (result.length % 8 !== 0) {
    result += '=';
  }
  return result;
}

/**
 * RFC 4648 Base32 문자열을 바이트 배열로 디코딩.
 * 알파벳 외 문자가 있으면 Error 를 던진다.
 */
export function decodeBase32(text: string): Uint8Array {
  const cleaned = text.replace(/=+$/u, '').replace(/\s/gu, '').toUpperCase();
  if (cleaned.length === 0) {
    return new Uint8Array(0);
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bitsInBuffer = 0;

  for (const char of cleaned) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`잘못된 Base32 문자입니다: "${char}"`);
    }
    buffer = (buffer << 5) | value;
    bitsInBuffer += 5;
    if (bitsInBuffer >= 8) {
      bitsInBuffer -= 8;
      bytes.push((buffer >> bitsInBuffer) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}
