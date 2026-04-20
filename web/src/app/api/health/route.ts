import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * 가벼운 상태 점검. DB 왕복 + 환경변수 유무를 체크해 "deployment alive" 지표로 쓴다.
 * 외부 모니터링/uptime robot 에서 주기적으로 찌를 수 있는 공개 엔드포인트.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const checks: Record<string, { ok: boolean; detail?: string }> = {
    env: {
      ok: Boolean(supabaseUrl && anonKey),
      detail: !supabaseUrl
        ? 'NEXT_PUBLIC_SUPABASE_URL missing'
        : !anonKey
        ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY missing'
        : undefined,
    },
    db: { ok: false },
  };

  if (checks.env.ok && supabaseUrl && anonKey) {
    try {
      const client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const start = Date.now();
      // RLS 때문에 실제 행이 없어도 count 는 0 으로 응답하면 성공.
      const { error } = await client
        .from('agents')
        .select('id', { count: 'exact', head: true });
      const ms = Date.now() - start;
      checks.db = { ok: !error, detail: error ? error.message : `${ms}ms` };
    } catch (e) {
      checks.db = {
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      };
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    {
      ok: allOk,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      deployed_at: process.env.VERCEL_DEPLOYMENT_TIME ?? null,
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
