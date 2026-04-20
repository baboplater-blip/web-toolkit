import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import type { PushSubscriptionRow } from '@/lib/supabase/types';

/**
 * POST /api/push/test
 *
 * 로그인한 사용자가 자신의 구독 전체에 테스트 푸시를 보낸다.
 * - 인증: Bearer <Supabase auth token>
 */

export const runtime = 'nodejs';

function err(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:noreply@acp.local';

  if (!supabaseUrl || !serviceKey || !anonKey || !vapidPublic || !vapidPrivate) {
    return err(500, 'server_misconfigured');
  }

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) return err(401, 'missing_token');

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return err(401, 'unauthorized');
  const uid = userData.user.id;

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', uid);
  const rows = (subs as PushSubscriptionRow[] | null) ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'no_subscriptions' });
  }

  const notification = JSON.stringify({
    title: 'ACP 테스트 알림',
    body: '푸시 알림이 정상적으로 동작합니다 ✅',
    variant: 'info',
    tag: 'acp-test',
    url: '/settings?tab=diagnostics',
  });

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];
  await Promise.all(
    rows.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notification,
          { TTL: 60 },
        );
        sent += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expiredEndpoints.push(s.endpoint);
        } else {
          failed += 1;
        }
      }
    }),
  );

  if (expiredEndpoints.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
  }

  return NextResponse.json({ sent, failed, expired: expiredEndpoints.length });
}
