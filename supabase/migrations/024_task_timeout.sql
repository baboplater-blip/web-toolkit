-- 작업 타임아웃 오버라이드 계층 추가.
--
-- 우선순위 (큰 쪽이 우선):
--   1. messages.timeout_extended = true  → 현재 해상도의 2배
--   2. conversations.timeout_override_minutes (NULL 아님)
--   3. agents.task_timeout_minutes        (NULL 아님)
--   4. 에이전트 환경변수 TASK_TIMEOUT_MS
--   5. 기본값 30 분

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS task_timeout_minutes INT;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS timeout_override_minutes INT;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS timeout_extended BOOLEAN NOT NULL DEFAULT FALSE;

-- 정수 범위 방어 (1~720 분 = 12 시간 상한).
ALTER TABLE agents
  DROP CONSTRAINT IF EXISTS agents_task_timeout_minutes_check;
ALTER TABLE agents
  ADD CONSTRAINT agents_task_timeout_minutes_check
  CHECK (task_timeout_minutes IS NULL OR (task_timeout_minutes BETWEEN 1 AND 720));

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_timeout_override_check;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_timeout_override_check
  CHECK (timeout_override_minutes IS NULL OR (timeout_override_minutes BETWEEN 1 AND 720));
