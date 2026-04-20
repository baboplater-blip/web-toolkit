-- ============================================================
-- 015: conversations.tags — 사용자가 대화에 붙이는 키워드/프로젝트 태그.
-- 다중 사용자 RLS 환경에서 각자 자기 대화에만 태그를 붙인다.
-- ============================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- 배열 컬럼 검색은 GIN 이 표준 — 태그 필터링 시 인덱스 사용.
CREATE INDEX IF NOT EXISTS idx_conversations_tags
  ON conversations USING GIN (tags);

COMMENT ON COLUMN conversations.tags IS
  '사용자가 붙인 태그 목록. 예: [''버그'', ''리팩토링'']. 순서는 사용자가 정한 입력 순서를 유지.';
