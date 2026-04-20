-- 클라이언트·서버 에러 트래킹 테이블.
--
-- Sentry 같은 외부 SaaS 대신 Supabase 를 그대로 활용. 기존 agent_logs 는 에이전트 프로세스
-- 로그 용도이고, 이 테이블은 웹 UI 예외 + API 라우트 예외 + 에이전트 미처리 예외를 모은다.
--
-- TTL: 30일 지나면 수동 또는 cron 으로 삭제 (쿼터 절약).

CREATE TABLE IF NOT EXISTS client_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('web', 'server', 'agent', 'sw')),
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warn')),
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_errors_user ON client_errors(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_errors_recent ON client_errors(created_at DESC);

ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_errors_owner_read" ON client_errors;
CREATE POLICY "client_errors_owner_read" ON client_errors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT 는 사용자 본인 또는 user_id NULL (익명 글로벌 에러).
DROP POLICY IF EXISTS "client_errors_owner_insert" ON client_errors;
CREATE POLICY "client_errors_owner_insert" ON client_errors
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- DELETE 는 본인만.
DROP POLICY IF EXISTS "client_errors_owner_delete" ON client_errors;
CREATE POLICY "client_errors_owner_delete" ON client_errors
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
