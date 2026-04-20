'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, Mail, KeyRound, AlertCircle, ArrowRightLeft, Download, Smartphone, Share, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import {
  detectPlatform,
  getDeferredInstallPrompt,
  isStandalone,
  subscribeInstallPrompt,
  triggerInstallPrompt,
  type InstallPlatform,
} from '@/lib/install-prompt';
import { getStoredTheme, setTheme, type ThemeMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function AccountTab() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [claiming, setClaiming] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [installPlatform, setInstallPlatform] = useState<InstallPlatform>('other');
  const [installReady, setInstallReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? '');
    })();
  }, [supabase]);

  useEffect(() => {
    setInstallPlatform(detectPlatform());
    setInstalled(isStandalone());
    setInstallReady(Boolean(getDeferredInstallPrompt()));
    setThemeState(getStoredTheme());
    return subscribeInstallPrompt((ev) => {
      setInstallReady(Boolean(ev));
      if (!ev) setInstalled(isStandalone());
    });
  }, []);

  const applyThemeChoice = (mode: ThemeMode) => {
    setThemeState(mode);
    setTheme(mode);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail === email) return;
    setEmailSaving(true);
    setEmailMsg(null);

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);

    if (error) {
      setEmailMsg({ kind: 'err', text: error.message });
      return;
    }
    setEmailMsg({
      kind: 'ok',
      text: `${newEmail.trim()} 로 확인 메일을 보냈습니다. 메일 링크를 클릭해야 이메일이 변경됩니다.`,
    });
    setNewEmail('');
  };

  const validatePw = (): string | null => {
    if (newPassword.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
      return '영문과 숫자를 모두 포함해주세요.';
    if (newPassword !== newPasswordConfirm) return '새 비밀번호가 일치하지 않습니다.';
    if (newPassword === currentPassword) return '새 비밀번호가 기존과 동일합니다.';
    return null;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePw();
    if (err) {
      setPwMsg({ kind: 'err', text: err });
      return;
    }
    if (!email) return;

    setPwSaving(true);
    setPwMsg(null);

    // 1) 현재 비밀번호 재인증
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthErr) {
      setPwSaving(false);
      setPwMsg({ kind: 'err', text: '현재 비밀번호가 틀렸습니다.' });
      return;
    }

    // 2) 새 비밀번호로 갱신
    const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);

    if (updErr) {
      setPwMsg({ kind: 'err', text: updErr.message });
      return;
    }
    setPwMsg({ kind: 'ok', text: '비밀번호가 변경되었습니다.' });
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
  };

  return (
    <div className="space-y-4">
      {/* 현재 계정 */}
      <section className="rounded-xl border bg-card p-4 space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          현재 로그인 계정
        </p>
        <p className="text-sm font-mono break-all">{email || '—'}</p>
      </section>

      {/* 앱 설치 (PWA) */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">앱 설치 (홈 화면에 추가)</h3>
        </div>
        {installed ? (
          <p className="flex items-start gap-1.5 text-xs text-emerald-400">
            <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>이미 앱으로 실행 중입니다. 푸시 알림도 받을 수 있어요.</span>
          </p>
        ) : installPlatform === 'ios' ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            iOS Safari 에서는 수동 설치만 지원됩니다. 하단{' '}
            <Share className="inline h-3 w-3 align-[-2px]" /> 공유 버튼 →{' '}
            <span className="font-medium">홈 화면에 추가</span> 를 선택하세요.
          </p>
        ) : installPlatform === 'android' ? (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed">
              홈 화면에 추가하면 앱처럼 실행되고 푸시 알림도 받을 수 있어요.
              {!installReady && ' 브라우저가 아직 설치 조건을 확인 중입니다. 몇 초 후 다시 시도해주세요.'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!installReady || installing}
              onClick={async () => {
                setInstalling(true);
                const outcome = await triggerInstallPrompt();
                setInstalling(false);
                if (outcome === 'accepted') {
                  toast('홈 화면에 추가되었습니다', { variant: 'success' });
                  setInstallReady(false);
                } else if (outcome === 'unavailable') {
                  toast('설치 이벤트를 받지 못했습니다. 브라우저 메뉴의 "앱 설치"를 사용해주세요.', {
                    variant: 'warning',
                    duration: 6000,
                  });
                }
              }}
            >
              {installing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              홈 화면에 추가
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            데스크탑 브라우저에서는 주소창 오른쪽의 <span className="font-medium">설치</span>{' '}
            아이콘 또는 브라우저 메뉴의{' '}
            <span className="font-medium">&ldquo;앱 설치&rdquo;</span> 를 사용해 설치할 수 있어요.
          </p>
        )}
      </section>

      {/* 테마 */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">테마</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'dark', label: '다크', icon: Moon },
            { key: 'light', label: '라이트', icon: Sun },
            { key: 'system', label: '시스템', icon: Monitor },
          ] as const).map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => applyThemeChoice(opt.key)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          선택한 테마는 이 브라우저에만 저장됩니다. &ldquo;시스템&rdquo; 은 OS 다크/라이트 설정을
          따라갑니다.
        </p>
      </section>

      {/* 이메일 변경 */}
      <form onSubmit={handleEmailChange} className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">이메일 변경</h3>
        </div>
        <Input
          type="email"
          placeholder="새 이메일"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          autoComplete="email"
        />
        {emailMsg && (
          <p
            className={`flex items-start gap-1.5 text-xs ${
              emailMsg.kind === 'ok' ? 'text-emerald-400' : 'text-destructive'
            }`}
          >
            {emailMsg.kind === 'ok' ? (
              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            )}
            <span>{emailMsg.text}</span>
          </p>
        )}
        <Button
          type="submit"
          disabled={!newEmail.trim() || newEmail === email || emailSaving}
          className="w-full"
        >
          {emailSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          확인 메일 보내기
        </Button>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          변경 후 새 이메일로 전송되는 확인 링크를 클릭해야 적용됩니다.
        </p>
      </form>

      {/* 전체 데이터 백업 */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">전체 데이터 백업</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          내 PC·대화·메시지·하네스·스케줄·템플릿·공유 토큰을 하나의 JSON 파일로 내려받습니다.
          대용량 대화가 있으면 파일이 수십 MB 까지 커질 수 있으니 Wi-Fi 환경을 권장합니다.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              const [agents, conversations, messages, harnesses, schedules, templates, shares] =
                await Promise.all([
                  supabase.from('agents').select('*'),
                  supabase.from('conversations').select('*'),
                  supabase
                    .from('messages')
                    .select('*')
                    .order('created_at', { ascending: true })
                    .limit(50_000),
                  supabase.from('harnesses').select('*'),
                  supabase.from('schedules').select('*'),
                  supabase.from('templates').select('*'),
                  supabase.from('conversation_share_tokens').select('*'),
                ]);
              const payload = {
                exported_at: new Date().toISOString(),
                email,
                counts: {
                  agents: agents.data?.length ?? 0,
                  conversations: conversations.data?.length ?? 0,
                  messages: messages.data?.length ?? 0,
                  harnesses: harnesses.data?.length ?? 0,
                  schedules: schedules.data?.length ?? 0,
                  templates: templates.data?.length ?? 0,
                  share_tokens: shares.data?.length ?? 0,
                },
                agents: agents.data ?? [],
                conversations: conversations.data ?? [],
                messages: messages.data ?? [],
                harnesses: harnesses.data ?? [],
                schedules: schedules.data ?? [],
                templates: templates.data ?? [],
                share_tokens: shares.data ?? [],
              };
              const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: 'application/json;charset=utf-8',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
              a.download = `acp-backup-${stamp}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              toast(
                `백업 완료 — 대화 ${payload.counts.conversations} · 메시지 ${payload.counts.messages.toLocaleString('ko-KR')}건`,
                { variant: 'success', duration: 6000 },
              );
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              toast(`백업 실패: ${msg}`, { variant: 'error' });
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          JSON 파일로 내려받기
        </Button>
      </section>

      {/* 레거시 데이터 이관 */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">레거시 데이터 이관</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          초기 공유 계정(admin@acp.local)에 귀속돼 있던 PC·대화·하네스·스케줄·템플릿을
          지금 로그인한 계정 소유로 가져옵니다. 관리자(role=admin) 계정에서만 동작합니다.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={claiming}
          onClick={async () => {
            if (!confirm('레거시 공유 계정의 데이터를 현재 계정으로 이관할까요?')) return;
            setClaiming(true);
            try {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              if (!session?.access_token) {
                toast('로그인 세션을 확인할 수 없습니다.', { variant: 'error' });
                return;
              }
              const res = await fetch('/api/admin/claim-legacy', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });
              const body = await res.json();
              if (!res.ok) {
                toast(`이관 실패: ${body.error ?? res.status}`, { variant: 'error' });
                return;
              }
              const moved = body.moved ?? {};
              const summary = [
                `PC ${moved.agents ?? 0}`,
                `대화 ${moved.conversations ?? 0}`,
                `메시지 ${moved.messages ?? 0}`,
                `하네스 ${moved.harnesses ?? 0}`,
                `스케줄 ${moved.schedules ?? 0}`,
                `템플릿 ${moved.templates ?? 0}`,
              ].join(' · ');
              toast(`이관 완료 — ${summary}`, { variant: 'success', duration: 8000 });
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              toast(`이관 실패: ${msg}`, { variant: 'error' });
            } finally {
              setClaiming(false);
            }
          }}
        >
          {claiming && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          내 계정으로 이관
        </Button>
      </section>

      {/* 비밀번호 변경 */}
      <form onSubmit={handlePasswordChange} className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">비밀번호 변경</h3>
        </div>
        <Input
          type="password"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Input
          type="password"
          placeholder="새 비밀번호 (영문 + 숫자 8자 이상)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Input
          type="password"
          placeholder="새 비밀번호 확인"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        {pwMsg && (
          <p
            className={`flex items-start gap-1.5 text-xs ${
              pwMsg.kind === 'ok' ? 'text-emerald-400' : 'text-destructive'
            }`}
          >
            {pwMsg.kind === 'ok' ? (
              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            )}
            <span>{pwMsg.text}</span>
          </p>
        )}
        <Button
          type="submit"
          disabled={
            !currentPassword || !newPassword || !newPasswordConfirm || pwSaving
          }
          className="w-full"
        >
          {pwSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          비밀번호 변경
        </Button>
      </form>
    </div>
  );
}
