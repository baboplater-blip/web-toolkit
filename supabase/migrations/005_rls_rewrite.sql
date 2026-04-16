-- ============================================================
-- 005: RLS 재작성 — 소유자(user_id=auth.uid())만 접근
-- anon 전면 개방 정책 제거, 각 테이블을 소유 사용자만 CRUD
-- ============================================================

-- ------------------------------------------------------------
-- 1) 기존 개방 정책 전부 제거
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated_access_agents"    ON agents;
DROP POLICY IF EXISTS "authenticated_access_harnesses" ON harnesses;
DROP POLICY IF EXISTS "authenticated_access_messages"  ON messages;
DROP POLICY IF EXISTS "authenticated_access_templates" ON templates;
DROP POLICY IF EXISTS "anon_access_agents"    ON agents;
DROP POLICY IF EXISTS "anon_access_harnesses" ON harnesses;
DROP POLICY IF EXISTS "anon_access_messages"  ON messages;
DROP POLICY IF EXISTS "anon_access_templates" ON templates;

-- (다른 테이블은 RLS 미적용 상태였거나 이미 정책 없음)
ALTER TABLE IF EXISTS schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agent_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS install_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles   ENABLE ROW LEVEL SECURITY;

-- 기존에 남아 있을 수 있는 과거 정책 정리 (존재 시에만)
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('schedules','agent_logs','install_tokens','user_profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 2) 소유자 기반 정책 (authenticated only)
-- ------------------------------------------------------------
CREATE POLICY "agents_owner" ON agents
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "harnesses_owner" ON harnesses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "messages_owner" ON messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "templates_owner" ON templates
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "schedules_owner" ON schedules
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "agent_logs_owner_read" ON agent_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- agent_logs INSERT 는 서버측(service_role) 또는 에이전트(user_id 자기자신) 만
CREATE POLICY "agent_logs_owner_insert" ON agent_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "install_tokens_owner" ON install_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_profiles: 본인만 읽기/수정 (role은 admin을 통해서만 변경되도록 클라이언트에서 막음)
CREATE POLICY "profiles_self_read" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_self_update" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

-- ------------------------------------------------------------
-- 3) 관리자 전역 SELECT (감사용)
-- ------------------------------------------------------------
CREATE POLICY "admin_read_all_agents" ON agents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_read_all_messages" ON messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_read_all_profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
