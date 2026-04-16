'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Monitor, Loader2, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Recovery 링크로 진입 시 Supabase SDK 가 URL fragment 를 읽어 세션을 생성한다.
  // 세션이 만들어지기를 잠깐 기다린 뒤 form 활성화.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const validate = (): string | null => {
    if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      return '영문과 숫자를 모두 포함해주세요.';
    if (password !== confirm) return '비밀번호가 일치하지 않습니다.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/chat'), 2000);
  };

  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-bold">비밀번호가 변경되었습니다</h1>
          <p className="text-sm text-muted-foreground">잠시 후 채팅으로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Monitor className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-xl font-bold">새 비밀번호 설정</h1>
          <p className="text-sm text-muted-foreground">
            {ready
              ? '변경할 새 비밀번호를 입력해주세요'
              : '재설정 링크를 확인 중입니다...'}
          </p>
        </div>

        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="새 비밀번호 (영문 + 숫자 8자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
                autoFocus
              />
              <Input
                type="password"
                placeholder="새 비밀번호 확인"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          링크가 만료되었나요?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
