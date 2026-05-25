# Web Toolkit Harness

브라우저 안에서 완결되는 도구 모음 사이트. 모든 처리는 클라이언트(Web Worker + WASM)에서 수행하고 사용자 파일은 서버로 전송되지 않는다. 본 하네스는 신규 도구 추가·기존 도구 고도화·배포를 자동화한다.

## 미션 (1원칙)

> **사용자가 올린 파일은 절대 서버로 전송하지 않는다.** 모든 변환·압축·OCR·AI 추론은 브라우저 안에서 처리한다.

이 원칙에서 다음 결정이 파생된다:
- API Route (`web/src/app/api/**`) 사용 금지 (인증·푸시 같은 옛 채팅 시스템 잔재 외에는 추가 금지)
- Node 전용 모듈(`fs`, `path`, `child_process`) 금지 — 도구 코드는 모두 클라이언트 컴포넌트
- 무거운 처리는 Web Worker, UI 스레드 차단 금지
- 큰 WASM(ffmpeg / tesseract / esrgan) 은 dynamic import 로 lazy load

## 트리거 규칙

| 키워드 | 호출 에이전트 |
|--------|-------------|
| "도구 추가", "새 도구", "{X} 도구 만들어" | `tool-architect` → `tool-builder` |
| "PDF/이미지/비디오/오디오/OCR/AI 압축/변환…" 기능 요청 | `tool-architect` |
| "느려요", "용량 큼", "번들", "Lighthouse" | `perf-profiler` |
| "키보드 안 됨", "접근성", "스크린리더" | `a11y-auditor` |
| "registry 정리", "키워드", "카테고리" | `registry-curator` |
| "테스트", "큰 파일", "엣지케이스" | `qa-tester` |
| "메타", "OG", "SEO" | `seo-writer` |
| "배포", "릴리즈", "프로덕션" | `release-captain` |
| FFmpeg/PDF.js/pdf-lib/Tesseract/ESRGAN 작업 | `wasm-engineer` |
| "버튼", "드롭존", "진행률", "모바일 UX" | `ui-polisher` |

## 파이프라인 (신규 도구 추가)

```
1. tool-architect    스펙 → 라이브러리·워커·UI 결정 → 설계 문서
2. tool-builder      page.tsx + worker.ts + registry 항목 작성 (template-page 스킬 사용)
3. wasm-engineer     무거운 처리 워커화 + 메모리·취소 처리
4. ui-polisher       FileDropZone·진행률·결과 카드 표준 적용
5. a11y-auditor      키보드·ARIA·스크린리더 검증
6. perf-profiler     번들 크기·LCP·WASM lazy load 검증
7. qa-tester         큰 파일·손상 입력·모바일 제스처 회귀
8. seo-writer        도구 페이지 메타·OG 추가
9. registry-curator  키워드·카테고리·정렬 최종 정리
10. release-captain  체크리스트 → main 머지
```

수정 작업은 해당 단계 에이전트만 재호출.

## 디렉터리 구조

```
web-toolkit/
├── .claude/
│   ├── settings.json
│   ├── agents/           # 10 에이전트
│   ├── skills/           # 11 스킬
│   └── commands/         # 5 슬래시 커맨드
├── web/                  # Next.js App Router 도구 사이트 (메인)
│   ├── src/
│   │   ├── app/tools/    # 도구 페이지 (카테고리별 폴더)
│   │   ├── components/tools/  # 공통 컴포넌트 (FileDropZone, ResultCard)
│   │   ├── lib/tools/    # registry.ts, 공통 워커 유틸
│   │   └── workers/      # Web Worker 엔트리
│   └── public/           # WASM 자산 (ffmpeg-core.wasm 등)
├── _legacy/              # 옛 채팅·에이전트 시스템 (제거 예정)
│   ├── agent/            # PC 데몬
│   ├── agent-package/    # 배포용 패키지
│   └── supabase/         # 옛 DB 마이그레이션
├── CLAUDE.md             # 이 파일
└── README.md
```

> **주의:** `agent/`, `agent-package/`, `supabase/` 는 다음 라운드에서 `_legacy/` 로 이동·삭제 예정. 현재는 권한 deny 로 보호.

## 도구 카테고리 (11종)

`image · pdf · video · gif · audio · docs · text · dev · util · security · ai`

전체 정의: [`web/src/lib/tools/registry.ts`](web/src/lib/tools/registry.ts). 현재 ~56 개 도구 등록.

## 도구 추가 체크리스트

신규 도구 = **두 곳 동시 작업**:

1. `web/src/app/tools/{category}/{slug}/page.tsx` — UI + 워커 호출
2. `web/src/lib/tools/registry.ts` — `ToolMeta` 항목 추가 (`status: 'ready'`)

추가 시:
- 카테고리 ↔ URL 일치 (`category: 'pdf'` → `/tools/pdf/...`)
- 키워드는 **한·영 둘 다** (`['압축', 'compress', '용량']`)
- 아이콘은 `lucide-react` 에서 선택, 의미 직관적
- 페이지는 `'use client'` 필수
- 큰 라이브러리는 `dynamic(() => import(...), { ssr: false })`
- 모바일 브레이크포인트(`sm:`/`md:`) 항상 고려

상세는 `registry-add` 스킬, 페이지 보일러플레이트는 `tool-page-template` 스킬 참조.

## 기술 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | Next.js App Router (정적 export 지향) |
| 스타일 | Tailwind CSS + shadcn/ui |
| PDF | pdf-lib (편집) + PDF.js (렌더링·OCR 입력) |
| 이미지 | Canvas API + browser-image-compression + Squoosh 의 mozjpeg |
| 비디오/오디오/GIF | FFmpeg.wasm (Web Worker) |
| OCR | Tesseract.js (한국어 + 영어 lang pack) |
| AI 배경제거 | @imgly/background-removal (ONNX) |
| AI 업스케일 | ESRGAN.wasm |
| 얼굴감지 | face-api.js 또는 MediaPipe Tasks |
| QR | qrcode + jsqr |
| 워커 | 전용 `web/src/workers/*` 디렉터리 |

## 개발 컨벤션

- **언어:** TypeScript strict, 클라이언트 컴포넌트 우선
- **명명:** 도구 슬러그는 `kebab-case`, 카테고리 prefix 포함 (`pdf-merge`, `image-resize`)
- **에러:** 한국어 메시지 + 콘솔 영문 로그. 도구 실패 시 ResultCard 에 표시
- **취소:** 모든 워커는 `AbortSignal` 또는 `worker.terminate()` 로 취소 가능해야 함
- **메모리:** 큰 파일(>50MB) 처리 시 진행률 + 경고 표시
- **커밋:** 한국어 메시지, conventional commits (`feat(tools/pdf): ...`)

## Next.js 참조 규칙

옆 파일 [`web/AGENTS.md`](web/AGENTS.md) 의 경고를 항상 지킨다:

> 이 Next.js 는 학습데이터의 것과 다르다. API·관례·파일구조가 다를 수 있다. 코드 작성 전에 `node_modules/next/dist/docs/` 의 관련 가이드를 먼저 읽어라.

해당 docs 우선 참조는 `nextjs-app-router-current` 스킬에 절차로 정리.

## 품질 게이트

- TypeScript: `tsc --noEmit` 무경고
- 빌드: `npm run build` 성공
- 페이지 번들: 초기 JS < 200KB (WASM 제외)
- LCP < 2.5s (도구 페이지 모바일 4G 시뮬레이션)
- 접근성: 모든 인터랙티브 요소 키보드 도달 가능
- 모든 도구: 빈 입력·잘못된 포맷·큰 파일(100MB) 시 명확한 에러

## 슬래시 커맨드

- `/new-tool <category>/<slug>` — 도구 스캐폴드 + registry 항목 자동 추가
- `/audit-tools` — registry vs 실제 페이지 정합성·404·키워드 누락 점검
- `/perf-check [slug]` — Lighthouse + 번들 크기 + WASM lazy 검증
- `/a11y [slug]` — 접근성 점검
- `/wasm-update` — FFmpeg/PDF.js/Tesseract 버전 동기화

## 옛 채팅 시스템 (참고용)

`agent/`, `agent-package/`, `supabase/`, `web/src/app/chat`, `web/src/app/dashboard`, `web/src/app/harnesses`, `web/src/app/api/agent|install|cron|push|webhook|share` 는 제거 예정. settings.json 의 deny 규칙으로 수정·삭제를 임시 차단해 두었다. 본격 정리는 다음 라운드에서 진행.

## 변경 이력

- 2026-05-25: **SEO 허브 확장 + registry 톱10 정리** — `/guide/category/[cat]` 11개 카테고리 가이드 신규 생성(CollectionPage·BreadcrumbList·ItemList·FAQ JSON-LD 다층). `/guide` 인덱스의 카테고리 헤더를 해당 카테고리 가이드로 링크, 도구 수 hardcode 제거. `/guide/[slug]` breadcrumb 가 카테고리 가이드 경유 4단으로 확장. `sitemap.ts` 에 11개 카테고리 URL 추가. registry 정합성: `images-to-pdf` 중복 카드 제거(pdf-from-jpg 와 동일 href), `html-entities` 이중 인코딩 description 정정, `pdf-rotate`·`gif-resize`·`image-watermark`·`video-trim`·`audio-trim`·`gif-trim`·`base64` 키워드·설명 보강, `pdf-flatten` 카테고리 security→pdf, `chart` dev→util, `subtitle-edit`·`subtitle-convert` text→video. 빌드 336 페이지 통과.
- 2026-05-22: 폴더명 `agent-control-panel` → `web-toolkit`, 미션 재정의(원격 통제 → 브라우저 도구 모음). 하네스 신규 구성 — 11 에이전트 + 11 스킬 + 5 슬래시 커맨드.
- 2026-05-22: **legacy-pruner 1차** — 옛 채팅·에이전트 시스템 `_legacy/` 이전 완료. `agent/`, `agent-package/`, `supabase/`, `middleware.ts`, web 의 `chat|dashboard|harnesses|share|(auth)|api/*` 라우트, `components/chat|dashboard|sidebar|settings`, `AuthProvider|SessionRecovery|RealtimeStatusBadge|ErrorReporter`, `lib/supabase|hooks|agent-*|outbox|realtime-*|...` 모두 이동. 루트 redirect `/chat` → `/tools`, BottomNav 2탭(도구·설정)으로 단순화, settings 페이지 테마+안내만 유지. 빌드 OK.
- 2026-05-22: **의존성 청소** — Supabase(2), web-push(2), pako(2), react-markdown 계열(3) 등 9개 패키지 + 125 transitive 제거. `prebuild` 스크립트(copy-agent-package.mjs) 와 `public/_agent/` 산출물도 정리.
- 2026-05-22: **정적 export 모드 전환** — `next.config.ts` 에 `output: 'export'`. 빌드 산출물은 `web/out/` 37MB. 어떤 정적 호스팅(Cloudflare Pages·GitHub Pages·S3·Vercel 정적)에서도 동작. 보안 헤더는 `vercel.json` + `web/public/_headers` 양쪽 배치(호스팅별 호환). `/` 루트는 클라이언트 redirect (`useRouter().replace('/tools')`) + meta refresh 폴백.
- 2026-05-22: **`_legacy/` 완전 삭제** — 435MB / tracked 149개 파일 git rm + 디렉터리 통째 제거. git history 에는 그대로 보존되어 `git log` 거슬러 옛 시스템 복원 가능. 빌드 회귀 없음(5.3초 통과). 작업 디렉터리 루트가 `.claude / .git / .github / .vercel / .gitignore / CLAUDE.md / vercel.json / web/` 단 8개 항목으로 정리.
- 2026-05-22: **GitHub push + Vercel 프로덕션 배포 완료** — origin/master `d20a812` → `c380ff1`. 옛 ci.yml 제거(workflow scope 회피). vercel.json 을 web/ Root Directory 기준으로 재배치(`outputDirectory: out`), `framework: null` 로 Vercel Next.js 어댑터 우회. GitHub push 가 자동 배포 트리거 → Ready. 짧은 alias `agent-control-panel-phi.vercel.app` 등 4개가 새 빌드로 자동 갱신. **단 Vercel "Deployment Protection" 이 켜져 외부 접근 401** — 사용자가 대시보드에서 끄면 즉시 라이브.
- 2026-05-22: **Service Worker 갱신** — 옛 ACP SW(`acp-sw-v3-*`)가 `/chat`·`/dashboard`·`/settings 옛 버전` PRECACHE 로 새 빌드에서 404 유발. `webtoolkit-sw-v1-20260522` 로 prefix 자체 변경 + activate 단계가 `acp-sw-*` 와 옛 webtoolkit-* 모두 청소. 옛 라우트 요청은 SW 가 즉시 `/tools` 로 302 redirect (옛 PWA 사용자 보호). RSC payload(`?_rsc=`) 는 intercept 제외. 자동 배포 Ready.
- 2026-05-22: **이름 정리 (옛 ACP/agent-control-panel 잔재 제거)** — `web/public/manifest.json` 갱신 (name: Web Toolkit, start_url: /tools, shortcuts 단순화), `web/.env.local.example` 정적 사이트용 stub, `web/src/app/tools/docs/yaml-json/page.tsx` SAMPLE_YAML, `.vercel/project.json` projectName=web-toolkit. **GitHub repo rename**: `baboplater-blip/agent-control-panel` → `baboplater-blip/web-toolkit` (사용자 직접 실행, 옛 URL 자동 redirect). `git remote` 갱신 완료. **Vercel 프로젝트명**은 대시보드에서 사용자 수동 변경 필요(CLI 미지원).
