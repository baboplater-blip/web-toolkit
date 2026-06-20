# plan.md — web-toolkit 작업 계획

> 이 문서는 **어떻게(how)** 작업을 진행하는지의 표준 절차와 다음 단계 후보를 담는다.
> 목표는 [goal.md](goal.md), 불변 규칙은 [rules.md](rules.md), 현 진행은 [status.md](status.md),
> 검증은 [test.md](test.md). · 길잡이 [README.md](README.md)

---

## 🧭 이번 라운드 뭐 할까? (빠른 결정)

1. **[status.md](status.md) 의 "➡️ 다음 할 일"** 을 먼저 본다. 미완 후속이 있으면 그게 1순위.
2. 미완이 없으면 아래 §4 "다음 단계 후보" 에서 고른다 (추천 항목부터).
3. 신규 도구 팩이면 **§2 의 4단계 사이클**(카탈로그→ja·zh→맞춤가이드→발견성)을 순서대로.
4. 무엇을 하든 **§1 표준 워크플로우** 로 돌리고 **[test.md](test.md) 게이트**로 끝맺는다.

---

## 1. 표준 라운드 워크플로우 (매 기능 라운드 동일)

```
① 범위 확정 ──> ② 도메인 분할 병렬 구현 ──> ③ 전체 게이트 검증 ──> ④ 커밋·푸시
                                                  (test.md)         (origin/master)
   └──────────────> ⑤ 문서 갱신(CLAUDE.md·메모리·status.md) ──> ⑥ 한국어 완료요약 + 묶음 후보
```

1. **범위 확정** — 사용자가 고른 번호 옵션을 그 라운드의 단일 목표로 삼는다.
2. **도메인 분할 병렬** — 영역별 에이전트에 분배. 충돌 방지를 위해
   **파일 단위 단일 소유**(언어별/카테고리별 1파일 1에이전트).
3. **검증** — [test.md](test.md)의 게이트 순서를 끝까지. 하나라도 빨간불이면 라운드 미완.
4. **커밋·푸시** — 게이트 통과 후에만. `origin/master` 직접(규칙 G-19).
5. **문서 갱신** — CLAUDE.md 변경이력 prepend + 사용자 메모리 append + status.md 갱신.
6. **보고** — 한국어 완료 요약 + 6~10개 묶음 다음 후보(추천 N번 + 근거).

## 2. 신규 도구 팩 4단계 사이클 (표면 동등화)

새 도구는 한 번에 모든 표면을 만들지 않는다. 검증 가능한 4단계로 나눈다:

| 단계 | 작업 | 산출 |
|---|---|---|
| 1 | **카탈로그 생성** | registry + ko UI + EN 카피 + page.tsx (create-tool 배치) |
| 2 | **ja·zh 파리티** | ja-tools.ts·zh-tools.ts 번역(2 병렬), 키셋 EN=JA=ZH |
| 3 | **맞춤 가이드 4개국어** | 브리프(구현 정독)→guide-briefs.json→언어별 1파일 소유 4 병렬 |
| 4 | **발견성 일괄** | 클러스터(guide-related) + 유스케이스(use-cases) + 비교(compares) |

> 각 단계 끝마다 게이트 통과 + 커밋. 미완 단계는 status.md에 후속으로 명기.

## 3. 핵심 파이프라인·도구

- **create-tool CLI**: `scripts/create-tool.mjs --spec packN.json --en` — 5 아키타입
  (calc·text·generator·file·viewer) page+worker+registry+lucide+EN 일괄 스캐폴드.
- **브리프 우선 다국어**: 브리프 에이전트가 page.tsx 정독 → 구현 기반 브리프 →
  언어별 4 에이전트가 각자 1파일만 작성(언어 일관성 + 충돌 0).
- **검색 인덱스 분리**: 무거운 본문 데이터는 서버 전용, `search-index.generated.ts`
  (prebuild 자동 생성)만 클라이언트로.
- **지연 로드 런처 3종**: CommandPalette·CategoryDrawer·ShortcutsOverlay
  (트리거 시 next/dynamic).

## 4. 다음 단계 후보 (라운드 진입 시 갱신)

직전 사이클(팩6) 기준 잔여 — **추천 순서**:

1. **(추천) 팩6 30종 맞춤 가이드 4개국어 편입** — CUSTOM_GUIDES 155→185.
   브리프 우선 파이프라인 재사용. 고트래픽 신규 도구(css-grid·bmr·business-days·
   html-to-markdown·cc-type·base58 등) SEO 본문 강화. *근거: 직전 팩5와 동일 사이클의 다음 칸, 검증 패턴 이미 확립.*
2. **팩6 30종 발견성 일괄(클러스터+유스케이스+비교)** — 3표면 한 라운드 동등화.
   *근거: 4단계 사이클의 마지막 칸, 완료 시 팩6 전 표면 완비.*
3. **신규 도구 팩7** — 다음 30여 종 발굴·생성(1단계부터).
4. **성능/번들 다이어트** — heic2any WASM 대체 등(잔여 큰 후보).
5. **SEO 허브 품질 2차** — 자동생성 문장 → 구현 기반 native 콘텐츠 확대.
6. **단위 테스트 확대** — 도구 순수 로직 추가 추출 + vitest 케이스.

## 5. 에이전트 라우팅 (How to apply)

- 도구 추가/수정 → `tool-architect` → `tool-builder`
- 다국어/가이드 콘텐츠 → 브리프 에이전트 + 언어별 senior-clean-coder
- 성능/번들 회귀 → `perf-profiler` + `/perf-check`
- registry 정합성 → `registry-curator` + `/audit-tools`
- 배포 → `release-captain`
