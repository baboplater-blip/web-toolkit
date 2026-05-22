---
description: registry와 실제 페이지 파일의 정합성 검사 - 고아 항목·고아 페이지·중복·키워드 누락 점검
---

# /audit-tools

`web/src/lib/tools/registry.ts` 와 실제 페이지(`web/src/app/tools/**/page.tsx`) 의 일관성을 검사한다.

## 검사 항목

1. **고아 registry 항목** — registry 에는 있지만 페이지 파일 없음
2. **고아 페이지** — page.tsx 는 있지만 registry 누락
3. **중복 id** — 같은 `id` 가 여러 번 등장
4. **카테고리 ↔ URL 불일치** — `category: 'pdf'` 인데 `href: '/tools/util/...'`
5. **키워드 부족** — 한국어만 또는 영어만, 또는 3개 미만
6. **아이콘 import 누락** — registry 에서 사용하는 아이콘이 `lucide-react` import 에 없음
7. **status 부정확** — `'planned'` 인데 페이지 존재, 또는 반대
8. **phase 정렬 오류** — 같은 그룹 안에서 phase 가 뒤섞임

## 실행 절차

1. `registry.ts` 의 `TOOLS` 배열 파싱
2. `web/src/app/tools/**/page.tsx` glob 으로 실제 페이지 목록
3. 두 집합 비교
4. 각 항목별 키워드·아이콘·카테고리·status 검증
5. 리포트 출력

## 출력 형식

```markdown
# Tools Audit Report

## 정합성 (✓ Pass / ✗ Fail)

✓ 56개 registry 항목 ↔ 56개 페이지 매칭
✗ 고아 페이지 1건: /tools/image/foo (registry 누락)
✗ 중복 id 1건: 'compress' 2회 등장

## 키워드

⚠ 한·영 균형 부족 3건:
  - pdf-shrink: ['압축'] → 영문 키워드 누락
  - image-foo: ['resize'] → 한글 키워드 누락
  - ...

## 처방

→ registry-curator 호출하여 위 8건 수정
```

종료 코드: Fail 1건 이상이면 `exit 1` 동등 처리.

## 추가 제안

수정 사항이 작으면 `registry-curator` 가 자동 수정 후 빌드 검증. 큰 변경이면 처방 리스트만 보고하고 사용자 승인 후 진행.
