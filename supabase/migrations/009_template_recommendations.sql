-- ============================================================
-- 009: 템플릿 카탈로그화
-- - 시스템(전역) 템플릿 지원: user_id IS NULL
-- - 하네스 기능 태그 기반 추천: recommended_for TEXT[]
-- - 설명·아이콘 필드 추가
-- - 초기 시드 (한국어, 공통 사용 사례)
-- ============================================================

-- ------------------------------------------------------------
-- 1) 컬럼 추가 + user_id NOT NULL 완화
-- ------------------------------------------------------------
ALTER TABLE templates ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS recommended_for TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS icon TEXT;

-- is_system 인 행은 항상 user_id IS NULL 이 되도록 무결성 체크
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'templates_system_null_user'
  ) THEN
    EXECUTE 'ALTER TABLE templates ADD CONSTRAINT templates_system_null_user
      CHECK ((is_system = true AND user_id IS NULL) OR (is_system = false AND user_id IS NOT NULL))';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) RLS 재작성: 시스템 템플릿은 모두 SELECT, 개인 템플릿은 소유자만 CRUD
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "templates_owner"            ON templates;
DROP POLICY IF EXISTS "templates_select"           ON templates;
DROP POLICY IF EXISTS "templates_modify_own"       ON templates;

CREATE POLICY "templates_select" ON templates
  FOR SELECT TO authenticated
  USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "templates_modify_own" ON templates
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND is_system = false)
  WITH CHECK (user_id = auth.uid() AND is_system = false);

-- ------------------------------------------------------------
-- 3) 시스템 템플릿 시드 (한국어)
-- ------------------------------------------------------------
INSERT INTO templates (name, prompt, category, sort_order, is_system, description, icon, recommended_for)
VALUES
  (
    '프로젝트 구조 요약',
    '이 프로젝트의 전체 구조를 파악해주세요. 디렉터리 트리, 주요 모듈의 역할, 의존성 관계를 3~5문단으로 정리하고, 초심자가 가장 먼저 읽어야 할 파일 5개를 우선순위로 알려주세요.',
    'general', 10, true,
    '처음 들어간 레포를 빠르게 이해할 때.',
    '🗺️',
    '{"섹션 구조화","프로젝트 구조"}'
  ),
  (
    'CLAUDE.md 개선',
    '현재 CLAUDE.md 하네스를 검토하고 부족한 부분을 코드 분석을 통해 직접 보강해주세요. 특히 기술 스택·코딩 컨벤션·명령어·제약사항·DB 스키마가 최신 상태인지 확인하고, 불필요하거나 잘못된 부분은 삭제해주세요. 수정 후 어떤 변경을 했는지 요약해주세요.',
    'general', 20, true,
    '하네스 품질을 코드와 맞춰 다듬을 때.',
    '📝',
    '{"섹션 구조화","기술 스택 정의","코딩 컨벤션","명령어 가이드"}'
  ),
  (
    '버그 3개 찾기',
    '이 저장소에서 가장 위험해 보이는 잠재적 버그 3개를 찾아 설명해주세요. 각 버그에 대해 (1) 어떤 상황에서 트리거되는지 (2) 현재 코드의 위치 (파일:라인) (3) 제안 수정안을 함께 제시해주세요. 추측 대신 실제 코드를 열어보고 답해주세요.',
    'review', 30, true,
    '규모가 커진 프로젝트의 안정성 점검.',
    '🐛',
    '{"코딩 컨벤션","문제해결 가이드"}'
  ),
  (
    '테스트 커버리지 갭',
    '테스트가 부족하거나 누락된 핵심 경로를 찾아 상위 5개를 우선순위순으로 보여주세요. 각 항목에 대해 추가해야 할 테스트 아이디어와 예시 코드 스케치를 포함해주세요.',
    'review', 40, true,
    '배포 전 테스트 공백 파악.',
    '✅',
    '{"테스트 가이드","코드 예시"}'
  ),
  (
    '이 파일 리팩토링 3안',
    '현재 워크스페이스에서 가장 복잡하거나 자주 수정되는 파일 하나를 골라, 서로 다른 리팩토링 접근 3가지를 제안해주세요. 각 접근의 장단점과 파급 범위를 비교한 표를 포함해주세요. 실제 적용은 하지 말고 제안만 하세요.',
    'review', 50, true,
    '난해해진 파일을 손대기 전 방향 잡기.',
    '🔧',
    '{"코딩 컨벤션","코드 예시"}'
  ),
  (
    '최근 변경 요약',
    'git log 최근 20개 커밋을 분석해서 (1) 가장 큰 변경점 3가지 (2) 잠재적 회귀 위험 (3) 팀원이 알아야 할 하이라이트 로 나누어 한국어로 요약해주세요.',
    'ops', 60, true,
    '자리를 비웠다 돌아왔을 때 빠른 따라잡기.',
    '📜',
    '{}'
  ),
  (
    '성능 병목 후보',
    '이 프로젝트에서 성능 병목이 될 가능성이 높은 부분 3곳을 코드 분석 기반으로 찾아주세요. 각 위치별로 예상 병목 유형(CPU/메모리/I/O/네트워크), 측정 방법, 개선 아이디어를 제시해주세요.',
    'review', 70, true,
    '성능 이슈 진단.',
    '⚡',
    '{"코드 예시"}'
  ),
  (
    'DB 스키마 리뷰',
    '현재 DB 스키마를 검토하고, 인덱스 누락·중복·정규화 불균형·RLS 허점을 위험도 순으로 지적해주세요. 각 지적에 대해 수정용 SQL 스케치를 함께 주세요. 실제 적용은 하지 마세요.',
    'review', 80, true,
    'DB 건전성 점검.',
    '🗄️',
    '{"DB/스키마 정의","인증/보안"}'
  ),
  (
    '보안 점검',
    '이 코드베이스에 있을 수 있는 OWASP Top 10 관점의 취약점을 조사해주세요. 특히 인증 우회·입력 검증·비밀정보 유출·의존성 위험을 중점으로, 발견한 항목은 파일:라인과 함께 명시하세요.',
    'review', 90, true,
    '배포 전 최종 보안 체크.',
    '🔒',
    '{"인증/보안","API 정의"}'
  ),
  (
    '이 챕터 다듬기',
    '현재 워크스페이스의 원고(가장 최근 수정된 .md 파일)를 대상으로, 독자 몰입을 해치는 문장·반복·모호한 표현을 찾아 자연스럽게 다듬어주세요. 스타일은 원래 어조를 유지하고, 분량은 ±5% 이내로 조절하세요. 수정 후 어떤 종류의 손질을 했는지 간략히 요약해주세요.',
    'writing', 100, true,
    '집필 중인 장의 마무리 퇴고.',
    '✍️',
    '{"섹션 구조화"}'
  ),
  (
    '이미지 프롬프트 CSV',
    '최근 작성된 원고의 장면별로 생성 AI용 이미지 프롬프트를 CSV 형식으로 작성해주세요. 컬럼은 chapter, scene, prompt, negative_prompt, aspect_ratio. 프롬프트는 영어·한국어 혼용 대신 영어로 통일, 구도·조명·스타일 태그를 포함해주세요.',
    'writing', 110, true,
    '집필 파이프라인의 이미지 준비 단계.',
    '🖼️',
    '{}'
  ),
  (
    'Unity 씬 정리',
    '현재 Unity 프로젝트의 씬 계층·프리팹 참조·ScriptableObject 사용 현황을 파악하고 비효율적인 중첩이나 미사용 자원을 정리할 계획을 세워주세요. 각 변경안에 대해 런타임 영향과 에디터 영향을 분리해 설명해주세요.',
    'unity', 120, true,
    'Unity 프로젝트 청소.',
    '🎮',
    '{"프로젝트 구조"}'
  )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 4) 인덱스
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_templates_system_category
  ON templates(is_system, category, sort_order);
CREATE INDEX IF NOT EXISTS idx_templates_recommended_for
  ON templates USING GIN(recommended_for);
