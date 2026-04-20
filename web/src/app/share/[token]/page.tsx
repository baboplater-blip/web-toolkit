import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { ExternalLink } from 'lucide-react';

/**
 * /share/[token] — 로그인 없이 열람 가능한 읽기 전용 대화 페이지.
 *
 * 접근 규칙:
 *   - 토큰이 DB 에 있고 revoked_at IS NULL 이며 (expires_at IS NULL OR expires_at > now) 이면 공개.
 *   - 조회 시 view_count / last_viewed_at 를 Service Role Key 로 갱신.
 *   - 민감 정보(api_key 등) 는 노출하지 않는다. 메시지 본문과 제목만.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PageProps {
  params: Promise<{ token: string }>;
}

interface SharedConversation {
  id: string;
  title: string;
  created_at: string;
  last_message_at: string;
}

interface SharedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: string;
  created_at: string;
}

async function loadShared(token: string): Promise<
  | {
      conversation: SharedConversation;
      messages: SharedMessage[];
      share: { expires_at: string | null; view_count: number };
    }
  | null
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  if (!/^[a-f0-9]{16,64}$/i.test(token)) return null;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: share } = await admin
    .from('conversation_share_tokens')
    .select('conversation_id, expires_at, revoked_at, view_count')
    .eq('token', token)
    .maybeSingle();

  if (!share) return null;
  if (share.revoked_at) return null;
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) return null;

  const { data: conv } = await admin
    .from('conversations')
    .select('id, title, created_at, last_message_at')
    .eq('id', share.conversation_id)
    .maybeSingle();

  if (!conv) return null;

  const { data: messages } = await admin
    .from('messages')
    .select('id, role, content, status, created_at')
    .eq('conversation_id', share.conversation_id)
    .order('created_at', { ascending: true })
    .limit(500);

  // 조회수 증가 (실패해도 무시 — 열람을 막지 않는다)
  admin
    .from('conversation_share_tokens')
    .update({
      view_count: (share.view_count ?? 0) + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('token', token)
    .then(() => {});

  return {
    conversation: conv as SharedConversation,
    messages: (messages as SharedMessage[]) ?? [],
    share: { expires_at: share.expires_at ?? null, view_count: share.view_count ?? 0 },
  };
}

const ROLE_LABEL: Record<string, string> = {
  user: '요청',
  assistant: '응답',
  system: '시스템',
};

const ROLE_STYLE: Record<string, string> = {
  user: 'bg-primary/10 border-primary/20',
  assistant: 'bg-muted/40 border-border',
  system: 'bg-amber-500/10 border-amber-500/20',
};

export default async function SharedConversationPage({ params }: PageProps) {
  const { token } = await params;
  const data = await loadShared(token);
  if (!data) notFound();

  const { conversation, messages, share } = data;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              공유된 대화
            </p>
            <p className="truncate text-sm font-semibold">{conversation.title}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Agent Control Panel
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 text-[11px] text-muted-foreground">
          {new Date(conversation.created_at).toLocaleString('ko-KR')} 시작 · 메시지 {messages.length}개
          {share.expires_at && (
            <> · 만료 {new Date(share.expires_at).toLocaleString('ko-KR')}</>
          )}
        </div>

        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            대화에 메시지가 없습니다.
          </p>
        ) : (
          <ol className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`rounded-lg border p-3 ${ROLE_STYLE[m.role] ?? 'bg-muted/40 border-border'}`}
              >
                <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="font-semibold">{ROLE_LABEL[m.role] ?? m.role}</span>
                  <span>
                    {new Date(m.created_at).toLocaleString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                    {m.status !== 'completed' && <> · {m.status}</>}
                  </span>
                </div>
                <div className="text-sm leading-relaxed prose prose-invert max-w-none prose-sm">
                  <MarkdownRenderer content={m.content || '*(빈 메시지)*'} />
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-8 text-[11px] text-muted-foreground">
          이 페이지는 읽기 전용이며, 원본 대화의 스냅샷입니다. 링크를 받은 사람만 접근할 수 있습니다.
        </p>
      </main>
    </div>
  );
}
