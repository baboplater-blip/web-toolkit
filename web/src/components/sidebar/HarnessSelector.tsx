'use client';

import { useHarnesses } from '@/lib/hooks/useHarnesses';
import { Loader2, FileCode } from 'lucide-react';

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
  const { harnesses, loading } = useHarnesses(agentId);

  if (!agentId) return null;

  if (loading) {
    return (
      <div className="px-3 py-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-t">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">
        하네스
      </p>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm"
      >
        <option value="">선택 안 함</option>
        {harnesses.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      {selectedId && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground px-1">
          <FileCode className="h-3 w-3" />
          {harnesses.find((h) => h.id === selectedId)?.path}
        </div>
      )}
    </div>
  );
}
