'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronDown,
  ChevronRight,
  Webhook,
  Save,
  Loader2,
  Check,
  Send,
  CircleCheck,
  CircleX,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface WebhookSettingProps {
  agentId: string | null;
}

export function WebhookSetting({ agentId }: WebhookSettingProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    | { ok: boolean; status: number; latency_ms: number; error?: string }
    | null
  >(null);

  const supabaseRef = useRef(createClient());

  const fetchWebhook = useCallback(async () => {
    if (!agentId) {
      setWebhookUrl('');
      setSavedUrl('');
      return;
    }

    const { data } = await supabaseRef.current
      .from('agents')
      .select('webhook_url')
      .eq('id', agentId)
      .single();

    const urlStr = data?.webhook_url ?? '';
    setWebhookUrl(urlStr);
    setSavedUrl(urlStr);
  }, [agentId]);

  useEffect(() => {
    fetchWebhook();
    setExpanded(false);
  }, [fetchWebhook]);

  const handleSave = async () => {
    if (!agentId) return;

    setSaving(true);

    await supabaseRef.current
      .from('agents')
      .update({ webhook_url: webhookUrl.trim() || null })
      .eq('id', agentId);

    setSaving(false);
    setSaved(true);
    setSavedUrl(webhookUrl.trim());
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges = webhookUrl.trim() !== savedUrl;

  const handleTest = async () => {
    if (!agentId) return;
    const url = webhookUrl.trim();
    if (!url) {
      toast('먼저 웹훅 URL 을 입력·저장하세요', { variant: 'warning' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const { data: sessionData } = await supabaseRef.current.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast('로그인이 만료되었습니다', { variant: 'warning' });
        return;
      }
      const res = await fetch('/api/webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ agent_id: agentId, url: hasChanges ? url : undefined }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        status?: number;
        latency_ms?: number;
        error?: string;
        details?: string;
      };
      if (!res.ok) {
        const reason = data.details ?? data.error ?? `HTTP ${res.status}`;
        setTestResult({ ok: false, status: res.status, latency_ms: 0, error: reason });
        toast(`테스트 실패: ${reason}`, { variant: 'error' });
        return;
      }
      const result = {
        ok: Boolean(data.ok),
        status: Number(data.status ?? 0),
        latency_ms: Number(data.latency_ms ?? 0),
        error: data.error,
      };
      setTestResult(result);
      if (result.ok) {
        toast(`웹훅 OK (${result.status}, ${result.latency_ms}ms)`, { variant: 'success' });
      } else {
        toast(`웹훅 응답 실패: ${result.error ?? `HTTP ${result.status}`}`, { variant: 'error' });
      }
    } finally {
      setTesting(false);
    }
  };

  if (!agentId) return null;

  return (
    <div className="border-t px-3 py-2">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 w-full text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <Webhook className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          웹훅
        </span>
        {savedUrl && (
          <span className="text-[10px] text-green-500 ml-auto">설정됨</span>
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1.5">
          <p className="text-[10px] text-muted-foreground">
            작업 완료 시 알림을 받을 URL (Discord/Telegram 웹훅)
          </p>
          <div className="flex gap-1">
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="text-xs h-7 flex-1"
            />
            <Button
              size="sm"
              className="h-7 px-2 shrink-0"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saved ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Save className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 shrink-0"
              onClick={handleTest}
              disabled={testing || !webhookUrl.trim()}
              title="지금 한 번 발송해보기"
            >
              {testing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>
          {testResult && (
            <div
              className={
                testResult.ok
                  ? 'flex items-center gap-1 text-[10px] text-green-500'
                  : 'flex items-center gap-1 text-[10px] text-rose-400'
              }
            >
              {testResult.ok ? (
                <CircleCheck className="h-3 w-3" />
              ) : (
                <CircleX className="h-3 w-3" />
              )}
              <span>
                {testResult.ok
                  ? `OK · HTTP ${testResult.status} · ${testResult.latency_ms}ms`
                  : testResult.error ?? `HTTP ${testResult.status}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
