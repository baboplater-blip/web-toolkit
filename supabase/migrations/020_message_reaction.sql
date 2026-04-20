-- ============================================================
-- 020: messages.reaction — assistant 메시지 품질 빠른 피드백.
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reaction TEXT
    CHECK (reaction IS NULL OR reaction IN ('up', 'down', 'curious'));

COMMENT ON COLUMN messages.reaction IS
  '빠른 품질 피드백: up(좋음)/down(나쁨)/curious(흥미로움). 한 메시지당 하나.';

CREATE INDEX IF NOT EXISTS idx_messages_reaction
  ON messages(reaction) WHERE reaction IS NOT NULL;
