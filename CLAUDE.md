# Agent Control Panel

여러 PC에서 실행 중인 Claude Code를 하나의 웹 채팅 UI로 원격 통제하는 시스템.

## 시스템 구성

### 1. 채팅 웹앱 (`/web`)
- Next.js 14 App Router + Tailwind CSS + shadcn/ui
- Vercel 무료 tier 배포
- 디스코드 스타일 채팅 UI (PC별 채널/탭 분리)
- 하네스 선택 드롭다운
- 실시간 스트리밍 응답 표시
- PC 온라인/오프라인 상태 표시
- 채팅 이력 저장 및 검색
- 모바일 우선 반응형 디자인 (핸드폰에서 주로 사용)
- 한국어 UI

### 2. Supabase 백엔드
- **messages**: 채팅 메시지 저장 (user/assistant/system, 스트리밍 chunk 포함)
- **agents**: 등록된 PC 목록, 온라인 상태, 마지막 하트비트
- **harnesses**: PC별 사용 가능한 하네스 경로 목록
- Realtime 채널: 명령 전달 및 응답 수신
- Row Level Security: Supabase Auth 인증 사용자만 접근
- 무료 tier 범위 내 운용

### 3. PC Agent 스크립트 (`/agent`)
- Node.js 경량 데몬 + @supabase/supabase-js
- Supabase Realtime으로 명령 수신 대기
- `claude --print --harness {path} "{message}"` 또는 Claude Code SDK로 실행
- 하네스 경로 자동 감지 및 적용
- 실행 결과를 chunk 단위로 Supabase에 스트리밍 전송
- 하트비트로 온라인 상태 주기적 보고
- pm2로 시스템 시작 시 자동 실행

### 4. 인증/보안
- Supabase Auth (이메일+비밀번호, 단일 사용자)
- API 키 기반 PC 등록
- 환경변수로 민감정보 관리 (.env 파일 절대 커밋 금지)

## 기술 스택

| 영역 | 스택 |
|------|------|
| Frontend | Next.js 14 App Router, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL + Realtime + Auth) |
| PC Agent | Node.js + @supabase/supabase-js |
| 배포 | Vercel (무료) |
| 프로세스 관리 | pm2 |

## 프로젝트 구조

```
agent-control-panel/
├── web/                    # Next.js 채팅 웹앱
│   ├── app/                # App Router 페이지
│   │   ├── (auth)/         # 로그인/회원가입
│   │   ├── chat/           # 채팅 메인 페이지
│   │   └── layout.tsx
│   ├── components/         # React 컴포넌트
│   │   ├── chat/           # 채팅 관련 (MessageList, MessageInput, StreamingMessage)
│   │   ├── sidebar/        # 사이드바 (PCList, HarnessSelector)
│   │   └── ui/             # shadcn/ui 컴포넌트
│   ├── lib/                # 유틸리티
│   │   ├── supabase/       # Supabase 클라이언트, 타입
│   │   └── hooks/          # 커스텀 훅 (useMessages, useAgents, useRealtime)
│   ├── public/
│   ├── .env.local          # 환경변수 (gitignore됨)
│   └── package.json
├── agent/                  # PC Agent 스크립트
│   ├── src/
│   │   ├── index.ts        # 메인 데몬 진입점
│   │   ├── executor.ts     # Claude Code 실행 및 스트리밍
│   │   ├── heartbeat.ts    # 하트비트 관리
│   │   └── harness.ts      # 하네스 감지/관리
│   ├── ecosystem.config.js # pm2 설정
│   ├── .env                # 환경변수 (gitignore됨)
│   └── package.json
├── supabase/               # Supabase 설정
│   ├── migrations/         # DB 마이그레이션 SQL
│   └── seed.sql            # 초기 데이터
└── CLAUDE.md               # 이 파일
```

## 핵심 데이터 플로우

```
1. 웹에서 PC 선택 + 대화(conversation) 선택 + 하네스 선택 + 메시지 입력
   └─ 대화가 없으면 첫 메시지 전송 시 대화가 자동 생성되고, 첫 사용자 메시지로 제목 자동 세팅
2. Supabase messages 테이블에 INSERT (role: 'user', conversation_id 포함)
3. 해당 PC의 Agent가 Realtime subscription으로 새 메시지 감지
4. Agent가 conversation_id 기준으로 같은 대화에 이전 user 메시지가 있으면 claude --continue 를 자동 적용
   - claude --print 로 실행 (hardened: --dangerously-skip-permissions 는 env 옵션)
5. stdout 을 chunk 단위로 messages 테이블에 스트리밍 업데이트 (500ms 디바운스)
6. 웹 UI 가 Realtime subscription 으로 응답 실시간 표시
7. 완료/에러/취소 시: 메시지 상태 업데이트 + 웹훅(옵션) + Web Push 알림 전송
```

## 인증 & 보안 플로우

- 웹 UI: Supabase Auth (이메일+비밀번호). JWT 는 브라우저에 저장.
- PC Agent: Service Role Key 를 저장하지 않음. 부팅 시 `/api/agent/auth` 로 자신의 AGENT_API_KEY 를 HS256 JWT(sub=user_id, role=authenticated, ttl=1h)로 교환해 Supabase 접근. 서버만 `SUPABASE_JWT_SECRET` 을 알고 있다.
- 설치: 웹 "PC 추가" → install_token 발급 → PowerShell 원라인(`irm .../api/install/<token> | iex`). 설치 시 PC 에 저장되는 값은 공개 anon key + 이 PC 용 api_key 뿐.

## DB 스키마 설계

```sql
-- agents: PC 목록 및 상태
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                    -- PC 표시 이름
  api_key TEXT UNIQUE NOT NULL,          -- PC 인증용 API 키
  status TEXT DEFAULT 'offline',         -- online/offline/busy
  last_heartbeat TIMESTAMPTZ,
  system_info JSONB,                     -- OS, CPU 등
  created_at TIMESTAMPTZ DEFAULT now()
);

-- harnesses: PC별 하네스 목록
CREATE TABLE harnesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- 하네스 표시 이름
  path TEXT NOT NULL,                    -- 하네스 파일 경로
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- messages: 채팅 메시지
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  harness_id UUID REFERENCES harnesses(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'pending',         -- pending/streaming/completed/error
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 개발 컨벤션

- **언어**: TypeScript 사용, strict 모드
- **스타일**: Prettier + ESLint 기본 설정
- **컴포넌트**: 함수형 컴포넌트 + hooks 패턴
- **상태관리**: Supabase Realtime 직접 사용 (별도 상태관리 라이브러리 불필요)
- **에러처리**: try/catch + 사용자 친화적 한국어 에러 메시지
- **환경변수**: NEXT_PUBLIC_ 접두사는 클라이언트용, 나머지는 서버용
- **커밋**: 한국어 커밋 메시지, conventional commits 형식

## 제약사항

- Claude Max 구독 기반 (API 비용 0, claude CLI 직접 호출). 향후 BYOK 모드 확장 가능.
- Supabase 무료 tier: 500MB DB, 2GB bandwidth, 50MB file storage
- Vercel 무료 tier: 100GB bandwidth, serverless function 10초 제한
- 다중 사용자 가능 (RLS 소유자 기반). 단, 기존 admin@acp.local 계정은 레거시 데이터 소유자이므로 **삭제 금지** — 새 사용자는 자기 이메일로 가입해 사용하면 된다.

## 최근 반영된 변경 (Phase 2)

- `conversations` 테이블 + `messages.conversation_id`: 대화 단위 스레드.
- `--dangerously-skip-permissions` 기본 해제 (env `DANGEROUSLY_SKIP_PERMISSIONS=1` 로 opt-in).
- Realtime 재연결 지수 백오프 + 토스트 피드백.
- 템플릿 갤러리: 시스템 템플릿 시드 + 하네스 feature 기반 추천.
- 대화 메시지 페이지네이션 (100개 단위 더 불러오기).
- Web Push 알림: 설정 페이지에서 켜기, 작업 완료/에러/취소 시 모바일·데스크탑 푸시.
- Cron 파서 확장: 표준 5-필드 (`*`, `,`, `-`, `*/N` 지원).

## 명령어

```bash
# 웹앱 개발
cd web && npm run dev          # 로컬 개발 서버
cd web && npm run build        # 프로덕션 빌드

# Agent 개발
cd agent && npm run dev        # 개발 모드 실행
cd agent && npm run build      # 빌드
cd agent && pm2 start ecosystem.config.js  # 프로덕션 실행

# Supabase
npx supabase db push           # 마이그레이션 적용
npx supabase gen types typescript --local > web/lib/supabase/types.ts  # 타입 생성
```
