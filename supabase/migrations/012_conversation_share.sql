-- ============================================================
-- 012: 대화 읽기전용 공유 링크
-- 대화 한 건에 대해 토큰을 발급하면 /share/<token> 으로 누구든 읽을 수 있다.
-- 토큰은 revoke_at 이 세팅되거나 expires_at 이 지나면 무효화된다.
-- ============================================================

CREATE TABLE IF NOT EXISTS conversation_share_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  /** NULL = 무기한, 지정 시 그 이후 접근 차단 */
  expires_at TIMESTAMPTZ,
  /** 토큰 회수 시각. NOT NULL 이면 접근 차단. */
  revoked_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON conversation_share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_conv ON conversation_share_tokens(conversation_id);

ALTER TABLE conversation_share_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "share_tokens_owner" ON conversation_share_tokens;
CREATE POLICY "share_tokens_owner" ON conversation_share_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
