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

| 날짜 | 페이지 | Perf | A11y | BP | SEO | 비고 |
|------|--------|------|------|----|----|------|
| _아직 측정 없음_ | | | | | | 초기 베이스라인 필요 |

## 부록 — Lighthouse 가 잡지 못하는 것

자동화로 검출 안 되어 별도 점검이 필요한 항목:

- **실제 디바이스 성능**: 저사양 안드로이드 (RAM 4GB 이하) 에서 FFmpeg·Tesseract 실패율
- **오프라인 동작**: 네트워크 끊고 사전 캐시된 12개 도구 실제 동작 확인 (PWA precache)
- **모바일 제스처**: 두 손가락 줌·길게 누르기 등 — DevTools 모바일 시뮬레이션으로는 한계
- **스크린리더 실제 동작**: NVDA / VoiceOver 로 도구 페이지 keyboard-only 사용 한 바퀴
- **PWA 설치 흐름**: 데스크탑 Chrome `Install` 버튼 → 홈화면 등록 → 오프라인 진입 한 사이클

이런 항목은 분기 1회 수동으로 한 시간 정도 잡고 통째 점검한다.
