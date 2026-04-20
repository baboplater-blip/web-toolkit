import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/claim-legacy
 *
 * 레거시 공유 계정(admin@acp.local) 에 귀속된 모든 데이터를 현재 로그인 사용자의 user_id 로 이관한다.
 * 초기 단일 사용자 모드에서 각자 자기 계정으로 전환할 때 1회용.
 *
 * 인증: Bearer <Supabase auth token>
 * 응답: { movedAgents, movedConversations, movedMessages, movedHarnesses, movedSchedules, movedLogs, movedTemplates }
 *
 * 안전장치:
 *   - admin@acp.local 계정 자체는 건드리지 않는다 (계정 삭제는 사용자가 별도로 진행).
 *   - 현재 사용자의 이메일이 admin@acp.local 이면 no-op (자기 자신).
 *   - user_profiles.role 이 'admin' 인 사용자만 실행 가능 (남이 임의로 훔쳐가지 못하게).
 */

export const runtime = 'nodejs';

const LEGACY_EMAIL = 'admin@acp.local';

function err(status: number, code: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: code, ...extra }, { status });
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

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return err(401, 'unauthorized');

  const me = userData.user;
  if (me.email === LEGACY_EMAIL) {
    return err(400, 'cannot_claim_self');
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 내 프로필의 role 이 admin 인지 확인 — 악의적 claim 방지.
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('id', me.id)
    .maybeSingle();
  if (!profile || profile.role !== 'admin') {
    return err(403, 'not_admin', {
      hint: 'user_profiles.role 이 admin 인 사용자만 이관할 수 있습니다.',
    });
  }

  // legacy 계정의 user_id 조회
  const { data: legacyUsers, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) return err(500, 'list_failed');
  const legacy = legacyUsers.users.find((u) => u.email === LEGACY_EMAIL);
  if (!legacy) {
    return NextResponse.json({
      moved: {
        agents: 0,
        conversations: 0,
        messages: 0,
        harnesses: 0,
        schedules: 0,
        agent_logs: 0,
        templates: 0,
      },
      note: 'legacy 계정이 존재하지 않습니다.',
    });
  }
  if (legacy.id === me.id) {
    return err(400, 'legacy_is_me');
  }

  const fromId = legacy.id;
  const toId = me.id;

  // 각 테이블에서 user_id 를 새 사용자로 업데이트
  async function moveTable(table: string) {
    const { count, error } = await admin
      .from(table)
      .update({ user_id: toId }, { count: 'exact' })
      .eq('user_id', fromId);
    if (error) throw new Error(`${table}: ${error.message}`);
    return count ?? 0;
  }

  try {
    const agents = await moveTable('agents');
    const conversations = await moveTable('conversations');
    const messages = await moveTable('messages');
    const harnesses = await moveTable('harnesses');
    const schedules = await moveTable('schedules');
    const agent_logs = await moveTable('agent_logs');
    const templates = await moveTable('templates');

    return NextResponse.json({
      moved: {
        agents,
        conversations,
        messages,
        harnesses,
        schedules,
        agent_logs,
        templates,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return err(500, 'move_failed', { detail: msg });
  }
}
