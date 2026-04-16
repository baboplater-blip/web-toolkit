'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Monitor, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const validate = (): string | null => {
    if (!email.includes('@')) return '이메일 형식이 올바르지 않습니다.';
    if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      return '비밀번호에 영문과 숫자를 포함해주세요.';
    if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/chat`,
      },
    });

    setLoading(false);

    if (error) {
      setError(
        error.message.includes('already registered')
          ? '이미 가입된 이메일입니다. 로그인해주세요.'
          : error.message,
      );
      return;
    }

    // 이메일 확인 없이 바로 세션 생성된 경우
    if (data.session) {
      router.push('/chat');
      return;
    }

    // 이메일 확인 필요한 경우
    setSentEmail(email);
  };

  if (sentEmail) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm space-y-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <div className="space-y-2">
            <h1 className="text-xl font-bold">인증 메일을 보냈습니다</h1>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{sentEmail}</span>
              <br />
              메일함에서 인증 링크를 클릭하면 가입이 완료됩니다.
            </p>
            <p className="text-[11px] text-muted-foreground pt-2">
              메일이 오지 않았다면 스팸함을 확인하거나 몇 분 뒤 다시 시도해주세요.
            </p>
          </div>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              로그인 페이지로
            </Button>
          </Link>
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
          <h1 className="text-xl font-bold">계정 만들기</h1>
          <p className="text-sm text-muted-foreground">
            가입 후 내 PC를 원격으로 제어할 수 있습니다
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
            <Input
              type="password"
              placeholder="비밀번호 (영문 + 숫자 8자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <Input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                가입 중...
              </>
            ) : (
              '가입하기'
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            가입 시{' '}
            <span className="underline">이용약관</span>과{' '}
            <span className="underline">개인정보처리방침</span>에 동의하게 됩니다.
          </p>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
