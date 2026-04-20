-- ============================================================
-- 018: Wake-on-LAN 지원 컬럼들.
--
--   mac_address      : 에이전트가 시작 시 자기 primary NIC 에서 읽어 기록 (소문자 AA:BB:CC:DD:EE:FF)
--   local_ip         : 해당 NIC 의 IPv4 (서브넷 판별용)
--   wake_request_at  : 웹에서 "깨우기" 를 요청한 시각. 같은 서브넷 helper 가 이 값을 감지해 매직 패킷 전송
--   wake_last_sent_at: helper 가 마지막으로 매직 패킷을 보낸 시각 (감사/디바운스용)
-- ============================================================

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS mac_address TEXT,
  ADD COLUMN IF NOT EXISTS local_ip TEXT,
  ADD COLUMN IF NOT EXISTS wake_request_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wake_last_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN agents.mac_address IS
  'Primary NIC MAC (AA:BB:CC:DD:EE:FF). null 이면 이 PC 는 WoL 타겟이 될 수 없음.';
COMMENT ON COLUMN agents.local_ip IS
  'Primary NIC IPv4. 같은 서브넷(/24) 의 helper 가 깨울 수 있는지 판정에 사용.';
COMMENT ON COLUMN agents.wake_request_at IS
  '웹이 이 PC 를 깨워달라고 요청한 시각. helper 가 감지해 매직 패킷 전송 후 그대로 두어도 OK.';
COMMENT ON COLUMN agents.wake_last_sent_at IS
  'helper 가 마지막으로 이 타겟에 매직 패킷을 보낸 시각. 디바운스/로그용.';
