'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, Mail, KeyRound, AlertCircle } from 'lucide-react';

export function AccountTab() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? '');
    })();
  }, [supabase]);

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
