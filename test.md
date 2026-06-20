# test.md — 검증 체계 (최종 심판)

> 이 문서는 한 라운드가 **진짜로 끝났는지** 판정하는 게이트와 절차를 담는다.
> [goal.md](goal.md)의 Definition of Done 은 곧 "이 게이트 전부 초록불"이다.
> 하나라도 빨간불이면 라운드는 **미완**. 커밋·푸시·완료보고 금지.
> 작업 디렉터리: `web-toolkit/web/`

---

## 1. 게이트 순서 (반드시 이 순서, 끝까지)

| # | 게이트 | 명령 | 통과 기준 |
|---|---|---|---|
| 1 | 타입 | `npx tsc --noEmit` | exit 0 (에러 0) |
| 2 | 린트 | `npm run lint` | **신규 게이팅 0** (※ no-`<a>`/set-state-in-effect 베이스라인은 비게이팅) |
| 3 | 단위 | `npm test` (vitest) | 전 케이스 통과 |
| 4 | 빌드 | `npm run build` | 성공 + 페이지 수 status.md 예상치 부합 |
| 5 | 예산 | `npm run budget` | gzip First-Load JS 게이트 통과(도구·허브 임계) |
| 6 | 정합성 | `npm run audit` | registry 전수 통과 (415/415) |
| 7 | e2e | `npm run test:e2e` | 전 스펙 통과 (아래 §3) |

> ⚠ 함정: `tsconfig.tsbuildinfo` stale 로 유령 에러가 보이면 → 삭제(`rm -f tsconfig.tsbuildinfo`) 후 tsc 재실행.

## 2. e2e 실행 환경 (정적 export 서빙)

빌드 산출물 `out/` 을 정적 서버로 띄운 뒤 Playwright 를 붙인다:

```bash
# 1) 별도 프로세스로 정적 서버 (background)
npx serve out -l 3000
# 2) base url 지정해 e2e
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npm run test:e2e
```

> ⚠ 함정: 서버 기동·serve·curl·playwright 를 한 줄 compound 로 묶고 그 안에 작은따옴표
> 인자(PAT 등)를 넣으면 셸 eval 실패 → **서버 기동과 테스트는 분리 실행**.

## 3. e2e 스펙 목록 (`web/e2e/`) — 무엇을 지키는가

| 스펙 | 가드 대상 |
|---|---|
| `all-tools-smoke.spec.ts` | **전 도구(415) + 허브 마운트** — HTTP200 + heading + pageerror 0 |
| `guide-custom.spec.ts` | 맞춤가이드 자동생성 꼬리말 부재 + 음성대조 + 클러스터 교차링크 |
| `use-cases.spec.ts` | 유스케이스 렌더 + step 링크 + HowTo 스키마 + 하이드레이션 0 |
| `compares.spec.ts` | 비교 두 도구 링크 + 하이드레이션 0 (로케일별 링크형태 분기) |
| `new-tools.spec.ts` | 신규 팩 도구 스모크 + 기능 |
| `deeplink.spec.ts` | URL 상태 딥링크(마운트 후 읽기) |
| `lazy-overlays.spec.ts` | 지연 로드 런처 3종 트리거 |
| `command-palette.spec.ts` | Ctrl+K 팔레트 |
| `hub.spec.ts` · `navigation.spec.ts` · `back-button.spec.ts` | 탐색·뒤로가기 |
| `en-routes.spec.ts` | 영문 라우트 골든패스 |
| `dev-tools.spec.ts` · `text-tools.spec.ts` · `office-tools.spec.ts` | 카테고리 기능 |
| `folder-mode.spec.ts` · `blur-face.spec.ts` · `ad-slots.spec.ts` · `admin.spec.ts` | 개별 기능 |

> 도구 추가 시 **`all-tools-smoke.spec.ts` 의 TOOL_ROUTES 배열 + describe 라벨 수**를 갱신.
> 맞춤가이드 추가 시 `guide-custom.spec.ts` 의 `CUSTOM_GUIDE_IDS` 스냅샷 갱신.

## 4. 파리티·죽은링크 검증 스크립트 (라운드별 수동 확인)

게이트 외에, 다국어/링크 무결성은 매 콘텐츠 라운드에서 확인한다:

- **키셋 차집합 0** — en/ja/zh-tools 키 정렬 후 `comm` diff 가 비어야 함 (EN=JA=ZH).
- **registry id/href 대조** — 가이드 인라인링크·클러스터·유스케이스 step.href·compare toolId 가 전부 실재 → 죽은 id 0.
- **중복 0** — slug/키 중복 없음.
- **toolId-in-en-tools** — compare 의 toolId 는 en-tools 에 큐레이트되어 있어야 함.

## 5. 완료 판정 체크리스트 (이걸로 "끝났다" 선언)

- [ ] 게이트 1~7 전부 초록불
- [ ] §4 파리티·죽은링크 검증 통과(콘텐츠 라운드일 때)
- [ ] 신규 표면 파리티 달성 **또는** 미완 표면을 [status.md](status.md)에 후속 명기
- [ ] `origin/master` 커밋·푸시·동기화(ahead 0)
- [ ] CLAUDE.md 변경이력 + 사용자 메모리 + status.md 갱신
- [ ] 한국어 완료 요약 + 묶음 다음 후보(추천 N번) 제시

> 위 6칸이 모두 체크될 때만 [goal.md](goal.md)의 DoD 충족 = 라운드 완료.
> 비게이팅 경고(마크다운 lint, no-`<a>`/set-state-in-effect eslint 베이스라인)는 통과로 본다.
