-- ============================================================
-- 006: 누락 테이블 + 컬럼 보완
-- schedules, agent_logs, install_tokens 테이블 생성
-- agents에 restart_requested, webhook_url 컬럼 추가
-- ============================================================

-- ------------------------------------------------------------
-- 1) agents 테이블 누락 컬럼
-- ------------------------------------------------------------
ALTER TABLE agents ADD COLUMN IF NOT EXISTS restart_requested BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- ------------------------------------------------------------
-- 2) schedules 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  next_run TIMESTAMPTZ,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_agent_enabled ON schedules(agent_id, enabled);

-- ------------------------------------------------------------
-- 3) agent_logs 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_created ON agent_logs(agent_id, created_at DESC);

-- ------------------------------------------------------------
-- 4) install_tokens 테이블
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS install_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  pc_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_install_tokens_token ON install_tokens(token);

-- ------------------------------------------------------------
-- 5) RLS (이미 005에서 활성화/정책 생성된 경우 IF NOT EXISTS 없으므로 조건부 실행)
-- ------------------------------------------------------------
ALTER TABLE schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE install_tokens  ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 없을 때만 생성 (DO 블록으로 안전하게)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_owner') THEN
    EXECUTE 'CREATE POLICY "schedules_owner" ON schedules FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_logs' AND policyname = 'agent_logs_owner_read') THEN
    EXECUTE 'CREATE POLICY "agent_logs_owner_read" ON agent_logs FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_logs' AND policyname = 'agent_logs_owner_insert') THEN
    EXECUTE 'CREATE POLICY "agent_logs_owner_insert" ON agent_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'install_tokens' AND policyname = 'install_tokens_owner') THEN
    EXECUTE 'CREATE POLICY "install_tokens_owner" ON install_tokens FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;
