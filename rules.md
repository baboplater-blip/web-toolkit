# rules.md — 절대 건드리면 안 되는 규칙

> 이 문서의 규칙은 **불변(invariant)** 이다. 어떤 라운드도 이를 위반하면 안 된다.
> 위반은 곧 작업 실패다. 편의·속도를 이유로 우회하지 않는다.
> 새 규칙 추가는 가능하나, 기존 규칙 완화·삭제는 **사용자 명시 승인** 필요.

---

## A. 보안·아키텍처 (browser-only) — 최우선

1. **사용자 파일은 절대 서버로 전송하지 않는다.** 모든 처리는 브라우저 로컬.
2. **API Route 추가 금지.** `app/api/**` 신설 금지.
3. **Node 전용 모듈 금지** (런타임 코드에서 `fs`·`path`·`child_process` 등 import 금지).
   - 단, `scripts/**` 빌드 스크립트는 예외(빌드타임 Node 실행).
4. 무거운 작업은 **Web Worker + WASM**, 큰 WASM 은 `dynamic import` 로 격리.

## B. 정적 export 제약

5. **`output: 'export'` 환경이다.** `next/link` 사용 금지 → 네이티브 `<a>` 태그 사용.
   (이것과 set-state-in-effect 는 문서화된 **비게이팅 eslint 베이스라인**.)
6. 서버 전용 API(요청 헤더·쿠키·동적 라우트 런타임 등) 사용 금지.

## C. 하이드레이션 안전 (정적 프리렌더 일치)

7. `'use client'` 페이지도 정적 export 로 **프리렌더**된다. 따라서 **초기 렌더에**
   아래를 직접 쓰지 않는다:
   - `Date.now()` / `new Date()` / `Math.random()`
   - `crypto.getRandomValues()` / `crypto.randomUUID()`
   - `localStorage` 읽기
8. 비결정적 값은 **결정적 초기값 + 마운트 후 `useEffect` 주입**, 또는 **사용자 동작(클릭/제스처) 시점**에만 생성. 의도된 set-state-in-effect 는 disable 주석으로 명시.

## D. 도구 페이지 표준

9. 신규 도구 페이지는 공용 **`ToolHeader`** 사용(sticky 헤더 직접 작성 금지).
   ToolHeader 쓰면 본문 내 기존 `<header>`/`<h1>` 은 **반드시 제거**(중복 h1 금지).
10. `create-tool` CLI 아이콘 함정: `Image`=DOM 전역과 충돌 → `ImageIcon`.
    이미 다른 별칭(`Hash as HashIcon`)으로 import 중이면 신규 항목도 별칭명으로.
11. 도구 추가 시 **registry(`lib/tools/registry.ts`) 항목 + EN 카피(`en-tools.ts`)** 동반.

## E. 다국어 파리티

12. 다국어 카탈로그(en/ja/zh)는 **키셋이 동일**해야 한다(EN=JA=ZH).
13. 맞춤가이드·비교는 **언어별 1파일 소유** 원칙으로 작성(병렬 충돌 0).
14. 가이드 인-프로즈 내부링크 `[label](guide:id)` 의 id 는 **registry 대조 필수**(죽은 id 0).
15. compare/use 페이지 도구 링크 형태는 로케일별 상이:
    ko=`/tools/{cat}/{href세그먼트}`, en·ja·zh=`/{loc}/tools/{registry-id}`
    (세그먼트≠id 인 도구 예: `bmi` vs `bmi-calc`) — e2e 검증 시 분기 필요.

## F. 산출물·소통

16. **사용자용 모든 문서·보고서·가이드는 한국어**로 작성한다.
17. 승인/실행 직전 무엇을 진행하는지 **한 줄 이상 한국어로 명시**한다.
18. 다음 후보 제시는 **6~10개 카테고리 묶음 + "추천: N번" + 근거**. 열린 질문만으로 끝내지 않는다.

## G. 배포·커밋

19. 사용자가 **"커밋 배포"/"배포해"/"푸시해"** 라고 하면 `origin/master` 직접 push 명시 승인으로 해석.
20. 게이트가 모두 초록불이기 **전에는 커밋하지 않는다**(test.md 기준).
21. 옛 도메인 `agent-control-panel-phi.vercel.app` 은 **현재 유일 라이브 alias** — 코드·docs fallback의 옛 이름은 **의도된 것**, 잔재 아님. 임의 제거 금지.

## H. 비밀정보

22. PAT·키 등 비밀정보를 **코드·커밋·문서에 평문으로 넣지 않는다.**
    (`가이드.ini` 의 GitHub PAT 노출 건은 별도 조치 권고 — status.md 참조.)
