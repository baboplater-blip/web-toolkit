-- ============================================================
-- 021: conversations.pinned — 대화 상단 고정.
-- ============================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversations_pinned_time
  ON conversations(agent_id, pinned DESC, last_message_at DESC)
  WHERE archived = false;

COMMENT ON COLUMN conversations.pinned IS
  '대화 목록 상단에 고정할지 여부. agent_id+archived=false 범위에서 pinned=true 가 먼저 정렬.';
