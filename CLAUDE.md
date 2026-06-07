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

- 2026-06-07: **zh 보조 SEO 표면 완성 — /zh/convert·compare·use (공유 Bi타입 zh 확장, 4개국어 완전체)** — 그동안 미구현이던 zh 변환·비교·활용법 완성(ja 미러). **공유 타입 확장**: `convert-matrix.ts`·`use-cases.ts` 의 `Lang`→`+'zh'`, `Bi{ko,en,ja}`→`{ko,en,ja,zh}`·`BiList`·use-cases `keywords` 동일(required). FORMATS **20개 포맷** summary/strengths/weaknesses + **28개 use-case**(h1·intro·steps·faq·keywords) 중국어 간체 번역. `pick(lang,ko,en,ja)`→`pick(…,zh)` 확장 후 **deriveChanges·buildConversionContent 의 22개 호출 전부 zh 인자 추가**, title/introTail/keywords zh 분기. **compare**: `zh-compares.ts`(25개, ja-compares 미러; COMPARE_SLUGS/헬퍼 재export, `getCompareZh`). **공유 뷰 4-way**: `ConvertPageView`·`CompareView`·`UseCaseView` 에 `lang==='zh'` 분기(경로 /zh/convert·compare·use, 라벨, inLanguage zh) — **ko/en/ja 동작 불변**. **페이지**: `/zh/convert/{slug}`(82)+인덱스·`/zh/compare/{slug}`(25)+인덱스·`/zh/use/{slug}`(28)+인덱스, locale zh_CN. hreflang **5-way**(ko·en·ja·zh·x-default): 기존 ko/en/ja convert·compare·use 18개 페이지 + sitemap 에 zh alternate 추가, zh 엔트리 신설. 페이지 2230→**2368**(+138). **회귀 0**(ko/en/ja 보존, use-cases `zh:`368=`ja:`368). **번들 예산 베이스라인 상향**(TOOL 365→385·HUB 360→380): CommandPalette·ToolConvertLinks(클라이언트, 전 페이지 마운트)가 다국어 데이터를 import 해 zh 본문이 공유 청크에 +약15KB(gzip) 유입 → **TODO(perf): 두 컴포넌트를 다국어 프로즈에서 분리 후 예산 원복**. tsc·build(2368)·budget·audit 통과.
- 2026-06-07: **UI/UX 발견성 대개편 — 250개 규모 탐색 편의 (슈퍼카테고리·홈검색·개인화·모바일 드로어·글로벌 단축키)** — 도구가 250개로 늘며 탐색·발견성 보강. **기반**: `lib/tools/super-categories.ts` 신설 — 11개 세부 카테고리를 5개 묶음(문서·PDF/미디어/개발·텍스트/유틸리티/보안·AI)으로 그룹핑하는 SSOT(세부 카테고리·URL·필터는 불변, 표시 레이어만 추가). `usage.ts`·`useUsage.ts` 에 즐겨찾기 순서 재정렬 API(`setFavorites`/`reorder`/`order`, 하위호환 유지). **① 홈 즉시 검색**(`components/home/HomeSearch.tsx`): 히어로에 실시간 퍼지검색(filterTools, 초성 포함)+자동완성 드롭다운(↑↓·Enter·Esc, 클릭→도구, Enter→/tools?q=). 기존 "도구 둘러보기" 버튼은 보조 링크로 강등. **② 홈 개인화**(`components/home/HomePersonalized.tsx`): 즐겨찾기·최근 가로 스크롤 위젯(클라이언트, 데이터 있을 때만 렌더→SSR 흔들림 0). **③ 홈/허브 슈퍼카테고리 그룹핑**: `page.tsx` 카테고리 섹션 + `tools/page.tsx` 브라우즈 뷰를 5개 묶음 헤더 아래로 재배치(가독성). **④ 즐겨찾기 드래그 재정렬**(`components/tools/ReorderableFavorites.tsx`): HTML5 drag 핸들(⋮⋮)로 순서 변경, `<a draggable={false}>`로 클릭 내비 보존, drop 시 영구 저장. **⑤ 모바일 카테고리 드로어**(`components/CategoryDrawer.tsx`): `webtoolkit:open-category-drawer` 이벤트로 열림, 슈퍼카테고리→세부 카테고리 칩(개수 배지). BottomNav 모바일 3탭→**4탭**(도구/카테고리/검색/설정), 데스크탑 레일에 분류 버튼+테마 토글 추가. **⑥ 글로벌 단축키 오버레이**(`components/ShortcutsOverlay.tsx`): 어느 페이지서나 `?`로 치트시트(다른 모달 열림 시 미가로챔). **⑦ 온보딩 힌트**(`components/OnboardingHint.tsx`): 첫 방문 1회 Ctrl+K 안내(localStorage 게이트, 1.5s 지연·7s 자동소멸). **⑧ 다크모드 접근성**: `ThemeToggle.tsx` 버그 수정 — 잘못된 키(`'theme'`)·system 미지원·리스너 미통지로 부팅 스크립트(`acp:theme`)와 불일치하던 것을 `theme.ts` 공식 API(라이트/다크/시스템 3모드+subscribeTheme)로 교체, 레일 토글과 동기화. **⑨ ToolNavigation 보강**: 대형 카테고리(유틸·문서 33개) 드롭다운에 카테고리 내 검색 필터 추가. tsc·build(2230)·budget(home 330·hub 357.6KB)·audit 전부 통과. (※ ToolNavigation 빠른전환·RelatedTools·ToolConvertLinks 는 이미 tools/layout.tsx 마운트 중이라 신설 아닌 보강.)
- 2026-06-07: **ja 보조 SEO 표면 — /ja/convert·compare·use (공유 Bi타입 ja 확장)** — 그동안 보류했던 ja 변환·비교·활용법 완성. **공유 타입 확장**: `convert-matrix.ts`·`use-cases.ts` 의 `Lang`→`'ko'|'en'|'ja'`, `Bi{ko,en}`→`{ko,en,ja}`·`BiList` 동일(required, 뷰는 `x.ja ?? x.en` 폴백). FORMATS 약 20개 포맷 summary/strengths/weaknesses + 28개 use-case(h1·intro·steps·faq) 일본어 번역. `deriveChanges`·`buildConversionContent` 에 `pick()` 3분기. **compare**: `ja-compares.ts`(25개, en-compares 미러; slugs/헬퍼 재export). **공유 뷰 3-way**: `ConvertPageView`·`CompareView`·`UseCaseView` 에 `lang==='ja'` 분기(경로 /ja/convert·compare·use, 라벨, inLanguage) — **ko/en 동작 불변**. **페이지**: `/ja/convert/{slug}`(82)+인덱스·`/ja/compare/{slug}`(25)+인덱스·`/ja/use/{slug}`(28)+인덱스. hreflang 4-way(ko·en·ja·x-default), ko·en 해당 페이지에 ja alternate, sitemap 갱신. 페이지 2089→**2227**(+138). **ko/en 회귀 0**(ko/convert 82·en/convert 82·ko/compare 25·ko/use 28 유지). tsc·build·budget·audit 통과.
- 2026-06-07: **중국어 간체(zh) 표면 — ja 미러 (다국어 3개국→4개국)** — ja 표면을 그대로 미러해 `/zh` 신설. `lib/zh-tools.ts`(**194 도구**=en/ja 패리티, 병렬 번역 후 생성)+`guide-content-zh.ts`+`category-guide-content-zh.ts`(11)+`components/zh/ZhToolsCatalog.tsx`+`/zh` 랜딩·`/zh/tools`·`/zh/tools/{slug}`·`/zh/guide`·`/zh/guide/{slug}`·`/zh/guide/category/{cat}`. **hreflang 4개국(ko·en·ja·zh) 상호연결**: `generate-tool-metadata.mjs` 에 zh alternate 추가(ko layout 재생성), en·ja 도구·가이드·카테고리 페이지에 조건부 zh 추가, sitemap zh 엔트리(허브3+카테고리11+도구/가이드 388). JSON-LD inLanguage zh·OG locale zh_CN·Offer CNY. zh 402 라우트(194+194+11+3). 페이지 1687→**2089**. tsc·build·budget·audit 통과. 검증: zh 페이지 5-way hreflang, ko 페이지에 zh alternate 출력. **확장법**: zh-tools.ts 항목 추가→자동. (※ ja·zh 모두 convert/compare/use 보조표면은 미구현 — 공유 Bi타입 확장 필요.)
- 2026-06-07: **신규 도구 44종 일괄 추가 (206→250) — 8개 팩 (2차)** — create-tool CLI 일괄 스캐폴드 후 8 번들 병렬 구현. **① 개발자II 6**: json-diff(구조 비교)·box-shadow·cubic-bezier(이징)·mock-data(더미 생성)·svg-optimize·gitignore. **② 이미지 필터 6**: filters(인스타 풍)·duotone·avatar(원형 크롭)·target-size(목표 용량)·color-picker(이미지 색 픽)·gradient(PNG). **③ 재미·텍스트 6**: morse(+AudioContext 비프)·binary·fancy(유니코드 폰트)·caesar/ROT13·nato·tts(speechSynthesis). **④ 변환·데이터 5**: toml-json·ini-json·csv-to-md·markdown-preview(자체 렌더러·XSS 가드)·json-escape. **⑤ 생활·계산II 6**: timezone(Intl)·tdee(Mifflin-St Jeor)·number-to-words(영/한)·discount·date-diff·gpa. **⑥ 비디오II 5**(FFmpeg/MediaRecorder): reverse·loop(-stream_loop)·resize·webcam·flip. **⑦ 측정·재미 5**: typing-speed(WPM)·reaction-time·color-blind(색각 행렬)·screen-ruler(PPI)·qr-logo(qrcode+로고). **⑧ 보안·경량AI 5**: htpasswd(SHA+APR1-MD5 자체구현, openssl 교차검증)·secret-split(Shamir GF(256))·summarize(추출 요약)·language-detect(스크립트+n-gram)·sentiment(사전 기반). 전부 browser-only·한국어 UI·EN 카피 동시. 페이지 1511→**1687**(+176). tsc·build·budget 통과, 신규파일 eslint 정리(unused·unescaped·inline-hook).
- 2026-06-07: **일본어(ja) 표면 1차 — en 아키텍처 미러 (Phase γ 다국어 ja)** — 로드맵의 EN→ja 순차 확장. en 표면을 그대로 미러해 **/ja 도구·가이드 표면** 신설(convert/compare/use 는 en 처럼 후속 라운드로 분리). ① **데이터** `lib/ja-tools.ts`(`JaToolCopy`=en 동일 구조, **44개 국제 검색의도 도구** 일본어 카피: PDF 9·이미지 9·비디오 7·오디오 3·gif 1·util/dev/security 15. name/tagline/description/keywords 일본어+로마자, registry id 정합) + `JA_TOOL_IDS`/`getJaCopy`/`hasJaCopy`. ② **가이드** `lib/guide-content-ja.ts`(`buildGuideJa` — guide-content-en 패턴 분기 미러, `getPattern`/`GuidePattern` ko 빌더 공유). ③ **페이지**(en 복제→ja 치환): `/ja`(랜딩)·`/ja/tools`(카탈로그, `components/ja/JaToolsCatalog.tsx` 검색+필터)·`/ja/tools/{slug}`(트랜잭셔널, WebApplication+Breadcrumb JSON-LD, locale ja_JP)·`/ja/guide`(인덱스)·`/ja/guide/{slug}`(how-to, TechArticle+FAQ). ja 엔 compare/convert 섹션 제거(데이터 없음). ④ **hreflang 3개국 상호연결**: ko·en·ja 페이지 alternates.languages 모두 `ko-KR`·`en`·`ja`·`x-default`(ja 카피 보유 시만 ja 링크). `generate-tool-metadata.mjs` 를 `parseCopyToolIds` 로 일반화해 ko layout 에 ja alternate 추가(172 layout 재생성), en 도구·가이드 페이지에 조건부 ja 추가. ⑤ **sitemap**: /ja tool·guide 엔트리 + 허브 3개 + 기존 ko·en alternates 에 ja 추가(/ja URL 90건). 페이지 1109→**1200**(+91: 44 tools+44 guides+3 허브). tsc·build(1200)·budget 게이트 통과. 검증: ja 페이지 canonical=/ja·4-way hreflang, ko/en 페이지에 ja alternate 출력 확인. **확장법**: ja-tools.ts 에 항목 추가 → 페이지·sitemap·hreflang 자동. **다음**: ja 확대(44→전체)·/ja/convert·compare·use, 이후 zh.
- 2026-06-07: **Phase δ 관측·품질 — 에러추적 + 번들 예산 게이트 + registry 2차 정합성** — ① **클라이언트 에러추적**(무PII, 무서버): `lib/error-tracking.ts`(`window.onerror`+`unhandledrejection`→localStorage 롤링 40 시그니처, dedupe+count. **redaction**: 이메일·blob/data URL·쿼리스트링·6자리+숫자 제거, 메시지 200자 컷, 소스는 basename만, 사용자 입력·파일내용 미저장. `Script error.`·ResizeObserver 루프 등 노이즈 무시). `components/ErrorTracker.tsx`(layout 마운트, WebVitalsTracker 옆) + `/admin` `ErrorStats` 패널(시그니처·횟수·경과시간·경로, CwvStats 패턴 미러). ② **번들 예산 게이트**(머지 전, 서버 불필요): `scripts/check-bundle-budget.mjs` 가 정적 `out/` 대표 10페이지의 `<script src>` First-Load JS 를 gzip 합산해 예산과 대조(도구 365KB·허브 360KB, 2026-06-07 베이스라인 +8% 회귀 가드). `npm run budget` + CI `budget` 잡(build 산출 `out` 아티팩트 재사용) 신설 — 라이트하우스 나이틀리(배포 후 라이브)와 달리 무거운 의존성이 공유 청크에 들어오는 회귀를 **사전 차단**. 현재 home/guide 301·hub 330·도구 323~334KB 전부 통과. ③ **registry 2차 정합성**: 키워드 <5 인 44개 도구(pdf-merge·image-resize·qr-code 등 고트래픽 코어 포함)를 각 6~8개로 보강(한/영 검색어, 기존 유지+추가). 전 206 도구 keywords ≥5 달성(분포 5:31·6:50·7:49·8:63·9+:13). tsc·build(1109)·budget 통과.
- 2026-06-07: **신규 도구 38종 일괄 추가 (168→206) — 8개 팩** — create-tool CLI(`--spec`)로 38개를 일괄 스캐폴드한 뒤 8개 번들을 **병렬 서브에이전트**로 실로직 구현(각 page만 수정, registry/en 충돌 0). **① 개발자 5**: base-converter(진수,BigInt)·json-to-ts(타입추론)·color-contrast(WCAG AA/AAA)·css-gradient(생성기)·html-format(미화/압축). **② 이미지 6**: favicon(ICO 패커 `lib/tools/favicon-ico.ts`)·meme(Impact)·flip·split(그리드 zip)·image-base64(↔Data URI)·round-corners(투명PNG). **③ 비디오 5**(FFmpeg.wasm): crop·speed(setpts+atempo)·mute(-an)·watermark(overlay)·screen-record(getDisplayMedia+MediaRecorder). **④ 텍스트 5**: dedupe-lines·whitespace·slugify(한글 로마자 음역)·word-frequency·column-extract. **⑤ 생활·계산 5**: bmi·loan(원리금균등)·aspect-ratio·pomodoro(Notification+beep)·roman-numeral. **⑥ 보안 4**: text-hash(MD5 자체구현+SHA WebCrypto)·password-strength(엔트로피)·diceware(290단어+거부표집)·jwt-encoder(HS256 HMAC). **⑦ 문서·데이터 4**: xml-format(DOMParser)·csv-viewer(RFC4180+정렬/검색)·ical(.ics line-folding)·vcard-parse(.vcf→CSV). **⑧ 오디오 4**: audio-reverse·audio-normalize(loudnorm)·tone(OfflineAudioContext+WAV 인코더)·mic-record(getUserMedia). 전부 browser-only·한국어 UI·각 EN 카피 동시 등록. 페이지 960→**1109**(+149: 도구+가이드 ko/en). tsc·build(1109) 통과, 신규파일 eslint 정리(set-state-in-effect·unescaped-entities). 가이드·HowTo·layout 메타는 prebuild 자동 생성, 도구 OG는 카테고리 공용 재사용.
- 2026-06-07: **create-tool CLI — 도구 1폴더 자동 스캐폴딩 (Phase ε 1차)** — `scripts/create-tool.mjs` 신규. 한 번 실행으로 ① `app/tools/{route}/page.tsx`(5 아키타입: **calc·text·generator·file·viewer**), ② `workers/{id}.worker.ts`(`--worker`), ③ `registry.ts` ToolMeta 항목 + lucide 아이콘 import 자동 삽입(별칭 인지·중복 skip), ④ `en-tools.ts` EnToolCopy(`--en`)를 생성. 가이드(/guide·/en/guide)·HowTo JSON-LD·OG 는 기존 prebuild(generate-tool-metadata)+`og:gen` 이 registry/데이터에서 자동 파생하므로 추가 작업 불필요. **단일**(`--id --route --category --title --desc --icon --keywords --archetype [--worker] [--en ...]`) / **배치**(`--spec tools.json` 객체·배열, `--spec -` stdin) / `--dry` / `--force`. 자동 검증: 카테고리·id형식·아이콘 PascalCase·id충돌(registry grep)·route 디렉터리 존재. registry 삽입은 `export const TOOLS` 이후 첫 `^];` 앞, EN 은 `export const EN_TOOLS` 이후 첫 `^};` 앞에 정규식 삽입(AST 불요). `npm run tool:new` 스크립트 + `/new-tool` 커맨드를 CLI 경유로 갱신. **검증**: 6개(아키타입 5종+worker) 일괄 생성 → tsc·eslint 0경고 통과 후 전부 revert. 앱 코드 무영향(스캐폴더는 빌드 비의존).
- 2026-06-05: **사이트맵 우선순위·changefreq·lastmod 정교화 (Phase γ 10차)** — 평면 신호를 의미 기반으로 교체. ① **카테고리 인지 priority**: 변환·비교·활용법 페이지가 쓰던 평면값(0.67~0.72)을 `progPriority(cat)`(=0.45+카테고리가중×0.33, en −0.02)로 교체 → pdf/image≈0.75, video≈0.73, audio/docs≈0.72, gif/util≈0.68. 변환은 `conversionCategory`, 비교는 `getCompare().category`, 활용법은 `getUseCase().category`로 카테고리 산출(활용법은 작업의도 가치로 +0.02 가중). ② **lastModified 정확화**: 전 URL에 빌드시각(now)을 박던 것을 → 도구는 `addedAt`(없으면 SITE_BASELINE 2026-05-01), 에버그린 콘텐츠(변환·비교·활용법·카테고리 가이드)는 `CONTENT_REVISION`(2026-06-05), 허브/색인만 now. "매 배포마다 전부 변경" 노이즈 제거(lastmod 4개 날짜로 분화: 552·54·42·305). ③ **changefreq**: 최근 추가(addedAt 60일 이내)거나 phase≥5 도구는 weekly, settings는 yearly(monthly 720·weekly 232·yearly 1). 부동소수 반올림 정리. tsc·build(960·953 URL)·정적 e2e(admin 제외 46/46) 통과. **확장법**: 콘텐츠 대규모 개정 시 `CONTENT_REVISION` 갱신.
- 2026-06-05: **OG 이미지 자동화 — 변환·비교·활용법 페이지별 OG (Phase γ 9차)** — 변환·비교·활용법 페이지가 카테고리 공용 OG(`/og/{cat}.png`)를 쓰던 것을 **페이지별 고유 OG**로 교체(SNS 공유 CTR↑). `generate-og-images.mjs` 확장: 데이터 모듈(.ts)을 정규식 파싱(별칭·React 의존 회피)해 ① **변환 82장**(`/og/convert/{slug}.png`, 언어 중립 "FROM → TO" + 카테고리 색/배지), ② **비교 50장**(`/og/compare/{slug}.png` + `.en.png`, ko/en h1), ③ **활용법 56장**(`/og/use/{slug}.png` + `.en.png`, ko/en h1) = **188장** 신규. EN 이미지엔 영문 카테고리 배지·태그라인(`buildSvg` tagline 파라미터·CATEGORY_LABEL_EN 추가). 6개 라우트 generateMetadata(og:image·twitter:image)를 페이지별 경로로 교체(convert ko/en 공용, compare·use는 ko=.png·en=.en.png). resvg 시스템폰트로 한글 렌더 확인. 빌드 산출 검증: out/og/convert·compare·use 188장 + 메타 참조 정확. 새 플래그 `--no-pages`·`--pages-only`. tsc·build(960)·정적 e2e(admin 제외 46/46) 통과. ※ OG는 로컬 1회 생성 후 커밋(빌드 의존성 없음) — 변환/비교/활용법 추가 시 `npm run og:gen` 재실행.
- 2026-06-05: **내부 링크 그래프 강화 — 4축 양방향 완성 (Phase γ 8차)** — 도구·변환·비교·활용법 4축 사이의 빠진 역링크를 채워 그래프를 완전 양방향화. 신규 헬퍼: `useCasesForConvert`·`useCasesForCompare`(use-cases.ts), `relatedCompares`(en-compares.ts, 같은 카테고리 우선·부족 시 타 카테고리 보충). ① **도구→비교**: `ToolConvertLinks`에 `comparesForTool`(ko 라벨=getCompareKo) 칩 "관련 비교" 추가(이미지 변환 도구→6개 비교 등). ② **변환→활용법**: `ConvertPageView`에 `relatedUses` 섹션("이 변환을 쓰는 활용법"/"How-tos that use this") — ko/en 라우트가 useCasesForConvert로 주입. ③ **비교→활용법**: `CompareView`에 `relatedUses` 섹션("관련 활용법"/"Related how-tos") — ko/en 라우트가 useCasesForCompare로 주입. ④ **비교→비교 연관성 개선**: 기존 "선두 4개" 대신 `relatedCompares`(같은 카테고리 우선)로 교체(ko/en). 닫힌 그래프: tools↔converts↔compares↔use-cases + converts↔converts + compares↔compares + use↔use 전부 양방향. 페이지 960 유지(링크만 추가). tsc·build(960)·정적 e2e(admin 제외 46/46) 통과. 검증: convert/mp4-to-gif→use 2건, compare/gif-vs-mp4→use 2건, tools/image/convert→compare 6건, compare/webp-vs-avif→동일 카테고리 비교.
- 2026-06-05: **가이드 패턴 정교화 — calc·viewer 패턴 신설 (ko·en 동시)** — 계산기·변환기·뷰어가 'text' 패턴으로 분류돼 "텍스트를 붙여넣으세요"·"결과 다운로드" 같은 부적합 문안이 나오던 문제 해결. `guide-content.ts` `GuidePattern`에 **`'calc'`(입력형 계산기·변환기)·`'viewer'`(읽기 전용 뷰어)** 추가. `getPattern`에 CALC_KEYS(age-calc·dday·timer-stopwatch·percentage·unit-converter·color-converter·timestamp-converter·vat-calc·salary/severance/leave-calc)·VIEWER_KEYS(epub-reader·image-exif-view·hwpx-viewer·pdf-bookmarks·pdf-stats·epub-stats) 분기 추가, calc류는 TEXT_ANALYSIS_KEYS에서 이동. ko 빌더(buildFeatures/Steps/Faqs)에 calc("값 입력→실시간 계산→복사")·viewer("파일 열기→내용 보기→필요 시 내보내기") 분기 추가, **EN 빌더(`guide-content-en.ts`)에도 동일 분기**("Enter your values…"·"Browse the contents…"). HowTo JSON-LD 생성기(`generate-tool-metadata.mjs`)에도 CALC_IDS·VIEWER_IDS 분기 추가(구조화 데이터 일치) → 134 layout 재생성. 결과: dday·age-calc·epub-reader 등 ko·en 가이드가 도구 성격에 맞는 문안으로 교정(한국 전용 salary-calc 등은 ko 가이드만 개선). 페이지 수 960 유지(콘텐츠만 정교화). tsc·build(960)·정적 e2e(admin 제외 46/46) 통과.
- 2026-06-05: **EN 활용법·비교 확대 — 비교 9 + 활용법 8 (Phase γ 7차)** — /use·/compare는 이미 ko·en 양면 데이터 구조라 항목 추가 시 양 언어 동시 증가. ① **비교 9종**(16→25, ko/en 동시): webp-vs-avif·svg-vs-png·flac-vs-mp3·m4a-vs-mp3·mkv-vs-mp4·gif-vs-mp4·yaml-vs-json·markdown-vs-html·xlsx-vs-csv — 각 relatedConverts 양방향(webp-to-avif·svg-to-png·flac-to-mp3·mkv-to-mp4·mp4-to-gif·yaml-to-json·md-to-html·csv-to-xlsx 등). ② **활용법 8종**(20→28, ko/en 동시): anonymize-video-before-posting·make-meme-gif-with-caption·split-pdf-into-chapters·clean-up-podcast-audio·convert-spreadsheet-formats·fix-and-convert-subtitles·make-animated-sticker·extract-images-from-documents — 각 2~3 단계 실존 도구(video-blur-face·gif-text·audio-silence-trim·xlsx-convert·subtitle-edit/convert·pdf-image-extract 등) + relatedConverts/relatedCompares 교차링크(신규 gif-vs-mp4·xlsx-vs-csv 비교로 연결). 모든 CTA 빌드 출력에서 실존 확인(죽은 링크 0). 926→**960 페이지**(+34). tsc·build(960)·정적 e2e(admin 제외 46/46, hub 검색 1건 풀스위트 플레이키→단독 통과) 통과.
- 2026-06-05: **다국어 확장 — 전 도구 영문화 (EN 커버리지 66→156)** — 영어권 검색의도 있는 모든 도구를 EN화. `lib/en-tools.ts`에 **90종 영문 카피 추가**(name/tagline/description/keywords): PDF 25(pdf-sign·pdf-organize·pdf-rotate·pdf-to-html/epub/md/txt·pdf-form-fill·pdf-stats 등), 이미지 13(blur-face·compress·image-collage·exif 3종·color-adjust 등), GIF 6, 오디오 7(trim·merge·speed·volume·fade 등), 비디오 9(trim·compress·merge·rotate·blur-face·burn-subtitle 등), EPUB 15(reader·metadata·split·merge·cover·to-html/md/txt·md-to-epub·txt-to-epub 등), 문서·데이터 9(chart·xlsx-convert·md-html·markdown-toc·subtitle-convert/edit 등), 유틸 6(age-calc·dday·timer·random-pick·url-parser·text-replace). **한국어 전용 12종 의도적 제외**(hanja·ko-spacing·ko-spellcheck·ko-sort·jamo·keyboard-flip·syllable-spread·manuscript-count·hwpx-viewer·salary/severance/leave-calc — 영어권 검색의도 없음). 각 도구 `/en/tools/{id}`(트랜잭셔널)+`/en/guide/{id}`(how-to) 자동 생성: 66→**156**씩. **hreflang 정합성 수정**: `generate-tool-metadata.mjs`가 ko 도구 layout의 영어 alternate를 EN 카피 보유 시 개별 페이지(`/en/tools/{id}`)로, 미보유 시 카탈로그(`/en/tools`)로 분기(기존엔 전부 카탈로그로 잘못 연결) → 134 layout 재생성, ko↔en 양방향 hreflang 정합. 743→**923 페이지**(+180), sitemap 739→919 URL. tsc·build(926)·정적 e2e(admin 제외 46/46, hub 검색 1건 풀스위트 플레이키였으나 단독 재실행 통과) 통과. **확장법**: en-tools.ts에 항목 추가→페이지·sitemap·카탈로그·hreflang 자동.
- 2026-06-05: **콘텐츠 추가 확장 2차 — 변환 15 + 활용법 6 + 비교 4 (Phase γ 6차)** — 기존 엔진에 데이터만 추가, 696→**743 페이지**(+47, html 기준). 모든 링크 실존 도구 빌드 출력에서 확인(죽은 링크 0). ① **변환 15쌍**(67→82): 이미지 gif-to-avif·bmp-to-avif / 오디오 ogg-to-wav·mp3-to-aac / 스프레드시트·데이터 csv-to-xlsx·xlsx-to-csv·xlsx-to-json·json-to-xlsx·json-to-xml·xml-to-json·json-to-yaml / 문서 pdf-to-html·pdf-to-epub·epub-to-html·pdf-to-xlsx. 신규 포맷 **xlsx·xml**. CTA: xlsx-convert·json-xml·yaml-json·pdf-to-html·pdf-to-epub·epub-to-html·pdf-to-excel. ② **활용법 6종**(14→20): photos-into-one-pdf·password-protect-pdf·iphone-photos-for-windows·compress-video-for-upload·read-pdf-on-ereader·pdf-table-to-spreadsheet — 각 2~3 단계 실존 도구 + relatedConverts/relatedCompares 교차링크. ③ **비교 4종**(12→16, ko/en): csv-vs-json·mp4-vs-mov·docx-vs-pdf·aac-vs-mp3(+relatedConverts 양방향). tsc·build(743 html)·e2e(정적 admin 제외 **46/46**) 통과. 사이트맵 689→**739 URL**(+50).
- 2026-06-05: **콘텐츠 추가 확장 — 변환 18 + 활용법 6 + 비교 4 (Phase γ 5차)** — 기존 엔진에 데이터 추가, 640→**696 페이지**(+56). 모든 링크 실존 도구 확인(죽은 링크 0). ① **변환 18쌍**(49→67): 이미지 webp-to-avif·avif-to-webp·gif-to-webp·bmp-to-webp / 오디오 wav-to-m4a·flac-to-aac·aac-to-wav·ogg-to-m4a / 비디오 flv-to-mp4·wmv-to-mp4·mkv-to-mov·mkv-to-webm / 문서 pdf-to-word·pdf-to-txt·pdf-to-md·epub-to-txt·epub-to-md·txt-to-epub. 신규 포맷 word·flv·wmv. ② **활용법 6종**(8→14): 영상→오디오 추출·영상 자막 굽기·이미지 OCR·배경 제거·텍스트→전자책·사진 워터마크. ③ **비교 4종**(8→12, ko/en): mp4-vs-webm·mp3-vs-wav·jpg-vs-webp·epub-vs-pdf(+relatedConverts). 활용법 make-ebook→비교 epub-vs-pdf 교차링크 유효화. tsc·build(696)·e2e(정적 admin 제외 46/46) 통과.
- 2026-06-05: **SEO 색인 가속 — IndexNow 키 셋업** — 핑 스크립트(`ping-indexnow.mjs`)는 라이브 sitemap에서 URL을 동적으로 읽으므로 신규 127페이지가 자동 포함됨(라이브 sitemap 633 URL 확인). 워크플로 `seo-ping.yml`은 master 푸시 90초 후 자동 핑. **공백이던 IndexNow 키 검증 파일 추가**: `web/public/8691546e332ad3494e0a23d25fd2bade.txt`(정적 export로 사이트 루트에 배포). **사용자 액션 필요**: GitHub repo Secret `INDEXNOW_KEY` 를 `8691546e332ad3494e0a23d25fd2bade` 로 설정해야 핑이 403 없이 동작(키 파일과 시크릿 값 일치 = 사이트 소유 증명). 설정 후 배포/`workflow_dispatch` 시 Bing·Yandex 등에 633 URL 일괄 통보. (Google은 IndexNow 미사용 — sitemap 기반 자동 크롤.)
- 2026-06-05: **발견성 마무리 — 명령 팔레트 버킷 + 카테고리 허브 리치화 (Phase β 완료)** — SEO 콘텐츠(변환·비교·활용법 127페이지)를 사용자에게도 노출. ① **명령 팔레트(⌘K)**: 항목을 `PaletteItem`으로 일반화해 검색 시 **도구·변환·비교·활용법 4버킷** 노출(변환/비교/활용법은 모듈 데이터에서 정적 인덱싱, 부분일치+초성 매칭). 빈 상태엔 **바로가기** 섹션(/convert·/compare·/use). ② **카테고리 가이드**(이미 CollectionPage): 카테고리별 "빠른 변환"·"활용법" 칩 섹션 추가(`conversionCategory`/`USE_CASES` 필터). ③ **도구→활용법 역링크**는 직전 라운드에서 완료. 신규 e2e `command-palette.spec.ts`(Ctrl+K·버킷·초성) 3종. tsc·build(640)·e2e(정적 admin 제외 **46/46**, 신규 팔레트 3 포함) 통과. ※ dev서버 e2e는 on-demand 컴파일 플레이키 → 정적 out/ 서빙(`serve`)으로 검증.
- 2026-06-05: **유스케이스(활용법) 페이지 — 작업 의도 SEO + 온보딩 (Phase γ 4차)** — "이력서 사진 만들기"·"단체사진 얼굴 모자이크"처럼 "무엇을 하려는가"로 검색하는 의도를 잡는 단계별 가이드. `use-cases.ts`: 8개 유스케이스(ko/en) — resume-id-photo·blur-group-photo-faces·scan-paper-to-pdf·shrink-pdf-for-email·optimize-photo-for-web·make-gif-from-video·sign-and-stamp-contract·redact-before-sharing. 각 유스케이스는 실제 도구를 단계로 묶고(모든 step.href 실존 도구), 관련 변환·비교로 연결되는 **링크 허브**. 공용 `UseCaseView.tsx`(**HowTo 스키마**=단계, FAQPage+Breadcrumb). KO/EN 라우트 `/use/{slug}`+인덱스, hreflang ko↔en. **도구→활용법 역링크**: `ToolConvertLinks`에 `useCasesForHref` 추가 → 전 도구 페이지에 "이 도구를 쓰는 활용법" 칩(이제 그래프가 도구↔변환↔비교↔활용법 4방향). sitemap+허브 링크. 622→**640 페이지**(+18). tsc·build(640)·e2e(정적 admin 제외 43/43) 통과.
- 2026-06-05: **비교 페이지 한글화 + 비교↔변환 상호링크 (Phase γ 3차)** — 기존 8개 EN-only 비교를 ko/en 양쪽으로. `ko-compares.ts`: 8개 비교 한글 번역(merge-vs-split-pdf·heic-vs-jpg·png-vs-jpg·webp-vs-png·jpg-to-pdf-vs-pdf-to-jpg·compress-vs-resize-image·md5-vs-sha256·base64-vs-url-encoding). 공용 `components/CompareView.tsx`(ko/en, Article+Breadcrumb+FAQPage JSON-LD)로 EN 페이지도 전환 → 양 언어 동기화. KO 라우트 `/compare/{slug}`+인덱스, EN 라우트엔 ko hreflang 추가(canonical 보존). **비교↔변환 양방향 상호링크**: 비교 페이지에 관련 변환 칩(relatedConverts: heic-vs-jpg→heic-to-jpg 등 4개 비교에 연결), 변환 페이지엔 `compareForConvert`로 역링크(/convert/png-to-jpg→/compare/png-vs-jpg). sitemap에 ko 비교+hreflang, 허브에 비교 링크. 613→**622 페이지**(+9). tsc·build(622)·e2e(정적 admin 제외 43/43, EN 비교 CompareView 전환 회귀 없음) 통과.
- 2026-06-05: **변환 매트릭스 확장 — 오디오·비디오·문서 + 도구↔변환 양방향 교차링크 (Phase γ 2차)** — 변환쌍 21→**49**, 페이지 557→**613**(+56). `convert-matrix.ts`에 포맷 18종 추가(오디오 mp3·wav·m4a·aac·ogg·flac / 비디오 mp4·webm·mov·avi·mkv / 문서 docx·md·html·csv·json·yaml·txt·epub) — 각 ko/en 사실 동봉. 신규 변환: 오디오 10(m4a→mp3 등, audio-convert ?to=), mp4→mp3(audio-from-video, "오디오 트랙만 추출" 자동 설명), 비디오 6(mov/mkv/avi/webm→mp4 등, video-convert ?to=), 영상→GIF 2(video-to-gif), 문서 9(docx→pdf·md→html·html→pdf·epub→pdf·md→epub·csv↔json·yaml→json). `conversionCategory()` 신설(video>audio>pdf>docs>image)로 OG·인덱스 그룹 분류, 인덱스 페이지 5그룹 동적화. `deriveChanges`에 kind별 항목 추가(영상→오디오 추출, 영상→GIF 무음, 문서→PDF 레이아웃 고정). **도구→변환 역링크**: `ToolConvertLinks`(pathname→tool.id→convertsForTool) 공통 `tools/layout.tsx`에 1회 주입 → 전 도구 페이지에 "이 도구로 가능한 변환" 칩 자동 노출(내부 링크 그래프 양방향화). audio/video convert 도구에 ?to= 프리필 useEffect. sitemap+허브 링크 갱신. tsc·build(613)·e2e(정적빌드 기준 admin 제외 43/43, 18/18 통과; dev서버 실행은 on-demand 컴파일 플레이키라 정적 out/ 서빙으로 검증).
- 2026-06-05: **변환 매트릭스 — 프로그래매틱 SEO 엔진 (마스터플랜 Phase γ 1차)** — "png to jpg"·"heic to jpg" 류 고볼륨 롱테일 변환 검색어를 잡는 페이지 자동 생성. `lib/convert-matrix.ts`: 9개 포맷(jpg·png·webp·avif·gif·bmp·heic·svg·pdf)의 풍부한 사실(ko/en summary·strengths·weaknesses·lossy/투명/애니/벡터/용량/호환)을 **조합해 페이지마다 고유 본문·"무엇이 바뀌나"·FAQ 생성**(얇은 양산 페이지 금지). 21개 변환쌍, 각 CTA는 **실제 동작 도구**로 연결(image-convert·heic-to-jpg·svg-to-png·pdf-to-jpg·pdf-from-jpg, 죽은 링크 0). 라우트: `/convert/{slug}`(ko)·`/en/convert/{slug}`(en) + 인덱스 2종 — 공용 뷰 `components/ConvertPageView.tsx`(HowTo+FAQPage+Breadcrumb JSON-LD, hreflang ko↔en). `image-convert`에 `?to=` 프리필 useEffect 추가(변환 페이지→도구 딥링크 시 목표 포맷 자동 선택). `sitemap.ts`에 convert URL+hreflang 등록, `/tools` 허브에 진입 링크 추가. **513→557 페이지(+44)**. tsc·build(557)·e2e(45 pass; admin 5건은 로컬 ADMIN_KEY env 미설정 사전 실패, 무관) 통과.
- 2026-06-05: **퍼지 검색 엔진 — 명령 팔레트·허브 동시 개선 (마스터플랜 Phase β 1차)** — `lib/tools/search.ts` 신규: 의존성 없는 경량 랭커. ① **다중 토큰 AND**(공백 분리, 모두 매칭). ② **필드 가중**(제목1.0 > 키워드0.85 > 설명0.5). ③ **매칭 등급**(완전100·접두90·단어경계80·부분62·서브시퀀스≤46). ④ **한글 초성 검색** `toChoseong`("ㅇㄱㅁㅈㅇㅋ"→얼굴 모자이크). `filterTools`(registry.ts)를 랭커로 교체 — `CommandPalette`·`/tools` 허브 검색 **둘 다** 자동 개선(빈 쿼리는 기존 ready→phase 정렬 유지). 순환의존 회피 위해 search.ts는 ToolMeta를 type-only import. 단위테스트 `search.test.ts` 15케이스(초성·오타·랭킹·통합). tsc·build(513)·hub e2e(4/4)·vitest(15/15) 통과. 계획서: `docs/마스터플랜.html`.
- 2026-06-01: **얼굴 가림 미세조정 4종** — ① **커버 여백 확대**: detectAllFaces 패딩 좌우 0.16·상 0.2·하 0.3(턱 방향↑)로 이마·턱·귀까지 확실히 가림, NMS 0.35→0.45(인접 얼굴 병합 방지). ② **YuNet 입력 적응형**: 긴 변 1800px 초과 시 입력 768→1024(작은 얼굴 회수율↑). ③ **경계 페더링**: `cover.ts` paintFeathered — 오프스크린에 가림 그린 뒤 방사형 알파 마스크로 가장자리 부드럽게(blur·pixelate·solid, coverOpts.feather=true). 큰 패딩과 함께 실제 얼굴은 불투명 중심·여백은 배경이라 자연스럽게. ④ **일괄 속도 최적화**: 2200px 초과 이미지는 감지용 detImg 1회 축소 후 모든 감지 패스 재사용(가림은 원본 해상도 — 화질 손실 없음). tsc·build(513)·e2e 통과.
- 2026-06-01: **피부톤 오검출 컷** — TV·벽·뒤통수 등 비얼굴 오검출 감소. `regionSkin`: 박스를 16×16로 샘플링해 YCbCr 피부색 비율 추정. `detectAllFaces` NMS 뒤에서 "색은 있는데(colorful≥0.25) 피부색이 거의 없고(skin<0.12) 고신뢰 아님(score<0.9)"인 박스 제거. **흑백 영역·고신뢰는 보존**해 진짜 얼굴 손실 최소화, YCbCr 범위는 다양한 피부톤 포용하도록 넉넉히. **한계**: 손은 피부색이라 색만으론 못 거름. tsc·build(513)·e2e 통과.
- 2026-06-01: **폴더 모드 샘플 미리보기** — 폴더 일괄 처리 시 강도·스타일을 미리 가늠할 수 있도록 첫 이미지를 감지·미리보기. `folderSample` 상태 + 별도 캔버스(`samplePreviewRef`)에 paintCover 로 실시간 렌더(스타일·강도 변경 즉시 반영). "다른 이미지" 버튼으로 폴더 내 다음 장 순회(`sampleIdxRef`), 민감도 변경 시 재감지. 폴더 picked 시 `loadSample` 자동 호출(감지기 1회 추가 로드, 모델은 캐시). tsc·build(513)·e2e 통과.
- 2026-06-01: **YuNet(ONNX) 병행 — 측면·각도 얼굴 보강** — blur-face "최고" 민감도에서 BlazeFace + **YuNet** 보조 검출을 NMS 병합. `lib/tools/yunet.ts`: onnxruntime-web(동적 import, wasm 단일스레드, wasm는 jsdelivr CDN) + `public/models/yunet.onnx`(~227KB, OpenCV Zoo 2023mar, self-host). 디코드: strides 8/16/32, score=√(cls·obj), bbox=(c+dx)·s/(r+dy)·s/exp(dw)·s, 입력 [1,3,H,W] BGR 0~255 긴변768. `onnxruntime-web` package.json 명시(^1.21.0), 타입 shim `src/types/onnxruntime-web.d.ts`. **완전 guard**: try/catch 실패 시 BlazeFace만, '최고' 모드 한정(표준·높음은 영향 없음). **검증 한계**: 출력 텐서명은 표준 일치 확인했으나 라이브 추론은 헤드리스 불가 → 실기기 'max' 검증 필요. tsc·build(513)·e2e 통과.
- 2026-06-01: **측면 얼굴 보강 + 오검출 컷 (감지 민감도 + 형태 필터)** — ① **감지 민감도 3단계**(표준 conf0.4·3×3 / 높음 conf0.3·4×4 / 최고 conf0.2·5×5·작은 타일) UI 추가 — "최고"는 측면·작은 얼굴 회수율↑(오검출 늘 수 있음). ② **얼굴 비율 필터** `looksLikeFace`(가로세로 0.4~2.2 밖 제거)로 벽·패턴 오검출 컷. `detectAllFaces`를 SensParams 로 파라미터화(단일·폴더 공용). 잘못 잡힌 박스는 기존 토글로 해제 가능. tsc·build(513)·e2e 통과.
- 2026-06-01: **얼굴 감지 회수율 개선 — 타일 분할 감지(NMS)** — BlazeFace 가 입력을 128px 로 축소해 단체사진의 작은/먼 얼굴을 놓치던 문제(다수 인물 중 1~2명만 감지) 해결. `detectAllFaces`: 전체 1회 + 약 1000px당 1칸(최대 4×4) 겹치는 격자 타일별 감지 → 작은 얼굴이 타일 안에서 충분히 커져 포착, `nms`(IoU 0.35)로 타일 간 중복 제거. 단일·폴더 양쪽 적용, 감지 신뢰도 0.3. 점수(score)는 유지해 박스 라벨에 % 표시. **비용**: 고해상도 이미지당 detect 호출이 늘어 처리 시간↑(폴더는 진행률 표시). tsc·build(513)·e2e 통과.
- 2026-06-01: **폴더 일괄 얼굴 모자이크 강화** — blur-face 폴더 일괄 모드는 이미 있었으나(이미지별 얼굴 자동감지→coverOpts 적용→ZIP) 발견성·기본값을 개선: 폴더 모드 진입 시 기본 스타일을 **모자이크(pixelate)**로 자동 설정, 폴더 업로더에 "모든 이미지 얼굴 자동감지→일괄 모자이크→ZIP" 안내 배너 추가, 실행 버튼에 선택 스타일명 표기, **일괄 모드는 감지 민감도 0.4→0.3**으로 높여(프라이버시 우선) 단체사진의 작은/먼 얼굴도 최대한 포착. registry 키워드에 폴더·일괄·batch·단체사진 추가. tsc·build(513)·e2e 17/17 통과.
- 2026-06-01: **얼굴 가리기 대폭 업그레이드 + 동영상 얼굴 블러 신규** — 기존 blur-face(얼굴 블러)를 "얼굴·번호판 가리기"로 확장. **가림 스타일 5종**(블러·모자이크·검은막대·단색·이모지), **강도 자동스케일**(얼굴 크기 비례), **반전 모드**(선택 제외 모두 가림=행인 가리기), **번호판/대상유형 모드**(자동감지 끄고 직접 그리기), **박스 이동·코너 리사이즈 핸들**, **실시간 미리보기 캔버스**, **비포/애프터 비교 슬라이더**. 렌더 로직은 `lib/tools/cover.ts`(paintCover)로 분리해 이미지·동영상 공용. **신규 도구** `video-blur-face`(동영상 얼굴 블러): MediaPipe VIDEO 모드 + canvas.captureStream + MediaRecorder + WebAudio(원본 오디오 무음 라우팅 후 합성)로 **FFmpeg 없이** 브라우저 완결, webm 출력, 재생 속도로 처리. 도구 168→169(+동영상). `e2e/blur-face.spec.ts` 렌더 스모크. 정적 페이지 511→513. tsc·build·e2e 17/17 통과. **주의**: 동영상 파이프라인은 MediaRecorder/captureStream/rVFC 의존 — 실기기 검증 권장.
- 2026-06-01: **오피스 도구 8종 영문판 (EN_TOOLS 58→66)** — 해외 검색 수요 있는 오피스 도구 영문화: vat-calc·seal-stamp·vcard-qr·id-photo·redact·excel-formula·scan-to-pdf·pdf-to-excel. **한국 노동법 전용 3종(salary/severance/leave)은 영어권 적합성 없어 의도적 제외**. `/en/tools`·`/en/guide`·sitemap·hreflang 자동. `guide-content.ts` getPattern 보정(seal-stamp·vcard-qr→generator, vat-calc·redact·excel-formula→text) — 한국어 가이드 오분류도 함께 수정. 정적 페이지 495→511.
- 2026-06-01: **회사원 오피스 도구 11종 (157→168)** — 한국 회사원 실무 browser-only 도구. **계산기**(util): `salary-calc` 연봉 실수령액(4대보험 2025 요율 + 소득세 연말정산 기준 예상), `severance-calc` 퇴직금, `leave-calc` 연차·주휴수당, `vat-calc` 부가세 — 계산 로직 `lib/office/payroll.ts` 분리. **생성기**: `seal-stamp` 직인·도장(Canvas 투명PNG), `vcard-qr` 명함 QR(qrcode), `id-photo` 증명사진 규격(Canvas @300dpi). **문서 실무**: `redact` 민감정보 마스킹(주민/카드/전화/이메일/계좌 정규식), `excel-formula` 엑셀 수식 생성·설명, `scan-to-pdf` 사진→명암보정→PDF(pdf-lib), `pdf-to-excel` PDF 표 추출(`extractPageLines` 재사용 + xlsx). 순수 클라이언트 9종은 OFFLINE_TOOL_IDS 추가(오프라인 배지). `e2e/office-tools.spec.ts` 골든패스 7. 정적 페이지 473→495, 비-admin e2e 41/41 통과. **주의**: 소득세는 간이세액표가 아닌 연말정산 기준 예상치, 4대보험 요율은 `RATES.year`(현 2025)로 노출 — 요율 변경 시 payroll.ts 상수만 갱신.
- 2026-06-01: **영문 SEO 확장 2 + RUM + PWA 오프라인 (대형 라운드, 6기능)** — ① **EN 커버리지 24→58**: `lib/en-tools.ts` 에 인기 도구 +34 (생성기·dev·text·security·이미지·PDF·오디오·비디오·AI). 페이지·sitemap·hreflang 자동 반영. ② **/en/tools 인터랙티브화**: `components/en/EnToolsCatalog.tsx` 클라이언트(검색+카테고리 필터). 정적 export 가 초기 전체 목록 prerender → SEO 유지. page.tsx 는 metadata+JSON-LD 서버 래퍼. ③ **비교 페이지**: `lib/en-compares.ts` 8종(png-vs-jpg·heic-vs-jpg·merge-vs-split-pdf·md5-vs-sha256 등) + `/en/compare` 라우트·인덱스. Article+Breadcrumb+FAQ JSON-LD. `comparesForTool()` 로 도구 페이지 역링크. sitemap 9 URL. ④ **CWV RUM(browser-only)**: `lib/cwv.ts` (web-vitals LCP/INP/CLS/FCP/TTFB, localStorage 롤링 50개, p75, **서버 전송 없음**) + `WebVitalsTracker`(layout, web-vitals 동적 import) + `/admin` CwvStats 패널(p75+등급). ⑤ **PWA 오프라인**: `lib/offline-tools.ts` OFFLINE_TOOL_IDS(외부 WASM/CDN 불필요 경량 35종) + ToolCard·카탈로그 "오프라인" 배지 + sw.js PRECACHE 확장(35 도구 HTML + /en·/en/tools). ⑥ **e2e**: `e2e/en-routes.spec.ts` 골든패스 8 + 기존 strict-mode 취약 단언 안정화(dev-tools·text-tools·hub). 정적 빌드 비-admin 34/34 통과(admin 7은 dev .env.local test-key 의존 별개 인프라). 정적 페이지 396→473. tsc·build 통과. **확장법**: EN_TOOLS·COMPARES·OFFLINE_TOOL_IDS 에 항목 추가 → 페이지·sitemap·배지 자동.
- 2026-06-01: **영문 개별 도구 페이지 + 도구별 가이드 (i18n+SEO 라운드)** — 검색 가치 큰 도구 24종을 큐레이션해 `lib/en-tools.ts` (EN_TOOLS: name/tagline/description/keywords) 에 영문 카피 정의. `lib/guide-content-en.ts` 가 한국어 guide-content 의 file/generator/text 패턴(getPattern 공유)을 재사용해 영문 가이드 본문 생성. 신규 라우트 `/en/tools/{slug}` (트랜잭셔널 랜딩, WebApplication+Breadcrumb JSON-LD) + `/en/guide/{slug}` (정보형 how-to, TechArticle+Breadcrumb+FAQ JSON-LD). 큐레이션 도구만 ko↔en hreflang 양방향 연결(비대상 도구는 미연결로 중복 콘텐츠 방지). `/en/tools` 카탈로그는 큐레이션 도구를 영문명+EN 배지로 개별 페이지에 연결, `/en/guide` 인덱스에 "Popular tool guides" 내부링크 섹션 추가, 한국어 `/guide/{slug}` 에 English 토글+alternate 추가. sitemap 에 en tool/guide 엔트리 48개 + alternates.languages. 정적 페이지 48개 신규(348→396 추정). tsc·build 통과. **확장법**: EN_TOOLS 에 항목 추가하면 페이지·sitemap·카탈로그·hreflang 자동 반영.
- 2026-06-01: **보안 헤더 강화 (security 라운드)** — 외부 의존 조사(자체 이미지 광고만·AdSense 스크립트 없음 / next/font 빌드 셀프호스팅 / 카메라·마이크 미사용) 후 안전 범위 강화. `vercel.json` + `public/_headers` 양쪽 동일: **HSTS** `max-age=63072000; includeSubDomains`(preload 제외, *.vercel.app), **COOP** `same-origin`, `X-DNS-Prefetch-Control: on`, **Permissions-Policy** 확장(accelerometer·browsing-topics·display-capture·magnetometer·midi·payment·usb·xr 차단, autoplay/fullscreen=(self) 허용), **CSP** 에 `object-src 'none'` + `manifest-src 'self'` + `upgrade-insecure-requests` 추가 및 `wasm-unsafe-eval` 명시. **`unsafe-eval` 은 157개 도구 WASM 호환 위해 유지**(제거 시 회귀 위험 과다로 의도적 보류).
- 2026-05-25: **lucide-react optimizePackageImports 시도 — 측정상 변화 없음** — 190 파일이 named import. `next.config.ts` 에 `experimental.optimizePackageImports: ['lucide-react']` 추가. webpack/Turbopack 두 빌드 모두 변화 없음 (parsed 212KB · 950 모듈 동일, Turbopack chunks +8KB). 950 모듈 표시는 lucide-react export 인덱스이고 실제 chunk 는 사용 icon 만 — 이미 잘 트리쉐이크 중. 설정 한 줄은 미래 호환 대비 유지. 번들 다이어트 후보 다 소진.
- 2026-05-25: **bluebird 84KB 추적·미수정** — mammoth 가 끌어옴 (+@xmldom 59KB + dingbat-to-unicode 120KB). mammoth promises.js 가 `props`/`mapSeries`/`promisify` + prototype 확장 등 bluebird 특수 API 광범위 사용 → native Promise alias·stub 모두 회귀 위험 큼. gzip 25KB 절감 대비 비용 과다 → 손대지 않기로 결정. 커밋 없음.
- 2026-05-25: **onnxruntime-web 중복 가설 검증 — 통합 불가능 결론** — `lib/tools/bg-removal-lazy.ts` 신규 (loadBgRemoval 캐시 헬퍼) + `image/remove-background` 페이지의 두 dynamic import 위치를 한 헬퍼로 통합. **그러나 빌드 후 측정: onnxruntime-web 두 chunk 가 그대로 유지 (각 390KB)**. 원인 재조사: `@imgly/background-removal` 내부가 `onnxruntime-web/webgpu` (WebGPU 백엔드) 와 `onnxruntime-web` (WASM 백엔드) 를 각각 dynamic import — 라이브러리 설계상 분기. webpack 은 양쪽 chunk 모두 생성하지만 **사용자는 브라우저 능력에 따라 둘 중 하나만 다운로드 (실 부담 ~390KB)**. 측정상 "중복" 은 사용자 부담과 무관. lazy loader 헬퍼는 코드 위생으로 유지. 빌드 348 페이지 통과.
- 2026-05-25: **bundle-analyzer 도입 + 측정 (다이어트 분석 라운드)** — `@next/bundle-analyzer` + `cross-env` 추가, `npm run analyze` 스크립트. Turbopack 빌드는 분석 데이터를 안 만들어 일회성 `npx next build --webpack` 로 측정. `scripts/parse-bundle.py` 가 client.html 의 chartData 를 파싱해 패키지/청크별 사이즈 요약. **주요 발견 — 톱 라이브러리 (parsed/gzip)**: heic2any 1.35MB/338KB(단일), onnxruntime-web 780KB/210KB(2 chunk 중복), next 578KB, components 567KB, xlsx 411KB, pdfjs-dist 406KB, @tensorflow/tfjs-core 352KB, @cantoo/pdf-lib 340KB, @base-ui/react 338KB, jspdf 330KB, sql-formatter 285KB, lucide-react 212KB(950 모듈), html2canvas 197KB, pako 177KB, jsqr 130KB. **핵심 발견**: 대부분의 큰 라이브러리는 이미 자체 chunk 로 잘 분리(dynamic import 효과 OK). 진짜 win 후보 — onnxruntime-web 중복 통합(-100KB+), lucide-react named import 전환(-50~100KB), bluebird 84KB 사용처 확인·제거.
- 2026-05-25: **번들 다이어트 2차 — PDF 페이지 lazy import** — `lib/tools/pdf-lazy.ts` 신규 (loadPdfLib 캐시 헬퍼 + 타입 re-export). `pdf-common.ts` 의 `loadPdfFromFile`/`saveAsBlob` 내부에서 동적 import. 17 PDF 페이지 + `compress/pdf.ts` 의 top-level `@cantoo/pdf-lib` import 를 제거하고 처리 함수 안 `const { PDFDocument } = await loadPdfLib()` 패턴으로 일괄 전환. **측정상 chunks 변화 미미 (-974 bytes)** — Turbopack 이 이미 static/dynamic 모두 같은 shared chunk 로 묶어버려 실 절감 없음. 코드 위생·일관성·향후 lazy-split 기반은 개선. 빌드 348 페이지 통과.
- 2026-05-25: **번들 다이어트 1차 — PDF 라이브러리 통합 + 유틸 분리** — `lib/tools/file-utils.ts` 신규 분리 (pdf-lib 무의존 유틸 6개). `lib/tools/pdf-common.ts` 는 PDF 전용 함수만 남기고 file-utils 의 호환 re-export. 비-PDF 도구 페이지 50개의 import 를 `pdf-common` → `file-utils` 로 일괄 마이그레이션 (pdf-lib 가 무관한 페이지에 더 이상 따라붙지 않음). 모든 `pdf-lib` import 를 `@cantoo/pdf-lib` (SVG 지원 superset fork) 로 통일 (17 PDF 페이지 + compress/pdf.ts), `pdf-lib` 패키지 제거. 빌드 348 페이지 통과, chunks 11.50→11.21 MB (-287KB, 2 파일 감소). 진짜 win 은 향후 PDF static→dynamic 전환 라운드.
- 2026-05-25: **영문 카테고리 가이드 + hreflang 양방향 연결** — `/en/guide/category/[cat]` 11개 + `/en/guide` 인덱스 신규. `lib/category-guide-content-en.ts` 모듈에 11개 카테고리 영문 metaTitle/description/intro/highlights/FAQ/keywords 추가. 한국어/영문 카테고리 가이드 모두 `alternates.languages` 양방향, sitemap 도 alternates.languages 포함. `/en` 랜딩 CTA 에 "Read tool guides" 버튼, `/en/tools` 안내 박스 갱신, 카테고리 헤더 옆 "Read X guide →" 링크 추가. 한국어 가이드 breadcrumb 에 English 토글 한 줄. 빌드 348 페이지 통과.
- 2026-05-25: **SEO 허브 확장 + registry 톱10 정리** — `/guide/category/[cat]` 11개 카테고리 가이드 신규 생성(CollectionPage·BreadcrumbList·ItemList·FAQ JSON-LD 다층). `/guide` 인덱스의 카테고리 헤더를 해당 카테고리 가이드로 링크, 도구 수 hardcode 제거. `/guide/[slug]` breadcrumb 가 카테고리 가이드 경유 4단으로 확장. `sitemap.ts` 에 11개 카테고리 URL 추가. registry 정합성: `images-to-pdf` 중복 카드 제거(pdf-from-jpg 와 동일 href), `html-entities` 이중 인코딩 description 정정, `pdf-rotate`·`gif-resize`·`image-watermark`·`video-trim`·`audio-trim`·`gif-trim`·`base64` 키워드·설명 보강, `pdf-flatten` 카테고리 security→pdf, `chart` dev→util, `subtitle-edit`·`subtitle-convert` text→video. 빌드 336 페이지 통과.
- 2026-05-22: 폴더명 `agent-control-panel` → `web-toolkit`, 미션 재정의(원격 통제 → 브라우저 도구 모음). 하네스 신규 구성 — 11 에이전트 + 11 스킬 + 5 슬래시 커맨드.
- 2026-05-22: **legacy-pruner 1차** — 옛 채팅·에이전트 시스템 `_legacy/` 이전 완료. `agent/`, `agent-package/`, `supabase/`, `middleware.ts`, web 의 `chat|dashboard|harnesses|share|(auth)|api/*` 라우트, `components/chat|dashboard|sidebar|settings`, `AuthProvider|SessionRecovery|RealtimeStatusBadge|ErrorReporter`, `lib/supabase|hooks|agent-*|outbox|realtime-*|...` 모두 이동. 루트 redirect `/chat` → `/tools`, BottomNav 2탭(도구·설정)으로 단순화, settings 페이지 테마+안내만 유지. 빌드 OK.
- 2026-05-22: **의존성 청소** — Supabase(2), web-push(2), pako(2), react-markdown 계열(3) 등 9개 패키지 + 125 transitive 제거. `prebuild` 스크립트(copy-agent-package.mjs) 와 `public/_agent/` 산출물도 정리.
- 2026-05-22: **정적 export 모드 전환** — `next.config.ts` 에 `output: 'export'`. 빌드 산출물은 `web/out/` 37MB. 어떤 정적 호스팅(Cloudflare Pages·GitHub Pages·S3·Vercel 정적)에서도 동작. 보안 헤더는 `vercel.json` + `web/public/_headers` 양쪽 배치(호스팅별 호환). `/` 루트는 클라이언트 redirect (`useRouter().replace('/tools')`) + meta refresh 폴백.
- 2026-05-22: **`_legacy/` 완전 삭제** — 435MB / tracked 149개 파일 git rm + 디렉터리 통째 제거. git history 에는 그대로 보존되어 `git log` 거슬러 옛 시스템 복원 가능. 빌드 회귀 없음(5.3초 통과). 작업 디렉터리 루트가 `.claude / .git / .github / .vercel / .gitignore / CLAUDE.md / vercel.json / web/` 단 8개 항목으로 정리.
- 2026-05-22: **GitHub push + Vercel 프로덕션 배포 완료** — origin/master `d20a812` → `c380ff1`. 옛 ci.yml 제거(workflow scope 회피). vercel.json 을 web/ Root Directory 기준으로 재배치(`outputDirectory: out`), `framework: null` 로 Vercel Next.js 어댑터 우회. GitHub push 가 자동 배포 트리거 → Ready. 짧은 alias `agent-control-panel-phi.vercel.app` 등 4개가 새 빌드로 자동 갱신. **단 Vercel "Deployment Protection" 이 켜져 외부 접근 401** — 사용자가 대시보드에서 끄면 즉시 라이브.
- 2026-05-22: **Service Worker 갱신** — 옛 ACP SW(`acp-sw-v3-*`)가 `/chat`·`/dashboard`·`/settings 옛 버전` PRECACHE 로 새 빌드에서 404 유발. `webtoolkit-sw-v1-20260522` 로 prefix 자체 변경 + activate 단계가 `acp-sw-*` 와 옛 webtoolkit-* 모두 청소. 옛 라우트 요청은 SW 가 즉시 `/tools` 로 302 redirect (옛 PWA 사용자 보호). RSC payload(`?_rsc=`) 는 intercept 제외. 자동 배포 Ready.
- 2026-05-22: **이름 정리 (옛 ACP/agent-control-panel 잔재 제거)** — `web/public/manifest.json` 갱신 (name: Web Toolkit, start_url: /tools, shortcuts 단순화), `web/.env.local.example` 정적 사이트용 stub, `web/src/app/tools/docs/yaml-json/page.tsx` SAMPLE_YAML, `.vercel/project.json` projectName=web-toolkit. **GitHub repo rename**: `baboplater-blip/agent-control-panel` → `baboplater-blip/web-toolkit` (사용자 직접 실행, 옛 URL 자동 redirect). `git remote` 갱신 완료. **Vercel 프로젝트명**은 대시보드에서 사용자 수동 변경 필요(CLI 미지원).
