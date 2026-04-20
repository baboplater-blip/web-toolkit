'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * 사용자의 모든 PC 에서 현재 진행 중 (streaming/processing) 메시지 개수를 실시간 추적.
 * 채팅 탭 상단 배너용.
 */
export function useActiveTaskCount(): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function fetchCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { count: c } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['streaming', 'processing']);
      if (!cancelled) setCount(c ?? 0);
    }

    fetchCount();
    const interval = setInterval(fetchCount, 10_000);

    // Realtime: messages 변경 시 바로 재조회
    const ch = supabase
      .channel(`active-tasks-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchCount(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, []);

  return count;
}
