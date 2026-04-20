'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Harness } from '@/lib/supabase/types';

export function useHarnesses(agentId: string | null) {
  const [harnesses, setHarnesses] = useState<Harness[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchHarnesses = useCallback(async () => {
    if (!agentId) {
      setHarnesses((prev) => (prev.length === 0 ? prev : []));
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('harnesses')
      .select('*')
      .eq('agent_id', agentId)
      .order('name');
    if (error) {
      console.error('[useHarnesses] 쿼리 실패:', error.message);
    }
    if (data) setHarnesses(data as Harness[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    fetchHarnesses();
  }, [fetchHarnesses]);

  /** 로컬 상태에서 하네스를 업데이트 (편집 후 리프레시 없이 반영) */
  const updateHarness = useCallback((updated: Harness) => {
    setHarnesses((prev) =>
      prev.map((h) => (h.id === updated.id ? updated : h)),
    );
  }, []);

  return { harnesses, loading, updateHarness, refresh: fetchHarnesses };
}
