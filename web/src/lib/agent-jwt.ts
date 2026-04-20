import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Supabase 호환 HS256 JWT 서명.
 *
 * 에이전트가 Service Role Key 없이 Supabase(Realtime·REST)에 접근할 수 있도록,
 * 서버가 프로젝트의 JWT secret 으로 role=authenticated JWT 를 발급한다.
 * sub=user_id 이므로 RLS 정책 (user_id = auth.uid()) 이 그대로 적용된다.
 */

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export interface AgentJwtPayload {
  sub: string;           // user_id
  agent_id: string;
  role: 'authenticated';
  aud: 'authenticated';
  iat: number;
  exp: number;
}

export interface AgentJwtResult {
  access_token: string;
  expires_at: number;    // unix seconds
}

export function signAgentJwt(
  userId: string,
  agentId: string,
  jwtSecret: string,
  ttlSeconds = 60 * 60, // 1 hour
): AgentJwtResult {
  const now = Math.floor(Date.now() / 1000);
  const payload: AgentJwtPayload = {
    sub: userId,
    agent_id: agentId,
    role: 'authenticated',
    aud: 'authenticated',
    iat: now,
    exp: now + ttlSeconds,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const sig = base64url(createHmac('sha256', jwtSecret).update(data).digest());

  return {
    access_token: `${data}.${sig}`,
    expires_at: payload.exp,
  };
}

/**
 * API 키 형식 상수 시간 비교 (타이밍 공격 완화).
 * 길이 다르면 즉시 false 지만, 동일 길이일 때만 상수 시간 확인한다.
 */
export function safeCompareApiKey(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
