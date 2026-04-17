import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, name, user_id, status')
    .order('name');

  return NextResponse.json({
    auth: {
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      error: authError?.message ?? null,
    },
    agents: {
      count: agents?.length ?? 0,
      data: agents ?? [],
      error: agentsError?.message ?? null,
    },
  });
}
