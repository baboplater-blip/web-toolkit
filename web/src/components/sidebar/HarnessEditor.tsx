'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import type { Harness } from '@/lib/supabase/types';
import { Pencil, FileCode, Save, Loader2 } from 'lucide-react';

interface HarnessEditorProps {
  harness: Harness;
  onUpdated: (updated: Harness) => void;
}

export function HarnessEditor({ harness, onUpdated }: HarnessEditorProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(harness.description);
  const [saving, setSaving] = useState(false);

  // 다이얼로그 열 때마다 최신 값으로 리셋
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(harness.description);
    }
  }, [open, harness.description]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('harnesses')
      .update({ description })
      .eq('id', harness.id)
      .select()
      .single();

    setSaving(false);

    if (!error && data) {
      onUpdated(data as Harness);
      setOpen(false);
    }
  }, [description, harness.id, onUpdated]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            className="p-0.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            title="하네스 편집"
          />
        }
      >
        <Pencil className="h-3 w-3" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>하네스 편집</DialogTitle>
          <DialogDescription>
            하네스 설명을 수정할 수 있습니다. CLAUDE.md 파일 자체는 Agent를 통해 편집하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">이름</label>
            <p className="text-sm font-medium mt-0.5">{harness.name}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileCode className="h-3 w-3" />
              경로
            </label>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">
              {harness.path}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">설명</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="하네스에 대한 설명을 입력하세요..."
              className="mt-1 min-h-[80px] text-sm"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" size="sm" />}
          >
            취소
          </DialogClose>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
