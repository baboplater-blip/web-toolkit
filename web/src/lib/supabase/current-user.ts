import { createClient } from './client';

/**
 * 현재 로그인된 사용자 ID를 반환한다. 없으면 null.
 * INSERT 시 user_id 주입이 필요할 때 사용.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
