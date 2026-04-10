-- anon 역할에도 접근 허용 (단일 사용자 시스템, 인증 세션 유지 문제 우회)
CREATE POLICY "anon_access_agents" ON agents
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_access_harnesses" ON harnesses
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_access_messages" ON messages
  FOR ALL TO anon USING (true) WITH CHECK (true);
