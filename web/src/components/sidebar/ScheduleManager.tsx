'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronDown,
  ChevronRight,
  CalendarClock,
  Plus,
  Trash2,
  X,
  Loader2,
  Play,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

import type { Schedule } from '@/lib/supabase/types';
import {
  describeCron as describeCronShared,
  isValidCron,
  nextCronRun,
} from '@/lib/cron-parser';

interface ScheduleManagerProps {
  agentId: string | null;
}

/** cron 프리셋 옵션 */
const CRON_PRESETS = [
  { label: '5분마다', value: '*/5 * * * *' },
  { label: '15분마다', value: '*/15 * * * *' },
  { label: '매시간', value: '0 * * * *' },
  { label: '매일 오전 9시', value: '0 9 * * *' },
  { label: '매일 오후 6시', value: '0 18 * * *' },
  { label: '평일 오전 9시', value: '0 9 * * 1-5' },
  { label: '매주 월요일 9시', value: '0 9 * * 1' },
  { label: '매주 금요일 6시', value: '0 18 * * 5' },
  { label: '매월 1일 자정', value: '0 0 1 * *' },
  { label: '커스텀', value: 'custom' },
] as const;

/** cron 표현식 도움말 예시 */
const CRON_HELP_EXAMPLES: { cron: string; desc: string }[] = [
  { cron: '*/10 * * * *', desc: '10분마다' },
  { cron: '0 9,18 * * *', desc: '매일 9시·18시' },
  { cron: '30 9 * * 1-5', desc: '평일 9:30' },
  { cron: '0 */3 * * *', desc: '3시간마다 정각' },
  { cron: '0 9 1,15 * *', desc: '매월 1·15일 9시' },
];

/** cron 표현식을 사람이 읽을 수 있는 한국어로 변환 */
function describeCron(cron: string): string {
  const preset = CRON_PRESETS.find((p) => p.value === cron);
  if (preset && preset.value !== 'custom') return preset.label;
  return describeCronShared(cron);
}

/** 다음 실행 시간을 계산 (표준 5필드 cron 지원). 실패 시 빈 문자열. */
function calculateNextRun(cron: string): string {
  try {
    return nextCronRun(cron).toISOString();
  } catch {
    return '';
  }
}

export function ScheduleManager({ agentId }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // 새 스케줄 폼
  const [newPrompt, setNewPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>(CRON_PRESETS[0].value);
  const [customCron, setCustomCron] = useState('');

  const supabaseRef = useRef(createClient());

  const fetchSchedules = useCallback(async () => {
    if (!agentId) {
      setSchedules([]);
      return;
    }
    const { data } = await supabaseRef.current
      .from('schedules')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    if (data) setSchedules(data as Schedule[]);
  }, [agentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchedules();
    setExpanded(false);
    setAdding(false);
  }, [fetchSchedules]);

  const handleAdd = async () => {
    if (!agentId || !newPrompt.trim()) return;

    const cronValue = selectedPreset === 'custom' ? customCron.trim() : selectedPreset;
    if (!cronValue) return;
    if (!isValidCron(cronValue)) return;

    setSaving(true);

    const { data: { user } } = await supabaseRef.current.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabaseRef.current.from('schedules').insert({
      agent_id: agentId,
      prompt: newPrompt.trim(),
      cron_expression: cronValue,
      enabled: true,
      next_run: calculateNextRun(cronValue),
      user_id: user.id,
    });

    setSaving(false);

    if (!error) {
      setNewPrompt('');
      setSelectedPreset(CRON_PRESETS[0].value);
      setCustomCron('');
      setAdding(false);
      fetchSchedules();
    }
  };

  const handleToggle = async (scheduleId: string, enabled: boolean) => {
    const updates: Record<string, unknown> = { enabled };
    // 활성화 시 next_run 재계산
    if (enabled) {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (schedule) {
        updates.next_run = calculateNextRun(schedule.cron_expression);
      }
    }

    await supabaseRef.current
      .from('schedules')
      .update(updates)
      .eq('id', scheduleId);
    fetchSchedules();
  };

  const handleDelete = async (scheduleId: string) => {
    await supabaseRef.current.from('schedules').delete().eq('id', scheduleId);
    fetchSchedules();
  };

  /** 스케줄을 지금 1회 즉시 실행 — 새 대화를 만들고 해당 prompt 를 user 메시지로 insert */
  const handleRunNow = async (scheduleId: string) => {
    if (!agentId) return;
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast('로그인이 필요합니다', { variant: 'warning' });
      return;
    }

    const title = `[수동 실행] ${schedule.prompt.replace(/\s+/g, ' ').slice(0, 40)}`;
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ agent_id: agentId, user_id: user.id, title })
      .select('id')
      .single();
    if (convErr || !conv) {
      toast(`대화 생성 실패: ${convErr?.message ?? '알 수 없음'}`, { variant: 'error' });
      return;
    }

    const { error } = await supabase.from('messages').insert({
      agent_id: agentId,
      user_id: user.id,
      conversation_id: conv.id,
      role: 'user',
      content: schedule.prompt,
      status: 'completed',
    });
    if (error) {
      toast(`메시지 전송 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    toast('지금 한 번 실행했습니다 — 새 대화로 확인하세요', {
      variant: 'success',
      duration: 6000,
    });
  };

  const handleCancelAdd = () => {
    setAdding(false);
    setNewPrompt('');
    setSelectedPreset(CRON_PRESETS[0].value);
    setCustomCron('');
  };

  if (!agentId) return null;

  return (
    <div className="border-t px-3 py-2">
      <div className="flex items-center gap-1.5 w-full">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <CalendarClock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            예약
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto mr-1">
            {schedules.length}
          </span>
        </button>
        {expanded && (
          <button
            onClick={() => setAdding(true)}
            className="p-0.5 rounded hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
            title="예약 추가"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-1.5 space-y-1.5">
          {/* 새 스케줄 추가 폼 */}
          {adding && (
            <div className="rounded border bg-background p-2 space-y-2">
              <Textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="실행할 프롬프트..."
                className="text-xs min-h-[60px] resize-none"
                autoFocus
              />
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              >
                {CRON_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              {selectedPreset === 'custom' && (
                <div className="space-y-1">
                  <Input
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="분 시 일 월 요일 (예: 30 9 * * 1-5)"
                    className="text-xs h-7 font-mono"
                  />
                  {customCron.trim() && (
                    <p
                      className={
                        isValidCron(customCron.trim())
                          ? 'text-[10px] text-emerald-400'
                          : 'text-[10px] text-rose-400'
                      }
                    >
                      {isValidCron(customCron.trim())
                        ? describeCronShared(customCron.trim())
                        : 'cron 형식이 올바르지 않습니다'}
                    </p>
                  )}
                  <details className="text-[10px] text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      cron 문법 예시
                    </summary>
                    <ul className="mt-1 space-y-0.5 pl-3">
                      <li>• <code className="font-mono">*</code> 모든 값</li>
                      <li>• <code className="font-mono">a,b,c</code> 목록 (예: <code>0,30</code> — 0분·30분)</li>
                      <li>• <code className="font-mono">a-b</code> 범위 (예: <code>1-5</code> — 월~금)</li>
                      <li>• <code className="font-mono">*/N</code> 주기 (예: <code>*/10</code> — 10분마다)</li>
                    </ul>
                    <p className="mt-1.5 text-[10px]">자주 쓰이는 예:</p>
                    <ul className="mt-0.5 pl-3 space-y-0.5">
                      {CRON_HELP_EXAMPLES.map((ex) => (
                        <li key={ex.cron} className="flex gap-2">
                          <code className="font-mono text-foreground">{ex.cron}</code>
                          <span>→ {ex.desc}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={handleCancelAdd}
                >
                  <X className="h-2.5 w-2.5 mr-0.5" />
                  취소
                </Button>
                <Button
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={handleAdd}
                  disabled={
                    !newPrompt.trim() ||
                    saving ||
                    (selectedPreset === 'custom' && (!customCron.trim() || !isValidCron(customCron.trim())))
                  }
                >
                  {saving ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" />
                  ) : (
                    <Plus className="h-2.5 w-2.5 mr-0.5" />
                  )}
                  추가
                </Button>
              </div>
            </div>
          )}

          {/* 스케줄 목록 */}
          {schedules.length === 0 && !adding ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              예약 없음
            </p>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-start gap-1.5 rounded border bg-background p-1.5 text-[10px]"
              >
                <button
                  onClick={() => handleToggle(schedule.id, !schedule.enabled)}
                  className={`mt-0.5 h-3 w-6 rounded-full relative transition-colors shrink-0 ${
                    schedule.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  title={schedule.enabled ? '비활성화' : '활성화'}
                >
                  <span
                    className={`absolute top-0.5 h-2 w-2 rounded-full bg-white transition-transform ${
                      schedule.enabled ? 'left-3.5' : 'left-0.5'
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-foreground">
                    {schedule.prompt.substring(0, 30)}
                    {schedule.prompt.length > 30 ? '...' : ''}
                  </p>
                  <p className="text-muted-foreground">
                    {describeCron(schedule.cron_expression)}
                  </p>
                </div>
                <button
                  onClick={() => handleRunNow(schedule.id)}
                  className="p-0.5 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors shrink-0"
                  title="지금 한 번 실행"
                  aria-label="지금 한 번 실행"
                >
                  <Play className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-0.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  title="삭제"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
