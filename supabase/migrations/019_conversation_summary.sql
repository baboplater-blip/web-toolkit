-- ============================================================
-- 019: conversations.summary — 대화 요약 저장.
-- UI 에서 긴 대화의 상단에 접힌 형태로 노출. 수동 편집 또는 자동 생성(에이전트 경유).
-- ============================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS summary_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN conversations.summary IS
  '이 대화의 핵심을 요약한 텍스트 (마크다운 가능, 2000자 이내 권장).';
COMMENT ON COLUMN conversations.summary_updated_at IS
  '요약이 마지막으로 수정/생성된 시각. UI 에서 "N시간 전 생성" 표시용.';
