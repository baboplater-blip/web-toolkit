---
description: 번들 크기 + Lighthouse 점수 검증 (전체 또는 단일 도구)
argument-hint: [slug]
---

# /perf-check

도구 페이지의 성능 게이트를 점검한다.

## 인자

- `/perf-check` — 전체 도구 + 허브
- `/perf-check pdf-merge` — 단일 도구

## 절차

1. **빌드**
   ```bash
   cd web && npm run build
   ```
2. **번들 출력 파싱** — Next.js 의 "Route (app) ... First Load JS" 표
3. **임계 검증** (lighthouse-budget 스킬 기준):
   - 허브 < 300 KB
   - 도구 < 250 KB
   - 초기 JS gzip < 200 KB
4. **Lighthouse (선택)** — 단일 도구일 때 모바일 시뮬레이션:
   ```bash
   cd web && npm run start &
   npx lighthouse http://localhost:3000/tools/{slug} --form-factor=mobile --quiet --output=json
   ```
5. **번들 분석 (회귀 시)**
   ```bash
   cd web && ANALYZE=true npm run build
   ```

## 출력

```markdown
# /perf-check pdf-merge

## 번들
- First Load JS: 245 KB ✓ (임계 250 KB)
- 변동: +5 KB vs 이전 (대비 측정 없으면 생략)

## Lighthouse (모바일 4G)
- Performance: 96 ✓
- LCP: 1.6 s ✓
- TBT: 80 ms ✓
- CLS: 0.02 ✓

## 결과: PASS
```

회귀 시 perf-profiler 자동 호출하여 원인 분석 + 처방.

## 주의

`npm run start` 백그라운드 실행 후 측정 끝나면 종료. PID 추적 또는 `lsof -i :3000` 으로 확실히 정리.

CI 가 없으므로 수동 실행. 향후 GitHub Actions 또는 Vercel Build Step 통합 가능.
