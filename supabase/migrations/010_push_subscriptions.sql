-- ============================================================
-- 010: Web Push 구독 테이블
-- 한 사용자가 여러 기기에서 구독할 수 있도록 endpoint 를 PK 로 활용.
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,           -- Push 엔드포인트 URL (기기별 고유)
  p256dh TEXT NOT NULL,                    -- 암호화 키
  auth TEXT NOT NULL,                      -- 인증 secret
  user_agent TEXT,                         -- 기기 식별용 (모바일/데스크탑 구분)
  /** 이 구독이 받아볼 이벤트 종류. 기본은 전부. */
  notify_on_complete BOOLEAN NOT NULL DEFAULT true,
  notify_on_error    BOOLEAN NOT NULL DEFAULT true,
  notify_on_cancel   BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_owner" ON push_subscriptions;
CREATE POLICY "push_subscriptions_owner" ON push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
