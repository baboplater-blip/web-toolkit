-- ============================================================
-- 011: agents.api_mode — 에이전트가 Claude Max 구독을 쓰는지, Anthropic API 키(BYOK)를 쓰는지 구분.
-- 에이전트가 시작 시 본인 env 상태를 보고 자동으로 값을 세팅한다.
-- ============================================================

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS api_mode TEXT NOT NULL DEFAULT 'max'
  CHECK (api_mode IN ('max', 'byok'));

COMMENT ON COLUMN agents.api_mode IS
  'max = Claude Max 구독 기반 (기본), byok = ANTHROPIC_API_KEY 로 직접 호출 (사용자 부담)';
