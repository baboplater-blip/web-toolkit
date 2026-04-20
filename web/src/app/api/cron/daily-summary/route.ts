import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import type { PushSubscriptionRow } from '@/lib/supabase/types';

/**
 * GET /api/cron/daily-summary
 *
 * Vercel Cron 에서 하루 1회 호출. 어제 하루 동안의 사용자별 활동 요약을
 * 각자의 Web Push 구독 전부에 발송한다.
 *
 * 인증:
 *   - Vercel Cron 은 자동으로 `Authorization: Bearer <CRON_SECRET>` 을 붙인다
 *     (vercel.json 의 crons 설정 + CRON_SECRET env 필요).
 *   - 또는 자체 호출 시 같은 헤더를 수동 제공.
 *
 * 권한: Supabase service role key 로 모든 유저 push_subscriptions 조회.
 */

export const runtime = 'nodejs';
// 하루 한 번이지만 Vercel Hobby 는 단순 GET 쿨다운이 있어 max 한 번에 처리.
export const maxDuration = 60;

function err(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:noreply@acp.local';

  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
    return err(500, 'server_misconfigured');
  }

  const auth = req.headers.get('authorization') ?? '';
  const fromVercelCron = req.headers.get('x-vercel-cron') === '1';
  const expected = cronSecret ? `Bearer ${cronSecret}` : null;
  if (expected) {
    if (auth !== expected && !fromVercelCron) return err(401, 'unauthorized');
  } else if (!fromVercelCron) {
    // CRON_SECRET 미설정 시에도 외부 호출은 차단 — Vercel 내부 스케줄러만 허용.
    return err(401, 'unauthorized');
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setDate(now.getDate() - 1);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayStart.getDate() + 1);

  // 구독이 있는 사용자 목록
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('*');
  const subRows = ((subs as PushSubscriptionRow[] | null) ?? []).filter(
    (s) => s.notify_daily_summary,
  );
  if (subRows.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'no_subscriptions' });
  }

  const userIds = Array.from(new Set(subRows.map((s) => s.user_id)));

  // 유저별 어제 메시지 집계.
  const { data: msgs } = await admin
    .from('messages')
    .select('user_id, status, role, reaction')
    .in('user_id', userIds)
    .eq('role', 'assistant')
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', dayEnd.toISOString())
    .limit(50_000);

  type Row = {
    user_id: string;
    status: string;
    role: string;
    reaction: string | null;
  };
  const byUser = new Map<string, { completed: number; errors: number; ups: number }>();
  for (const r of ((msgs ?? []) as Row[])) {
    const b = byUser.get(r.user_id) ?? { completed: 0, errors: 0, ups: 0 };
    if (r.status === 'completed') b.completed += 1;
    else if (r.status === 'error') b.errors += 1;
    if (r.reaction === 'up') b.ups += 1;
    byUser.set(r.user_id, b);
  }

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];
  const dateLabel = `${dayStart.getMonth() + 1}/${dayStart.getDate()}`;

  for (const uid of userIds) {
    const stats = byUser.get(uid);
    if (!stats || stats.completed + stats.errors === 0) {
      // 활동 없는 날은 알림 생략.
      continue;
    }
    const parts: string[] = [];
    parts.push(`완료 ${stats.completed}`);
    if (stats.errors > 0) parts.push(`에러 ${stats.errors}`);
    if (stats.ups > 0) parts.push(`👍 ${stats.ups}`);
    const body = parts.join(' · ');

    const notification = JSON.stringify({
      title: `${dateLabel} 하루 요약`,
      body,
      variant: 'info',
      tag: 'acp-daily-summary',
      url: '/dashboard',
    });

    const mySubs = subRows.filter((s) => s.user_id === uid);
    await Promise.all(
      mySubs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            notification,
            { TTL: 60 * 60 * 24 },
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
  }

  if (expiredEndpoints.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
  }

  return NextResponse.json({
    sent,
    failed,
    expired: expiredEndpoints.length,
    users: userIds.length,
  });
}
