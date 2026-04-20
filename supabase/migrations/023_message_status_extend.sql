-- messages.status CHECK 제약을 확장한다.
--
-- 기존 마이그레이션(001)은 'pending' | 'streaming' | 'completed' | 'error' 만 허용했지만,
-- 애플리케이션 코드는 오래전부터 'processing' (에이전트 점유 중) 와
-- 'cancelled' (사용자 중지) 도 씀. 이 값이 실제로 INSERT/UPDATE 되면
-- CHECK 위반으로 조용히 실패해서 메시지가 영영 갇히는 사례가 발생.
--
-- 멱등: 제약을 DROP IF EXISTS 후 재생성.

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_status_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_status_check
  CHECK (status IN (
    'pending',
    'streaming',
    'processing',
    'completed',
    'error',
    'cancelled'
  ));
