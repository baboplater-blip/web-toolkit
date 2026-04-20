-- ============================================================
-- 008: 대화(conversation) 스레드 도입
-- messages 를 agent 별 flat list → conversation 단위 스레드로 재구조화.
-- 기존 메시지는 에이전트별 "이전 대화" 1개에 통째로 묶는다.
-- ============================================================

-- ------------------------------------------------------------
-- 1) conversations 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '새 대화',
  claude_session_id TEXT,                  -- Claude Code 세션 재개(--resume)용 식별자 (선택)
  archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_agent_time
  ON conversations(agent_id, archived, last_message_at DESC);

-- ------------------------------------------------------------
-- 2) messages.conversation_id (NULL 허용으로 먼저 추가 후 backfill)
-- ------------------------------------------------------------
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID
  REFERENCES conversations(id) ON DELETE CASCADE;

-- 기존 메시지: 각 (agent_id, user_id) 쌍마다 "이전 대화" 1 개 만들어서 전부 할당
DO $$
DECLARE
  r RECORD;
  new_conv UUID;
BEGIN
  FOR r IN
    SELECT DISTINCT agent_id, user_id
      FROM messages
     WHERE conversation_id IS NULL
       AND agent_id IS NOT NULL
       AND user_id IS NOT NULL
  LOOP
    INSERT INTO conversations (agent_id, user_id, title)
    VALUES (r.agent_id, r.user_id, '이전 대화')
    RETURNING id INTO new_conv;

    UPDATE messages
       SET conversation_id = new_conv
     WHERE agent_id = r.agent_id
       AND user_id  = r.user_id
       AND conversation_id IS NULL;
  END LOOP;
END $$;

-- 이제 NOT NULL 로 고정 — 신규 메시지는 반드시 conversation_id 를 가진다.
ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
  ON messages(conversation_id, created_at);

-- ------------------------------------------------------------
-- 3) last_message_at 자동 갱신 트리거
--    INSERT 시 해당 conversation 의 last_message_at 을 갱신한다.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION bump_conversation_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
     SET last_message_at = NEW.created_at
   WHERE id = NEW.conversation_id
     AND last_message_at < NEW.created_at;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_messages_bump_conversation ON messages;
CREATE TRIGGER trg_messages_bump_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION bump_conversation_activity();

-- ------------------------------------------------------------
-- 4) RLS (소유자만 CRUD)
-- ------------------------------------------------------------
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_owner" ON conversations;
CREATE POLICY "conversations_owner" ON conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- admin 감사
DROP POLICY IF EXISTS "admin_read_all_conversations" ON conversations;
CREATE POLICY "admin_read_all_conversations" ON conversations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ------------------------------------------------------------
-- 5) Realtime
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE conversations';
  END IF;
END $$;
