-- ============================================================
-- 016: agent_logs.conversation_id + message_id — 로그를 원인 작업에 연결.
-- 사용자가 로그 한 줄을 클릭해 해당 대화/메시지로 바로 이동할 수 있게 한다.
-- 기존 로그는 NULL 로 남고, 새 로그만 컨텍스트가 채워진다.
-- ============================================================

ALTER TABLE agent_logs
  ADD COLUMN IF NOT EXISTS conversation_id UUID
    REFERENCES conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_id UUID
    REFERENCES messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agent_logs_conversation
  ON agent_logs(conversation_id)
  WHERE conversation_id IS NOT NULL;

COMMENT ON COLUMN agent_logs.conversation_id IS
  '로그가 발생한 대화. 로그 UI 에서 클릭 시 해당 대화로 이동.';
COMMENT ON COLUMN agent_logs.message_id IS
  '로그가 발생한 특정 assistant 메시지 (스트리밍/완료/에러). 링크 시 메시지로 스크롤 가능.';
