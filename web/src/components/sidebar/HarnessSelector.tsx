'use client';

import { useCallback, useState } from 'react';
import { useHarnesses } from '@/lib/hooks/useHarnesses';
import { HarnessEditor } from './HarnessEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileCode, Plus, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
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
  const { harnesses, loading, updateHarness, refresh } = useHarnesses(agentId);
  const [adding, setAdding] = useState(false);
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleHarnessUpdated = useCallback(
    (updated: Harness) => {
      updateHarness(updated);
    },
    [updateHarness],
  );

  const handleAdd = useCallback(async () => {
    if (!agentId) return;
    const trimmedPath = path.trim();
    if (!trimmedPath) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      toast('로그인이 필요합니다', { variant: 'warning' });
      return;
    }
    const autoName =
      name.trim() ||
      trimmedPath.replace(/[/\\]+$/, '').split(/[/\\]/).filter(Boolean).pop() ||
      '하네스';

    const { data, error } = await supabase
      .from('harnesses')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        name: autoName.slice(0, 80),
        path: trimmedPath,
        description: '',
        content: null,
        score: 0,
        features: [],
        source: 'manual',
      })
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      toast(`추가 실패: ${error?.message ?? '알 수 없음'}`, { variant: 'error' });
      return;
    }
    setPath('');
    setName('');
    setAdding(false);
    refresh?.();
    onSelect(data.id);
    toast(`"${autoName}" 추가됨 — 다음 에이전트 재시작까지 수동 항목 유지`, {
      variant: 'success',
      duration: 6000,
    });
  }, [agentId, path, name, refresh, onSelect]);

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedId) return;
    const target = harnesses.find((h) => h.id === selectedId);
    if (!target) return;
    if (target.source !== 'manual') {
      toast('스캔으로 등록된 하네스는 직접 삭제할 수 없습니다', { variant: 'warning' });
      return;
    }
    if (!confirm(`"${target.name}" 를 삭제할까요?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('harnesses').delete().eq('id', target.id);
    if (error) {
      toast(`삭제 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    onSelect(null);
    refresh?.();
  }, [selectedId, harnesses, onSelect, refresh]);

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
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          하네스
        </p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          title="경로 직접 추가"
        >
          {adding ? (
            <>
              <X className="h-3 w-3" />
              닫기
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" />
              경로 추가
            </>
          )}
        </button>
      </div>

      {adding && (
        <div className="mb-2 space-y-1.5 rounded-md border bg-background p-2">
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="CLAUDE.md 경로 (예: C:\\Projects\\my-app\\CLAUDE.md)"
            className="h-7 text-xs font-mono"
            autoFocus
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="표시 이름 (선택 — 비우면 폴더명 사용)"
            className="h-7 text-xs"
          />
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => {
                setAdding(false);
                setPath('');
                setName('');
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={handleAdd}
              disabled={!path.trim() || saving}
            >
              {saving ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" />
              ) : (
                <Plus className="h-2.5 w-2.5 mr-0.5" />
              )}
              추가
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            경로는 에이전트 PC 기준 절대경로로 입력하세요. 에이전트 재기동해도 수동 항목은 유지됩니다.
          </p>
        </div>
      )}

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
              {h.source === 'manual' ? ' (수동)' : ''}
            </option>
          ))}
        </select>
        {selectedHarness && selectedHarness.source === 'manual' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose-400"
            onClick={handleDeleteSelected}
            title="이 수동 하네스 삭제"
            aria-label="이 수동 하네스 삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {selectedHarness && (
          <HarnessEditor harness={selectedHarness} onUpdated={handleHarnessUpdated} />
        )}
      </div>
      {selectedHarness && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground px-1">
          <FileCode className="h-3 w-3" />
          <span className="truncate">{selectedHarness.path}</span>
          {selectedHarness.source === 'manual' && (
            <span className="ml-auto shrink-0 rounded border border-border/60 bg-muted/50 px-1 py-[1px] text-[9px] uppercase tracking-wider">
              수동
            </span>
          )}
        </div>
      )}
    </div>
  );
}
