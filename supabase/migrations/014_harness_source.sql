-- ============================================================
-- 014: harnesses.source — 에이전트 자동 스캔(scan) vs 사용자 수동 등록(manual) 구분.
-- 에이전트 재기동 시 수동 등록 항목이 유지되어야 하므로 source 가 필요.
-- ============================================================

ALTER TABLE harnesses
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'scan'
  CHECK (source IN ('scan', 'manual'));

CREATE INDEX IF NOT EXISTS idx_harnesses_agent_source
  ON harnesses(agent_id, source);

COMMENT ON COLUMN harnesses.source IS
  'scan = 에이전트가 디스크 스캔으로 찾아 등록. manual = 웹 UI 에서 사용자가 경로를 직접 추가.';
