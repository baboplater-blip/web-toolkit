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

스캐폴딩은 **`create-tool` CLI** 가 일괄 처리한다. 손으로 파일을 짜지 말 것.

1. **tool-architect 호출** — 어떤 라이브러리·워커·아키타입(calc/text/generator/file/viewer)이 필요한지 설계.
2. **CLI 스캐폴드** — `cd web && node scripts/create-tool.mjs` (또는 `npm run tool:new`):
   ```
   node scripts/create-tool.mjs \
     --id pdf-shrink --route pdf/shrink --category pdf \
     --title "PDF 용량 줄이기" --desc "..." --icon FileMinus \
     --keywords "압축,shrink,용량" --archetype file --worker
   ```
   배치는 `--spec tools.json` (객체/배열). CLI 가 page.tsx(+worker.ts)·registry 항목·lucide import·EN 카피(`--en`)를 한 번에 생성·삽입한다. 가이드·HowTo·OG 는 prebuild + `og:gen` 이 자동 파생.
3. **핵심 로직 구현** — 생성된 page.tsx(+worker)의 `// TODO` 를 실제 처리로 교체 (wasm-engineer / tool-builder).
4. **검증** — `npm run build` (tsc + next build) 통과 확인. 필요 시 `npm run og:gen`.
5. **결과 보고** — 추가된 파일 목록 + 허브에서 보이는지 확인 안내.

CLI 가 자동 검증하는 것: 카테고리 유효성, id 충돌(registry grep), route 디렉터리 존재(--force 로 덮어쓰기).

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
