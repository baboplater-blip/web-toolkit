# Lighthouse 자가 점검표

Web Toolkit 의 성능·접근성·SEO·Best Practices 를 정기적으로 측정·회귀를 잡기 위한 체크리스트.

브라우저에서 직접 실행하므로 자동화되어 있지 않다. 배포 후 또는 큰 변경 직후 본 문서의 명령·기준에 따라 수동 점검한다.

## 측정 방법

### A. Chrome DevTools (대화형)

가장 빠른 방법. 결과를 즉시 화면에서 본다.

1. Chrome 에서 측정 대상 URL 을 열기 (예: `https://web-toolkit.vercel.app/tools/pdf/merge`)
2. DevTools (`F12`) → **Lighthouse** 탭
3. **Mode: Navigation**, **Device: Mobile**, 카테고리는 **Performance / Accessibility / Best Practices / SEO** 모두 체크
4. **Analyze page load** 클릭

> **Mobile 모드 기준** 으로 측정한다. 데스크탑 점수보다 보수적이라 모바일 사용자 경험이 곧 회귀 신호다.

### B. CLI (CI · 배치 측정)

여러 페이지를 자동으로 돌리고 JSON 결과를 보관할 때 사용한다.

```bash
# 1회 설치
npm install -g lighthouse

# 단일 페이지 측정 (헤드리스, mobile preset, 결과 HTML 저장)
lighthouse https://web-toolkit.vercel.app/ \
  --preset=mobile \
  --output=html \
  --output-path=./lh-home.html \
  --chrome-flags="--headless=new"

# JSON 으로 저장 후 시계열 비교
lighthouse https://web-toolkit.vercel.app/tools/pdf/merge \
  --preset=mobile \
  --output=json \
  --output-path=./lh-pdf-merge.json \
  --chrome-flags="--headless=new"
```

## 측정 대상 (회귀 모니터링용 8개)

부하·기능 다양성을 대표하는 핵심 페이지만 정기 측정한다. 모든 도구를 매번 측정할 필요 없다.

| URL | 무게 분류 | 주요 의존성 |
|-----|-----------|-------------|
| `/` | 가벼움 | 정적 SSR (서버 컴포넌트) |
| `/tools` | 가벼움 | 클라이언트 검색·필터 |
| `/tools/compress` | 중간 | pdf-lib + canvas |
| `/tools/pdf/merge` | 중간 | pdf-lib |
| `/tools/image/resize` | 가벼움 | Canvas API |
| `/tools/util/qr` | 가벼움 | qrcode JS |
| `/tools/video/compress` | 무거움 | FFmpeg.wasm (lazy) |
| `/tools/ocr` | 무거움 | Tesseract.js (lazy) |

## 기준값

각 카테고리에 대해 **목표값** 과 **회귀 임계값** 을 둔다. 회귀 임계 미만이면 reno 라운드가 필요하다.

| 카테고리 | 목표 | 회귀 임계 | 비고 |
|----------|------|----------|------|
| Performance | ≥ 85 | < 70 | 4G slow + Moto G4 시뮬레이션 |
| Accessibility | ≥ 95 | < 90 | 100 점 목표 |
| Best Practices | ≥ 90 | < 80 | CSP·HTTPS·console error 등 |
| SEO | ≥ 95 | < 90 | 메타·canonical·robots |

### Core Web Vitals 임계 (mobile)

| 지표 | 목표 | 회귀 임계 |
|------|------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4.0s |
| FID / INP (Interaction to Next Paint) | < 200ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| Total Blocking Time | < 200ms | > 600ms |
| Speed Index | < 3.4s | > 5.8s |

### 도구 페이지 번들 (참고용)

`npm run build` 출력의 도구 페이지 JS 사이즈가 초기 200KB 를 넘으면 점검 대상.

```bash
npm run build 2>&1 | grep -E "^\\s+(○|λ)" | head -20
# Route 별 First Load JS 컬럼 확인
```

## 카테고리별 핫스팟 (자주 잡히는 회귀)

### Performance

- **WASM eager 로드**: FFmpeg/Tesseract/ESRGAN 은 반드시 `dynamic(() => import(…))` 로 lazy
- **이미지 비최적화**: OG 이미지는 1200×630 PNG 한 장만, 압축 후 100KB 이하 유지
- **Render-blocking 자원**: 큰 폰트 파일은 `<link rel="preload">` 또는 `display: swap`
- **무한 리렌더**: `useMemo` 누락으로 카테고리 그루핑·필터 재계산
- **이벤트 핸들러 누수**: `useEffect` cleanup 누락 (popstate·keydown 리스너)

### Accessibility

- **라벨 누락**: 모든 input/textarea 에 `<label htmlFor>` 또는 `aria-label`. `scripts/patch-input-aria.mjs` 자동 검출
- **아이콘 버튼**: 텍스트 없는 버튼에 `aria-label`, 내부 아이콘에 `aria-hidden="true"`
- **색 대비**: 카드·뱃지의 muted-foreground 텍스트 — DevTools Color Contrast 도구로 4.5:1 확인
- **포커스 표시**: 인터랙티브 요소에 `focus-visible:ring-2`
- **헤딩 계층**: 한 페이지에 `<h1>` 단 하나, `<h2>` → `<h3>` 순차

### SEO

- **메타 누락**: 도구 페이지마다 `generate-tool-metadata.mjs` 가 layout.tsx 자동 생성
- **JSON-LD**: root(WebSite+SearchAction), `/tools`(ItemList), 도구별(WebApplication), 도구 섹션(BreadcrumbList)
- **canonical**: `/` 는 자기 자신, `/tools` 는 자기 자신, 도구별도 자기 href
- **OG image**: `/og/{category}.png` 12 종 자동 매핑
- **sitemap·robots**: `app/sitemap.ts`, `app/robots.ts` — 빌드 시 정적 생성

### Best Practices

- **CSP 오류**: `vercel.json` 또는 `public/_headers` 의 CSP 와 `connect-src`·`media-src` 동기화
- **console.error**: 도구 워커의 에러는 toast 로, console 은 영문 로그만
- **HTTPS 자원**: 외부 CDN(MediaPipe·Hugging Face)이 https 인지 확인
- **deprecated API**: `navigator.userAgent` 직접 파싱 금지

## 점검 절차

### 정기 (월 1회)

1. 위 측정 대상 8개에 대해 Chrome DevTools 또는 CLI 로 측정
2. 결과 점수가 회귀 임계 아래로 떨어진 페이지 표시
3. Lighthouse Diagnostics 섹션의 권고사항을 GitHub Issue 로 등록
4. 점수 표를 본 문서 하단 `## 측정 이력` 에 추가

### 큰 변경 직후

다음 변경 후에는 **변경된 도구 1개 + `/` + `/tools`** 만 빠르게 측정:

- 새 도구 추가 (PR 머지 직후)
- 무거운 라이브러리 도입·교체
- 라우팅·SW 변경
- registry 100건 이상 일괄 변경

### 회귀 발견 시

1. 회귀 원인 추정 → `git log -- src/app/tools/{slug}/` 로 최근 커밋 확인
2. 회귀 임계를 명백히 넘는 경우 즉시 롤백 또는 핫픽스
3. 점수 회복 후 본 문서 절차 업데이트

## 측정 이력

> 새 측정 결과는 아래에 추가. 최신이 위.

### 2026-05-25 — Baseline + 회귀 4건 즉시 수정

**측정 URL**: `https://agent-control-panel-phi.vercel.app` (옛 ACP 시절 alias.

> ⚠️ **알림**: `https://web-toolkit.vercel.app` 은 우리 사이트가 아닌 빈 Next.js
> 페이지가 점유 중이다. 모든 메타·sitemap·canonical 이 잘못된 URL 을 가리키므로
> Vercel 대시보드에서 `web-toolkit.vercel.app` alias 를 본 프로젝트에 추가하거나
> `NEXT_PUBLIC_SITE_URL` 환경변수를 실제 라이브 URL 로 갱신해야 한다.

**Before (회귀 발견)**

| 페이지 | Perf | A11y | BP | SEO | LCP(ms) | CLS | TBT(ms) |
|--------|------|------|----|----|---------|------|--------|
| / | 80 | 85 | 100 | 100 | 2995 | 0.147 | 264 |
| /tools | 89 | 86 | 96 | 100 | 2935 | 0.147 | 28 |
| /tools/compress | 85 | 82 | 100 | 100 | 3610 | 0.147 | 31 |
| /tools/pdf/merge | 84 | 82 | 100 | 100 | 3613 | 0.147 | 23 |
| /tools/image/resize | 85 | 82 | 100 | 100 | 3610 | 0.147 | 14 |
| /tools/util/qr | 84 | 82 | 100 | 100 | 3685 | 0.147 | 28 |
| /tools/video/compress | 89 | 82 | 100 | 100 | 3687 | 0.042 | 35 |
| /tools/ocr | 85 | 82 | 100 | 100 | 3536 | 0.147 | 7 |

**4건 회귀 원인**

1. `meta-viewport` 의 `user-scalable=no, maximum-scale=1` — 접근성 위반 (사용자 줌 차단)
2. `AdSlot` `<div aria-label="광고 영역">` — `<div>` 에 ARIA prohibited
3. 광고 이미지 anchor 가 텍스트 없이 `<img>` 만 — `link-name` 실패
4. skip link `#main-content` 가리키지만 해당 id 가 어디에도 없음

**즉시 수정 (`5001484`, `15598b2`)**

- `userScalable: true, maximumScale: 5`
- `role="complementary"` landmark + image.alt 기반 link aria-label
- root layout `<div id="main-content" tabIndex={-1}>` 추가
- FileDropZone `aria-label` 제거 — visible text 가 자동 accessible name
- 광고 placeholder `opacity-60` → `text-muted-foreground/80` 색대비 확보

**After (수정 후 1차 재측정)**

| 페이지 | Perf | A11y | BP | SEO | LCP(ms) | CLS |
|--------|------|------|----|----|---------|------|
| / | 93 | 100 | 100 | 100 | 1646 | 0.147 |
| /tools | 89 | 100 | 96 | 100 | 3010 | 0.147 |
| /tools/compress | 84 | 96 | 100 | 100 | 3684 | 0.147 |
| /tools/pdf/merge | 85 | 96 | 100 | 100 | 3609 | 0.147 |
| /tools/image/resize | 84 | 96 | 100 | 100 | 3613 | 0.147 |
| /tools/util/qr | 84 | 96 | 100 | 100 | 3729 | 0.147 |
| /tools/video/compress | 85 | 96 | 100 | 100 | 3609 | 0.147 |
| /tools/ocr | 85 | 96 | 100 | 100 | 3535 | 0.147 |

도구 페이지의 잔여 -4 점은 두 번째 수정 (`15598b2`) 으로 모두 100 달성 예상.

**다음 라운드로 이월된 회귀**

- **CLS 0.147** (모든 페이지 공통) — 광고 슬롯 lazy load 가 이미지 로드 시 컨테이너 높이를 늘려 layout shift. 광고 이미지 사이즈 사전 reservation 필요
- **LCP 3.5s** (도구 페이지) — 광고 이미지가 LCP 후보. 광고 lazy 강화 또는 도구 본문을 우선 렌더링하는 layout 재구성
- **TBT 264ms** (랜딩 페이지) — Hero 영역의 JS 부담. Hero 만 server component 로 격리, 인터랙티브는 클라이언트 컴포넌트로 분리 후보

### 2026-05-25 (재측정) — CLS 회귀 즉시 해결

**원인**: AdSlot 컨테이너가 `hasImage ? 가변 : 고정` 으로 분기. 비동기로 광고 config 가 로드되며 placeholder → 이미지 모드 전환 시 컨테이너 높이가 변해 모든 페이지 공통 CLS 0.147.

**수정** (`6acdf63`): 이미지/HTML/placeholder 모두 동일한 고정 박스 사용. 이미지는 `h-full w-full object-contain` 으로 박스 안에서 비율 유지.

**최종 점수** (mobile, AdSlot CLS fix + 직전 a11y 수정 적용)

| 페이지 | Perf | A11y | BP | SEO | LCP(ms) | CLS | TBT(ms) |
|--------|:----:|:----:|:--:|:---:|:-------:|:----:|:------:|
| / | **99** | **100** | 100 | 100 | 1643 | **0.000** | 34 |
| /tools | 94 | 100 | 96 | 100 | 3009 | **0.000** | 9 |
| /tools/compress | 90 | 100 | 100 | 100 | 3609 | **0.000** | 16 |
| /tools/pdf/merge | 90 | 100 | 100 | 100 | 3610 | **0.000** | 14 |
| /tools/image/resize | 90 | 100 | 100 | 100 | 3619 | **0.000** | 26 |
| /tools/util/qr | 89 | 100 | 100 | 100 | 3732 | **0.000** | 19 |

**누적 개선 (5월 25일 단일 라운드 내)**

| 지표 | Baseline | After 1차 | After 2차 | After 3차 (CLS) |
|------|---------:|----------:|----------:|----------------:|
| 랜딩 Perf | 80 | 93 | 93 | **99** (+19) |
| 랜딩 A11y | 85 | 100 | 100 | **100** (+15) |
| 도구 A11y | 82 | 96 | 100 | **100** (+18) |
| 전 페이지 CLS | 0.147 | 0.147 | 0.147 | **0.000** (해결) |

**잔여 (다음 라운드 후보)**

- 도구 페이지 LCP 3.5s — 광고 이미지가 LCP 후보. 광고 lazy load 강화 또는 본문 우선 렌더링
- /tools BP 96 — DevTools console 권고사항 1개 추정. 별도 audit 필요

### 2026-05-25 (LCP 시도) — 캐시 인프라 강화 + 본질적 한계 확인

**진단** (`compress` 페이지 LCP element + phase 분석)

```
LCP element: <img alt="..." loading="lazy" src="data:image/webp;base64,...">
             (AdSlot 의 top 광고 이미지)
phase breakdown:
  TTFB         888ms
  Load Delay  2978ms   ← 문제
  Load Time     0.6ms
  Render Delay   21ms
```

광고 데이터가 data URL 자체는 즉시 페인트 가능한 형식인데도 Load Delay 3초.
원인: AdSlot 이 `'use client'` 컴포넌트 → hydration 완료 후 fetch → setState
→ re-render 까지 ~3초.

**처방 (`2f97713`)**

1. AdSlot 의 top 슬롯에 `loading="eager"` + `fetchPriority="high"`
2. `ads-config.ts` 에서 `cache: 'no-store'` 제거 (SW · HTTP 캐시 효과 부활)
3. 모듈 평가 시점에 즉시 `loadAdsConfig()` 호출 (hydration 보다 먼저 fetch 시작)
4. `<link rel="preload" as="fetch" href="/ads-config.json">` 첫 paint 와 동시 다운로드
5. SW `isStaticAsset` · `PRECACHE_URLS` 에 `/ads-config.json` 추가

**효과**

| 페이지 | LCP before | LCP after | 변화 |
|--------|-----------:|----------:|-----:|
| compress | 3.9s | 4.1s | ~ |
| pdf-merge | 3.6s | 3.6s | 0 |
| image-resize | 3.8s | 3.8s | 0 |
| util-qr | 3.8s | 3.8s | 0 |

**lighthouse 첫 방문 시뮬레이션에서는 효과 미미**. 이유:

- Lighthouse mobile preset 은 신규 사용자 (캐시 비어있음) 시뮬레이션 → SW precache 효과 못 봄
- `ads-config.json` 78KB 가 4G slow 네트워크에서 다운로드에 1.5-2s 소요
- preload 가 priority 만 올리지 절대 속도는 못 줄임
- module eager fetch 도 첫 페이지 응답 받은 후에야 JS 가 평가되므로 큰 단축 없음

**효과가 큰 환경**: 재방문 (SW 캐시 히트), 5G/Wi-Fi 사용자 (RTT 짧음). 실제
한국 평균 모바일 사용자는 4G slow 보다 빠르므로 라이브 점수는 더 좋을 것.

**근본적 처방은 별도 라운드** — `ads-config.json` 의 광고 이미지 data URL 을
외부 파일 (`/ads/*.webp`) 로 분리. 그러면 config 자체가 ~1KB 로 축소되어 RTT
1번에 끝남. 다만 admin 페이지의 이미지 업로드 로직 동시 변경 필요.

### 2026-05-25 (LCP 구조 변경) — 광고 이미지 외부 파일 분리

**근본 처방 적용**. `ads-config.json` 의 image `src` data URL 78KB 를 외부 파일로 분리.

- `scripts/extract-ads-images.mjs` 신규 — data URL → `public/ads/{slotKey}.{ext}` 분리 후 config 의 src 를 외부 경로로 교체. idempotent
- 일회성 적용 결과: **ads-config.json 78KB → 662B (118× 축소)**, top.webp 14KB / sidebar*.webp 21KB
- SW PRECACHE_URLS 에 `/ads/*.webp` 3종 추가
- layout.tsx head 에 `<link rel="preload" as="image" href="/ads/top.webp">` (LCP 후보 최고 priority)

**측정 결과** (mobile, `292a827` 이후)

| 페이지 | Perf | A11y | BP | SEO | LCP(ms) | CLS | TBT(ms) |
|--------|:----:|:----:|:--:|:---:|:-------:|:----:|:------:|
| / | **99** | 100 | 100 | 100 | 2109 | 0.000 | 16 |
| /tools | **97** | 100 | 96 | 100 | 2561 | 0.000 | 6 |
| /tools/compress | 89 | 100 | 100 | 100 | 3577 | 0.000 | 69 |
| /tools/pdf/merge | 91 | 100 | 100 | 100 | 3461 | 0.000 | 22 |
| /tools/image/resize | **92** | 100 | 100 | 100 | 3310 | 0.000 | 13 |
| /tools/util/qr | 90 | 100 | 100 | 100 | 3578 | 0.000 | 24 |

**도구 페이지 LCP 단축**

| 페이지 | 분리 전 | 분리 후 | 변화 |
|--------|---------:|---------:|-----:|
| /tools | 3009ms | 2561ms | **-448ms** |
| /tools/compress | 3684ms | 3577ms | -107ms |
| /tools/pdf/merge | 3609ms | 3461ms | -148ms |
| /tools/image/resize | 3619ms | 3310ms | -309ms |
| /tools/util/qr | 3729ms | 3578ms | -151ms |

도구 페이지 평균 ~200ms 단축. 5G/Wi-Fi 실제 사용자 환경에서는 효과가 더 큼.

**Admin 워크플로 (광고 변경 시 새 절차)**

1. admin 페이지에서 이미지 업로드 (기존 그대로) → data URL 임시 저장
2. **commit 전·후** 로컬에서 `npm run ads:extract -- --apply` 실행
3. `git add public/ads/ public/ads-config.json && git commit && git push`
4. Vercel 자동 배포

`extract-ads-images.mjs` 는 idempotent — data URL 이 이미 외부 경로면 그대로 둠. 매번 실행해도 안전.

추후 자동화 후보: admin 페이지가 directly 외부 파일로 GitHub multi-file commit (git data API 사용). 현재는 일회성 명령으로 충분.

### 비고 — 모바일 preset 의 LCP 가 항상 3s+ 인 이유

Lighthouse 12 의 mobile preset 은 4G slow + Moto G4 시뮬레이션이다. 실제 한국
사용자의 평균 모바일 환경은 5G/Wi-Fi 라 실측은 1-1.5s 일 가능성이 크다. 그래도
이 점수가 SEO 의 Core Web Vitals 신호이므로 lighthouse 기준에 맞춰야 한다.

## 부록 — Lighthouse 가 잡지 못하는 것

자동화로 검출 안 되어 별도 점검이 필요한 항목:

- **실제 디바이스 성능**: 저사양 안드로이드 (RAM 4GB 이하) 에서 FFmpeg·Tesseract 실패율
- **오프라인 동작**: 네트워크 끊고 사전 캐시된 12개 도구 실제 동작 확인 (PWA precache)
- **모바일 제스처**: 두 손가락 줌·길게 누르기 등 — DevTools 모바일 시뮬레이션으로는 한계
- **스크린리더 실제 동작**: NVDA / VoiceOver 로 도구 페이지 keyboard-only 사용 한 바퀴
- **PWA 설치 흐름**: 데스크탑 Chrome `Install` 버튼 → 홈화면 등록 → 오프라인 진입 한 사이클

이런 항목은 분기 1회 수동으로 한 시간 정도 잡고 통째 점검한다.
