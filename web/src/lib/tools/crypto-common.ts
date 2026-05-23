/**
 * Web Crypto API 공통 유틸. AES-GCM + PBKDF2 키 유도.
 * - 모든 처리는 브라우저 안에서 수행
 * - 파일/텍스트 양쪽에서 같은 포맷 사용 → 상호 호환
 *
 * 파일/페이로드 포맷 (binary):
 *   [magic 4B "WTK1"][salt 16B][iv 12B][ciphertext + auth tag]
 */

const MAGIC = new Uint8Array([0x57, 0x54, 0x4b, 0x31]); // "WTK1"
const SALT_LEN = 16;
const IV_LEN = 12;
const PBKDF2_ITERATIONS = 250_000;

export interface EncryptResult {
  bytes: Uint8Array;
  salt: Uint8Array;
  iv: Uint8Array;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptBytes(
  data: Uint8Array,
  passphrase: string,
): Promise<EncryptResult> {
  if (!passphrase) throw new Error('비밀번호를 입력하세요.');
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(passphrase, salt);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    data as unknown as BufferSource,
  );
  const cipher = new Uint8Array(cipherBuf);

  const out = new Uint8Array(MAGIC.length + SALT_LEN + IV_LEN + cipher.length);
  out.set(MAGIC, 0);
  out.set(salt, MAGIC.length);
  out.set(iv, MAGIC.length + SALT_LEN);
  out.set(cipher, MAGIC.length + SALT_LEN + IV_LEN);
  return { bytes: out, salt, iv };
}

export async function decryptBytes(
  data: Uint8Array,
  passphrase: string,
): Promise<Uint8Array> {
  if (!passphrase) throw new Error('비밀번호를 입력하세요.');
  if (data.length < MAGIC.length + SALT_LEN + IV_LEN + 16) {
    throw new Error('암호화된 데이터가 아닙니다.');
  }
  for (let i = 0; i < MAGIC.length; i++) {
    if (data[i] !== MAGIC[i]) {
      throw new Error('Web Toolkit 형식이 아닙니다 (매직 헤더 불일치).');
    }
  }
  const salt = data.slice(MAGIC.length, MAGIC.length + SALT_LEN);
  const iv = data.slice(MAGIC.length + SALT_LEN, MAGIC.length + SALT_LEN + IV_LEN);
  const cipher = data.slice(MAGIC.length + SALT_LEN + IV_LEN);
  const key = await deriveKey(passphrase, salt);
  try {
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      cipher as unknown as BufferSource,
    );
    return new Uint8Array(plainBuf);
  } catch {
    throw new Error('복호화 실패 — 비밀번호가 틀렸거나 데이터가 손상되었습니다.');
  }
}

/** UTF-8 텍스트 ↔ Uint8Array */
export const TEXT_ENC = new TextEncoder();
export const TEXT_DEC = new TextDecoder('utf-8', { fatal: true });

/** Uint8Array → Base64 (대용량 안전, 청크) */
export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let result = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    result += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(result);
}

/** Base64 → Uint8Array (공백·줄바꿈 허용) */
export function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/\s+/g, '');
  const bin = atob(cleaned);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
