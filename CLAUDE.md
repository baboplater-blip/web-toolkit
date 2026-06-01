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
