'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Harness } from '@/lib/supabase/types';

export function useHarnesses(agentId: string | null) {
  const [harnesses, setHarnesses] = useState<Harness[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!agentId) {
      setHarnesses([]);
      return;
    }

    setLoading(true);

    async function fetchHarnesses() {
      const { data } = await supabase
        .from('harnesses')
        .select('*')
        .eq('agent_id', agentId!)
        .order('name');
      if (data) setHarnesses(data as Harness[]);
      setLoading(false);
    }

    fetchHarnesses();
  }, [agentId]);

  return { harnesses, loading };
}
