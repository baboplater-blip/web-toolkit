---
description: 신규 도구 스캐폴드 - 페이지 + 워커(옵션) + registry 항목을 한 번에 추가
argument-hint: <category>/<slug> "<도구명>"
---

# /new-tool

신규 도구 한 개를 일괄 스캐폴드한다.

## 입력 파싱

사용자가 다음 형식으로 요청한다:
- `/new-tool pdf/shrink "PDF 용량 줄이기"`
- `/new-tool image/heic-to-jpg "HEIC → JPG"`

## 절차

1. **카테고리 검증** — `image / pdf / video / gif / audio / docs / text / dev / util / security / ai` 중 하나인가
2. **슬러그 충돌 확인** — `registry.ts` 에 동일 id 가 이미 있는지 grep
3. **tool-architect 호출** — 어떤 라이브러리·워커가 필요한지 설계
4. **tool-builder 호출** — 다음 세 파일을 생성/수정:
   - `web/src/app/tools/{category}/{slug}/page.tsx` (tool-page-template 스킬)
   - `web/src/workers/{slug}.worker.ts` (워커 필요시, web-worker-template 스킬)
   - `web/src/lib/tools/registry.ts` (registry-add 스킬)
5. **검증** — `cd web && npm run build` 통과 확인
6. **결과 보고** — 추가된 파일 목록 + 허브에서 보이는지 확인 안내

## 출력 형식

```
✓ /tools/pdf/shrink 스캐폴드 완료
  - web/src/app/tools/pdf/shrink/page.tsx
  - web/src/workers/pdf-shrink.worker.ts
  - registry.ts +1 항목 (id: pdf-shrink, phase: 7)
  - 빌드 OK

다음 단계: 핵심 처리 로직을 worker 에 채우고 `qa-tester` 회귀 시나리오 실행
```

## 주의

- 빈 스캐폴드는 `status: 'planned'` 또는 `status: 'ready'` 둘 다 가능. 기본은 `'ready'` 로 두되 처리 로직 미구현이면 페이지 상단에 "준비 중" 배지 표시.
- 동일 카테고리/슬러그 충돌 시 사용자에게 어떤 슬러그로 바꿀지 묻기.
