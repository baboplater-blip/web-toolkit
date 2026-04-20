import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * signAgentJwt 로 발급한 에이전트 JWT 를 검증해 payload 를 돌려준다.
 * 실패 시 null.
 */

function base64urlToBuffer(s: string): Buffer {
  const pad = 4 - (s.length % 4);
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + (pad === 4 ? '' : '='.repeat(pad));
  return Buffer.from(b64, 'base64');
}

export interface VerifiedAgentJwt {
  sub: string;        // user_id
  agent_id: string;
  role: string;
  exp: number;
}

export function verifyAgentJwt(token: string, secret: string): VerifiedAgentJwt | null {
  if (typeof token !== 'string' || token.length === 0) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encHeader, encPayload, encSig] = parts;

  // signature check
  const data = `${encHeader}.${encPayload}`;
  const expected = createHmac('sha256', secret).update(data).digest();
  const actual = base64urlToBuffer(encSig);
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;

  // header alg check
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(base64urlToBuffer(encHeader).toString('utf8'));
  } catch {
    return null;
  }
  if (header.alg !== 'HS256') return null;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64urlToBuffer(encPayload).toString('utf8'));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) return null;
  if (typeof payload.sub !== 'string') return null;
  if (typeof payload.agent_id !== 'string') return null;

  return {
    sub: payload.sub,
    agent_id: payload.agent_id,
    role: String(payload.role ?? ''),
    exp: payload.exp,
  };
}
