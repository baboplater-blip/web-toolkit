-- ============================================================
-- 013: agents.agent_version — 에이전트가 시작할 때 자기 package 버전을 기록.
-- 웹 UI 가 최신 버전과 비교해 구 버전 에이전트 재설치를 안내한다.
-- ============================================================

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS agent_version TEXT;

COMMENT ON COLUMN agents.agent_version IS
  '에이전트 런타임이 시작할 때 기록한 semver (예: 1.2.0). NULL 이면 아직 새 버전이 기동되지 않음.';
