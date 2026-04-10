'use client';

import { useState, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Plus, Copy, Check, Loader2 } from 'lucide-react';

export function AddPCDialog() {
  const [open, setOpen] = useState(false);
  const [pcName, setPcName] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ id: string; apiKey: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const resetState = useCallback(() => {
    setPcName('');
    setSaving(false);
    setResult(null);
    setCopied(false);
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  }, [resetState]);

  const handleRegister = useCallback(async () => {
    const trimmedName = pcName.trim();
    if (!trimmedName) return;

    setSaving(true);
    const supabase = createClient();
    const apiKey = `acp_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data, error } = await supabase
      .from('agents')
      .insert({
        name: trimmedName,
        api_key: apiKey,
      })
      .select('id')
      .single();

    setSaving(false);

    if (!error && data) {
      setResult({ id: data.id, apiKey });
    }
  }, [pcName]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 미지원 시 무시
    }
  }, [result]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" />
        }
      >
        <Plus className="h-4 w-4 mr-2" />
        PC 추가
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>PC 원격 등록</DialogTitle>
          <DialogDescription>
            새 PC를 등록하면 API 키가 생성됩니다. 해당 PC의 agent .env에 키를 설정하면 연결됩니다.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                PC 이름
              </label>
              <Input
                value={pcName}
                onChange={(e) => setPcName(e.target.value)}
                placeholder="예: 거실 PC, 사무실 데스크탑..."
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pcName.trim()) {
                    handleRegister();
                  }
                }}
                autoFocus
              />
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" size="sm" />}>
                취소
              </DialogClose>
              <Button
                size="sm"
                onClick={handleRegister}
                disabled={!pcName.trim() || saving}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1" />
                )}
                등록
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  PC가 성공적으로 등록되었습니다!
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  API 키
                </label>
                <div className="flex gap-2 mt-1">
                  <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-xs font-mono break-all select-all">
                    {result.apiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    title="복사"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  해당 PC의 agent <code className="font-mono">.env</code> 파일에 아래 내용을 추가하세요:
                </p>
                <code className="block mt-1.5 text-xs font-mono text-foreground">
                  AGENT_API_KEY={result.apiKey}
                </code>
              </div>
            </div>

            <DialogFooter>
              <Button
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                확인
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
