'use client';

import { useCallback } from 'react';
import { useHarnesses } from '@/lib/hooks/useHarnesses';
import { HarnessEditor } from './HarnessEditor';
import { Loader2, FileCode } from 'lucide-react';
import type { Harness } from '@/lib/supabase/types';

interface HarnessSelectorProps {
  agentId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function HarnessSelector({
  agentId,
  selectedId,
  onSelect,
}: HarnessSelectorProps) {
  const { harnesses, loading, updateHarness } = useHarnesses(agentId);

  const handleHarnessUpdated = useCallback(
    (updated: Harness) => {
      updateHarness(updated);
    },
    [updateHarness]
  );

  if (!agentId) return null;

  if (loading) {
    return (
      <div className="px-3 py-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedHarness = harnesses.find((h) => h.id === selectedId);

  return (
    <div className="px-3 py-2 border-t">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">
        하네스
      </p>
      <div className="flex items-center gap-1.5">
        <select
          value={selectedId ?? ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm min-w-0"
        >
          <option value="">선택 안 함</option>
          {harnesses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        {selectedHarness && (
          <HarnessEditor
            harness={selectedHarness}
            onUpdated={handleHarnessUpdated}
          />
        )}
      </div>
      {selectedHarness && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground px-1">
          <FileCode className="h-3 w-3" />
          <span className="truncate">{selectedHarness.path}</span>
        </div>
      )}
    </div>
  );
}
