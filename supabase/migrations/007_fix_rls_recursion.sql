-- ============================================================
-- 007: RLS 무한 재귀 수정
-- user_profiles의 admin 정책이 user_profiles를 다시 조회하여
-- infinite recursion 발생. SECURITY DEFINER 함수로 우회.
-- ============================================================

-- 1) admin 여부를 RLS 우회하여 확인하는 헬퍼 함수
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = check_user_id AND role = 'admin'
  );
$$;

-- 2) 재귀 유발 정책 제거 후 재생성
DROP POLICY IF EXISTS "admin_read_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_read_all_agents" ON agents;
DROP POLICY IF EXISTS "admin_read_all_messages" ON messages;

-- user_profiles: admin은 전체 프로필 조회 가능 (헬퍼 함수 사용)
CREATE POLICY "admin_read_all_profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- agents: admin 전역 SELECT
CREATE POLICY "admin_read_all_agents" ON agents
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- messages: admin 전역 SELECT
CREATE POLICY "admin_read_all_messages" ON messages
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3) profiles_self_update의 WITH CHECK도 재귀 가능성 제거
DROP POLICY IF EXISTS "profiles_self_update" ON user_profiles;
CREATE POLICY "profiles_self_update" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
