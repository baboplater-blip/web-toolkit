-- ============================================================
-- 022: push_subscriptions.notify_daily_summary — 일간 요약 알림 구독 플래그.
-- ============================================================

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS notify_daily_summary BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN push_subscriptions.notify_daily_summary IS
  '매일 저녁 하루 활동 요약 푸시를 받을지 여부. 기본 off (사용자가 명시적으로 켤 때만 발송).';
