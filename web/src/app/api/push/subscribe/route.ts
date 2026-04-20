import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/push/subscribe
 *
 * 브라우저가 PushSubscription 을 받은 뒤 서버에 저장한다.
 * - 요청 body: PushSubscription 의 toJSON() 결과 (endpoint, keys.p256dh, keys.auth)
 * - 인증: Bearer <Supabase auth token> 헤더 (사용자 로그인 세션)
 * - UPSERT: 같은 endpoint 는 덮어쓴다 (한 기기에서 재구독 시).
 */

export const runtime = 'nodejs';

function err(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || !anonKey) return err(500, 'server_misconfigured');

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!token) return err(401, 'missing_token');

  // 사용자 JWT 검증
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return err(401, 'unauthorized');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, 'invalid_body');
  }
  const b = body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    userAgent?: string;
  };
  if (!b.endpoint || !b.keys?.p256dh || !b.keys?.auth) {
    return err(400, 'missing_fields');
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userData.user.id,
        endpoint: b.endpoint,
        p256dh: b.keys.p256dh,
        auth: b.keys.auth,
        user_agent: b.userAgent ?? req.headers.get('user-agent'),
      },
      { onConflict: 'endpoint' },
    );
  if (error) return err(500, 'save_failed');

  return NextResponse.json({ ok: true });
}
