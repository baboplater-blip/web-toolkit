import type { SupabaseClient } from '@supabase/supabase-js';
import { log } from './logger';

/** 내부 큐에 아이템을 삽입하는 함수 시그니처 — index.ts 의 messageQueue.push 를 감싸 주입한다. */
export interface EnqueueFn {
  (item: {
    msgId: string;
    content: string;
    harnessPath: string | null;
    conversationId: string;
  }): void;
}

/**
 * 에이전트가 재기동되거나 오프라인에서 복귀할 때 못 받은 작업을 복구.
 *
 * 1) 지난 세션에서 streaming/processing 상태로 남은 assistant 메시지는 즉시 error 로 마감 —
 *    UI 에 "실행 중" 으로 영영 남아 있는 시체를 치운다. lock 파일로 싱글 인스턴스가 보장되므로
 *    "현재 active 한 assistant = 다 죽은 것" 이라 가정해도 안전.
 *
 * 2) role='user' 이면서 동일 대화에 자기보다 최신의 assistant 메시지가 없는 메시지 =
 *    아직 응답 받지 못한 명령. 오프라인 중에 사용자가 쌓아놓았거나, 1) 로 마감된 streaming
 *    이었던 경우가 여기 해당. atomic 으로 재점유해서 큐에 넣는다.
 *
 * 반환값: 복구해 큐잉한 메시지 수.
 */
export async function catchupPendingWork(
  client: SupabaseClient,
  agentId: string,
  enqueue: EnqueueFn,
): Promise<number> {
  // 1) 좀비 assistant 마감.
  const { data: zombies, error: zombieErr } = await client
    .from('messages')
    .update({
      status: 'error',
      error_message: '에이전트 재시작으로 중단된 작업입니다.',
    })
    .eq('agent_id', agentId)
    .eq('role', 'assistant')
    .in('status', ['streaming', 'processing'])
    .select('id');
  if (zombieErr) {
    log(`catchup: zombie 어시스턴트 정리 실패: ${zombieErr.message}`, 'warn');
  } else if (zombies && zombies.length > 0) {
    log(`catchup: 중단된 어시스턴트 ${zombies.length}건 마감`);
  }

  // 2) 지난 7일 user 메시지 중 아직 처리되지 않은 것 탐색.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: userMsgs, error: userErr } = await client
    .from('messages')
    .select('id, content, harness_id, conversation_id, created_at')
    .eq('agent_id', agentId)
    .eq('role', 'user')
    .in('status', ['completed', 'processing'])
    .gt('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true })
    .limit(50);
  if (userErr) {
    log(`catchup: user 메시지 조회 실패: ${userErr.message}`, 'warn');
    return 0;
  }
  if (!userMsgs || userMsgs.length === 0) return 0;

  // 각 user 메시지가 속한 대화에서 자기보다 새로운 assistant 응답이 있는지 확인.
  const conversationIds = Array.from(
    new Set(
      (userMsgs as Array<{ conversation_id: string | null }>)
        .map((m) => m.conversation_id)
        .filter((v): v is string => !!v),
    ),
  );
  const latestAssistantPerConv = new Map<string, string>();
  if (conversationIds.length > 0) {
    const { data: assistants } = await client
      .from('messages')
      .select('conversation_id, created_at')
      .eq('agent_id', agentId)
      .eq('role', 'assistant')
      .in('conversation_id', conversationIds);
    for (const a of (assistants ?? []) as Array<{
      conversation_id: string;
      created_at: string;
    }>) {
      const cur = latestAssistantPerConv.get(a.conversation_id);
      if (!cur || new Date(a.created_at).getTime() > new Date(cur).getTime()) {
        latestAssistantPerConv.set(a.conversation_id, a.created_at);
      }
    }
  }

  const orphaned = (userMsgs as Array<{
    id: string;
    content: string;
    harness_id: string | null;
    conversation_id: string | null;
    created_at: string;
  }>).filter((u) => {
    if (!u.conversation_id) return false;
    const latestA = latestAssistantPerConv.get(u.conversation_id);
    if (!latestA) return true; // 같은 대화에 assistant 응답이 아예 없음.
    return new Date(u.created_at).getTime() > new Date(latestA).getTime();
  });

  if (orphaned.length === 0) return 0;

  // 하네스 경로 일괄 조회 (N+1 회피).
  const harnessIds = Array.from(
    new Set(orphaned.map((o) => o.harness_id).filter((v): v is string => !!v)),
  );
  const harnessPathMap = new Map<string, string>();
  if (harnessIds.length > 0) {
    const { data: hList } = await client
      .from('harnesses')
      .select('id, path')
      .in('id', harnessIds);
    for (const h of (hList ?? []) as Array<{ id: string; path: string }>) {
      harnessPathMap.set(h.id, h.path);
    }
  }

  let claimed = 0;
  for (const msg of orphaned) {
    // atomic 재점유 — 동시에 Realtime 이 이 메시지를 집어가면 여기는 0 rows 가 돌아온다.
    const { data: claimedRows } = await client
      .from('messages')
      .update({ status: 'processing' })
      .eq('id', msg.id)
      .in('status', ['completed', 'processing'])
      .select('id');
    if (!claimedRows || claimedRows.length === 0) continue;

    enqueue({
      msgId: msg.id,
      content: msg.content,
      harnessPath: msg.harness_id ? harnessPathMap.get(msg.harness_id) ?? null : null,
      conversationId: msg.conversation_id!,
    });
    claimed++;
  }

  if (claimed > 0) {
    log(`catchup: 오프라인/재기동 중 쌓인 명령 ${claimed}건 복구 큐잉`);
  }
  return claimed;
}
