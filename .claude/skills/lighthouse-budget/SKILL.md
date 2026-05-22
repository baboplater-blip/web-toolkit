---
name: lighthouse-budget
description: 도구 페이지 성능 예산. 측정 명령·기준값·회귀 시 처방.
---

# 성능 예산

도구 사이트의 성능 기준. 모바일 4G 시뮬레이션 기준.

## 기준값

| 지표 | 목표 | 임계 |
|------|------|------|
| Performance 점수 | 95+ | 90 미만 시 차단 |
| LCP | < 1.8 s | 2.5 s |
| TBT | < 100 ms | 200 ms |
| CLS | < 0.05 | 0.1 |
| 초기 JS (gzip) | < 150 KB | 200 KB |
| 페이지 First Load JS | 허브 < 300 KB / 도구 < 250 KB | 350 KB |
| WASM 자산 | 사용자가 처리 버튼 클릭 후 다운로드 | 페이지 로드 시 다운로드 금지 |

## 측정 명령

### Lighthouse
```bash
cd web && npm run build && npm run start &
npx lighthouse http://localhost:3000/tools --view --form-factor=mobile --throttling.cpuSlowdownMultiplier=4
npx lighthouse http://localhost:3000/tools/pdf/merge --view --form-factor=mobile
```

### 번들 분석
```bash
cd web && ANALYZE=true npm run build
# .next/analyze/client.html 자동 오픈 (분석 플러그인 설치 시)
```

`@next/bundle-analyzer` 설치되어 있지 않으면 perf-profiler 가 추가.

### Next.js 빌드 출력
```
Route (app)                              Size     First Load JS
├ ○ /tools                               5 kB           200 kB
├ ○ /tools/pdf/merge                     12 kB          250 kB
```
"First Load JS" 가 임계 초과면 회귀.

## 회귀 발견 시

### "초기 JS 가 200 KB 초과"
1. 최근 추가된 import 확인
2. 큰 라이브러리(pdf-lib, ffmpeg, tesseract) 가 top-level import 되어 있나? → 함수 내 dynamic import 로 이동
3. shadcn 컴포넌트 전체 barrel import? → named import 만
4. 같은 기능 라이브러리 중복? (예: lodash + ramda)

### "LCP 가 2.5s 초과"
1. 가장 큰 요소 식별 (Lighthouse Performance > LCP element)
2. 이미지면 `next/image` + `priority` (히어로) / lazy (그 외)
3. 폰트면 `next/font` 로 최적화 + `display: 'swap'`
4. 큰 컴포넌트면 dynamic + `loading` placeholder

### "TBT 가 200ms 초과"
1. 메인 스레드 작업 길이 (Performance > Long Tasks)
2. 무거운 계산이 useEffect 안에서 동기적 실행 → 워커 또는 `requestIdleCallback`
3. 거대한 hydration 트리 → 'use client' 를 더 작은 단위로

### "CLS 가 0.1 초과"
1. 이미지/iframe 에 width/height 미지정
2. 폰트 swap 시 레이아웃 시프트 → `font-display: optional` 또는 size-adjust
3. 동적 콘텐츠 위치 변경 → 스켈레톤 placeholder

## 정기 점검

- 신규 도구 추가 PR 마다 perf-profiler 호출
- 매주 1회 허브 페이지(`/tools`) Lighthouse 측정
- 라이브러리 메이저 업데이트 후 전수 점검
