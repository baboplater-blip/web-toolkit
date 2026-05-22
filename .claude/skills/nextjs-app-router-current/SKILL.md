---
name: nextjs-app-router-current
description: 본 프로젝트의 Next.js 는 학습 데이터와 다를 수 있다. 코드 작성 전 node_modules/next/dist/docs/ 의 가이드를 먼저 읽는 절차.
---

# Next.js — 현재 설치된 버전을 우선 참조

[`web/AGENTS.md`](../../../web/AGENTS.md) 의 경고:

> 이 Next.js 는 학습 데이터와 다를 수 있다. API·관례·파일 구조가 모두 다를 수 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/` 의 해당 가이드를 먼저 읽어라. deprecation 경고를 무시하지 마라.

## 절차

1. **버전 확인**
   ```bash
   cd web && cat package.json | grep '"next"'
   ```

2. **관련 docs 찾기**
   ```bash
   find web/node_modules/next/dist/docs -type f -name "*.md" | head -20
   ls web/node_modules/next/dist/docs/
   ```

3. **읽고 적용**
   - 학습 데이터의 패턴과 다르면 → docs 의 패턴을 따른다
   - 학습 데이터에서 본 API 가 deprecation 표시되어 있으면 → 신 API 사용
   - 새 패턴이면 → docs 의 예시 코드를 직접 인용

## 자주 확인해야 하는 주제

- **App Router vs Pages Router** — 본 프로젝트는 App Router (`web/src/app/`)
- **server vs client component** — `'use client'` 디렉티브 위치
- **metadata** — `generateMetadata` 함수 또는 `metadata` 객체 export
- **route handlers** — `app/api/.../route.ts` (사용 금지지만 패턴은 참고)
- **dynamic import** — `next/dynamic` 의 `ssr: false` 옵션
- **headers / cookies** — `next/headers` 동작 (sync/async)
- **caching** — `fetch` 의 `cache` 옵션, `revalidate`, `force-dynamic`
- **link / image** — `next/link`, `next/image`

## 변경 시 검증

코드 작성 후:
```bash
cd web && npm run build
```

deprecation 경고가 보이면:
1. 해당 API 의 신 버전 찾기
2. 교체
3. 재빌드

## 패턴 불일치 예시 (가설)

학습 데이터가 오래된 패턴을 알려줄 수 있는 영역:
- `useFormState` → `useActionState`
- `cookies()` sync → async
- `headers()` sync → async
- Server Action 시그니처 변경
- Image `priority` prop 의미 변경

확신이 없으면 docs 를 직접 열어라. 학습 데이터의 자신감보다 현재 docs 가 진실.

## 안 잡힐 때

docs 에 명확한 답이 없으면:
1. `web/node_modules/next/dist/*.d.ts` 타입 정의 보기
2. Next.js 공식 changelog (`web/node_modules/next/CHANGELOG.md` 또는 GitHub release)
3. 그래도 모르면 사용자에게 묻기
