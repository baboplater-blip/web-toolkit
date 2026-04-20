-- install_tokens 만료 시간 단축 (24h → 1h).
--
-- 원클릭 설치는 토큰을 받은 직후 사용하는 흐름이라 긴 유효기간은 불필요하다.
-- 짧게 유지해 URL 로그/히스토리에 남은 토큰이 재사용되는 위험을 낮춘다.
-- 기존 토큰은 건드리지 않는다 (개별 행의 expires_at 유지).

ALTER TABLE install_tokens
  ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '1 hour');
