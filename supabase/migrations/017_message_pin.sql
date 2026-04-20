-- ============================================================
-- 017: messages.pinned — 중요 메시지를 핀으로 표시해 나중에 빠르게 찾게 한다.
-- pinned_at 은 정렬용 (최근 핀한 순서).
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_pinned
  ON messages(conversation_id, pinned_at DESC)
  WHERE pinned = true;

COMMENT ON COLUMN messages.pinned IS
  '사용자가 중요 표시한 메시지. 대화 상단 핀 목록에 노출.';
COMMENT ON COLUMN messages.pinned_at IS
  '핀 시각 — 핀 목록 최근순 정렬용. 해제하면 NULL 로 돌린다.';
