-- ============================================================
-- 004: 멀티테넌시 기반 — 각 테이블에 user_id 추가 + 기존 데이터 이관
-- 전제: auth.users 에 admin@acp.local 계정이 이미 존재 (소유자)
-- ============================================================

-- ------------------------------------------------------------
-- 1) user_id 컬럼 추가 (nullable 시작, backfill 후 NOT NULL)
-- ------------------------------------------------------------
ALTER TABLE agents         ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE harnesses      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE messages       ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE templates      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE schedules      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE agent_logs     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE install_tokens ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ------------------------------------------------------------
-- 2) 기존 데이터 소유자(admin@acp.local)에게 귀속
-- ------------------------------------------------------------
DO $$
DECLARE
  owner_uid UUID;
BEGIN
  SELECT id INTO owner_uid FROM auth.users WHERE email = 'admin@acp.local' LIMIT 1;
  IF owner_uid IS NULL THEN
    RAISE EXCEPTION '소유자 계정 admin@acp.local 이 auth.users 에 없습니다. 먼저 생성하세요.';
  END IF;

  UPDATE agents         SET user_id = owner_uid WHERE user_id IS NULL;
  UPDATE harnesses      SET user_id = owner_uid WHERE user_id IS NULL;
  UPDATE messages       SET user_id = owner_uid WHERE user_id IS NULL;
  UPDATE templates      SET user_id = owner_uid WHERE user_id IS NULL;
  UPDATE schedules      SET user_id = owner_uid WHERE user_id IS NULL;
  UPDATE agent_logs     SET user_id = owner_uid WHERE user_id IS NULL;
  UPDATE install_tokens SET user_id = owner_uid WHERE user_id IS NULL;
END $$;

-- ------------------------------------------------------------
-- 3) NOT NULL 제약 + 인덱스
-- ------------------------------------------------------------
ALTER TABLE agents         ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE harnesses      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE messages       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE templates      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE schedules      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE agent_logs     ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE install_tokens ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agents_user          ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_harnesses_user       ON harnesses(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_user       ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user       ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user      ON agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_install_tokens_user  ON install_tokens(user_id);

-- ------------------------------------------------------------
-- 4) user_profiles 테이블 (역할/프로필)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기존 소유자 프로필 생성
INSERT INTO user_profiles (id, display_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', email), 'admin'
  FROM auth.users
  WHERE email = 'admin@acp.local'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 신규 가입 시 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
