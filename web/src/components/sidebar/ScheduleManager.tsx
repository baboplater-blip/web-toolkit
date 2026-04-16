'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronRight,
  CalendarClock,
  Plus,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';

interface Schedule {
  id: string;
  agent_id: string;
  prompt: string;
  cron_expression: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
}

interface ScheduleManagerProps {
  agentId: string | null;
}

/** cron 프리셋 옵션 */
const CRON_PRESETS = [
  { label: '매시간', value: '0 * * * *' },
  { label: '매일 오전 9시', value: '0 9 * * *' },
  { label: '매일 오후 6시', value: '0 18 * * *' },
  { label: '매주 월요일 9시', value: '0 9 * * 1' },
  { label: '커스텀', value: 'custom' },
] as const;

/** cron 표현식을 사람이 읽을 수 있는 한국어로 변환 */
function describeCron(cron: string): string {
  const preset = CRON_PRESETS.find((p) => p.value === cron);
  if (preset && preset.value !== 'custom') return preset.label;

  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [min, hour, , , weekday] = parts;

  if (hour === '*' && min !== '*') {
    return `매시간 ${min}분`;
  }
  if (weekday !== '*' && hour !== '*') {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[parseInt(weekday)] ?? weekday;
    return `매주 ${dayName}요일 ${hour}:${min.padStart(2, '0')}`;
  }
  if (hour !== '*') {
    return `매일 ${hour}:${min.padStart(2, '0')}`;
  }

  return cron;
}

/** 다음 실행 시간을 계산 */
function calculateNextRun(cron: string): string {
  const [min, hour, , , weekday] = cron.split(' ');
  const now = new Date();
  const next = new Date();

  if (hour === '*' && min !== '*') {
    next.setMinutes(parseInt(min), 0, 0);
    if (next <= now) next.setHours(next.getHours() + 1);
  } else if (hour !== '*' && weekday === '*') {
    next.setHours(parseInt(hour), parseInt(min), 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (weekday !== '*') {
    const targetDay = parseInt(weekday);
    next.setHours(parseInt(hour), parseInt(min), 0, 0);
    while (next.getDay() !== targetDay || next <= now) {
      next.setDate(next.getDate() + 1);
    }
    next.setHours(parseInt(hour), parseInt(min), 0, 0);
  } else {
    next.setTime(now.getTime() + 60 * 60 * 1000);
  }

  return next.toISOString();
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
    fetchSchedules();
    setExpanded(false);
    setAdding(false);
  }, [fetchSchedules]);

  const handleAdd = async () => {
    if (!agentId || !newPrompt.trim()) return;

    const cronValue = selectedPreset === 'custom' ? customCron.trim() : selectedPreset;
    if (!cronValue) return;

    // cron 형식 기본 검증 (5개 필드)
    if (cronValue.split(' ').length !== 5) return;

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
    } as never);

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
                <Input
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="분 시 일 월 요일 (예: 30 9 * * *)"
                  className="text-xs h-7"
                />
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
                  disabled={!newPrompt.trim() || saving || (selectedPreset === 'custom' && !customCron.trim())}
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
