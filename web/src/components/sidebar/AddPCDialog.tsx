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
import { Plus, Copy, Check, Loader2, Terminal } from 'lucide-react';

export function AddPCDialog() {
  const [open, setOpen] = useState(false);
  const [pcName, setPcName] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    apiKey: string;
    token: string;
    installCmd: string;
  } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const resetState = useCallback(() => {
    setPcName('');
    setSaving(false);
    setResult(null);
    setCopiedCmd(false);
    setCopiedKey(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) resetState();
    },
    [resetState]
  );

  const handleRegister = useCallback(async () => {
    const trimmedName = pcName.trim();
    if (!trimmedName) return;

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const apiKey = `acp_${crypto.randomUUID().replace(/-/g, '')}`;
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    // 1. install_tokens에 토큰 저장
    await supabase.from('install_tokens').insert({
      token,
      pc_name: trimmedName,
      api_key: apiKey,
      user_id: user.id,
    });

    // 2. agents에 PC 등록
    const { data, error } = await supabase
      .from('agents')
      .insert({ name: trimmedName, api_key: apiKey, user_id: user.id })
      .select('id')
      .single();

    setSaving(false);

    if (!error && data) {
      const baseUrl = window.location.origin;
      const installCmd = `irm ${baseUrl}/api/install/${token} | iex`;

      setResult({ id: data.id, apiKey, token, installCmd });
    }
  }, [pcName]);

  const handleCopyCmd = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.installCmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch {}
  }, [result]);

  const handleCopyKey = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {}
  }, [result]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          />
        }
      >
        <Plus className="h-4 w-4 mr-2" />
        PC 추가
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>PC 원격 등록</DialogTitle>
          <DialogDescription>
            새 PC를 등록하면 설치 명령어가 생성됩니다.
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
                placeholder="예: 거실PC, 사무실PC..."
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pcName.trim()) handleRegister();
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
            <div className="space-y-4">
              {/* 성공 메시지 */}
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  등록 완료! 아래 명령어를 대상 PC에서 실행하세요.
                </p>
              </div>

              {/* 원라인 설치 명령어 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="text-xs font-medium text-muted-foreground">
                    PowerShell에 붙여넣기 (원클릭 설치)
                  </label>
                </div>
                <div className="flex gap-2">
                  <code className="flex-1 rounded-md border bg-zinc-900 text-emerald-400 px-3 py-2.5 text-xs font-mono break-all select-all">
                    {result.installCmd}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCmd}
                    title="명령어 복사"
                    className="shrink-0"
                  >
                    {copiedCmd ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* 순서 안내 */}
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="text-xs font-medium">설치 순서:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>대상 PC에서 <strong>PowerShell</strong>을 관리자 권한으로 실행</li>
                  <li>위 명령어를 <strong>복사 → 붙여넣기</strong></li>
                  <li>Node.js 없으면 자동 설치, Agent 파일 다운로드, 자동 시작</li>
                </ol>
                <p className="text-[10px] text-muted-foreground mt-2">
                  * 명령어는 24시간 유효, 1회만 사용 가능
                </p>
              </div>

              {/* API 키 (수동 설치용 접기) */}
              <details className="text-xs">
                <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                  수동 설치용 API 키 보기
                </summary>
                <div className="flex gap-2 mt-2">
                  <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-xs font-mono break-all select-all">
                    {result.apiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyKey}
                    className="shrink-0 h-8 w-8"
                  >
                    {copiedKey ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </details>
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                확인
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
