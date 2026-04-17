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
} from 'lucide-react';

interface WebhookSettingProps {
  agentId: string | null;
}

export function WebhookSetting({ agentId }: WebhookSettingProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
          </div>
        </div>
      )}
    </div>
  );
}
