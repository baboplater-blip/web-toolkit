import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { verifyAgentJwt } from '@/lib/verify-agent-jwt';
import { rateLimit, clientIp, rateLimitedResponse } from '@/lib/rate-limit';
import type { PushSubscriptionRow } from '@/lib/supabase/types';

/**
 * POST /api/push/notify
 *
 * 에이전트가 작업 완료/에러/취소 시 자기 사용자의 모든 Push 구독에 알림을 발송하도록 요청한다.
 * - 인증: Bearer <agent JWT> (/api/agent/auth 로 발급된 토큰, HS256, secret=SUPABASE_JWT_SECRET)
 * - body: {
 *     title, body, variant: 'success'|'error'|'warning'|'info',
 *     agentId, conversationId?, tag?
 *   }
 *
 * 응답: { sent, failed, expired }
 */

export const runtime = 'nodejs';

function err(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

interface NotifyBody {
  title?: string;
  body?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  agentId?: string;
  conversationId?: string;
  tag?: string;
}

export async function POST(req: NextRequest) {
  // Push 남발 방어 — IP 당 분당 120회 (정상 에이전트는 작업 완료 시에만 호출).
  const rl = rateLimit({
    key: clientIp(req),
    limit: 120,
    windowMs: 60_000,
    namespace: 'push-notify',
  });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:noreply@acp.local';

  if (!supabaseUrl || !serviceKey || !jwtSecret || !vapidPublic || !vapidPrivate) {
    return err(500, 'server_misconfigured');
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!token) return err(401, 'missing_token');

  const payload = verifyAgentJwt(token, jwtSecret);
  if (!payload) return err(401, 'unauthorized');

  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return err(400, 'invalid_body');
  }

  const title = String(body.title ?? 'Agent Control Panel').slice(0, 120);
  const text = String(body.body ?? '').slice(0, 280);
  const variant = (body.variant ?? 'info') as NotifyBody['variant'];

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: subs, error: loadErr } = await admin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', payload.sub);
  if (loadErr) return err(500, 'lookup_failed');

  const filtered = ((subs as PushSubscriptionRow[] | null) ?? []).filter((s) => {
    if (variant === 'success') return s.notify_on_complete;
    if (variant === 'error') return s.notify_on_error;
    if (variant === 'warning') return s.notify_on_cancel;
    return true;
  });

  const notification = JSON.stringify({
    title,
    body: text,
    variant,
    tag: body.tag ?? `acp-${body.agentId ?? payload.agent_id}`,
    agentId: body.agentId ?? payload.agent_id,
    conversationId: body.conversationId,
    url: '/chat',
  });

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  await Promise.all(
    filtered.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          notification,
          { TTL: 60 * 60 * 24 }, // 24h
        );
        sent += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Gone — 만료된 구독, DB 에서 제거
          expiredEndpoints.push(s.endpoint);
        } else {
          failed += 1;
        }
      }
    }),
  );

  if (expiredEndpoints.length > 0) {
    await admin
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints);
  }

  // last_used_at 갱신 (성공한 구독만)
  if (sent > 0) {
    await admin
      .from('push_subscriptions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', payload.sub)
      .in(
        'endpoint',
        filtered.filter((s) => !expiredEndpoints.includes(s.endpoint)).map((s) => s.endpoint),
      );
  }

  return NextResponse.json({ sent, failed, expired: expiredEndpoints.length });
}
