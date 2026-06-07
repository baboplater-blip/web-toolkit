# 기여 가이드 (web-toolkit)

브라우저 안에서 완결되는 도구 모음에 기여해 주셔서 감사합니다. 이 프로젝트의 **1원칙**은 단순합니다.

> **사용자가 올린 파일은 절대 서버로 전송하지 않는다.** 모든 변환·압축·OCR·AI 추론은 브라우저(Web Worker + WASM) 안에서 처리한다.

이 원칙에서 다음 제약이 파생됩니다.

- API Route(`web/src/app/api/**`) 추가 금지
- Node 전용 모듈(`fs`·`path`·`child_process`) 금지 — 도구 코드는 모두 클라이언트 컴포넌트
- 무거운 처리는 Web Worker, 큰 WASM은 동적 import(lazy load)

## 개발 환경

```bash
cd web
npm install
npm run dev        # 개발 서버
npm run build      # tsc + 정적 export
npm run check      # tsc + eslint
```

## 새 도구 추가 (권장 경로)

손으로 파일을 짜지 말고 **스캐폴딩 CLI**를 사용하세요.

```bash
cd web
node scripts/create-tool.mjs \
  --id my-tool --route util/my-tool --category util \
  --title "내 도구" --desc "한 줄 설명." --icon Wrench \
  --keywords "키워드,keyword" --archetype calc \
  --en --en-name "My Tool" --en-tagline "..." --en-desc "..." --en-keywords "..."
```

- **아키타입**: `calc`(계산기·변환기) · `text`(텍스트 변환) · `generator`(Canvas 생성) · `file`(파일 처리, `--worker` 로 Web Worker) · `viewer`(읽기 전용 뷰어)
- CLI가 `page.tsx`(+worker)·`registry.ts` 항목·lucide 아이콘 import·영문 카피(`--en`)를 한 번에 생성합니다.
- 가이드(`/guide`·`/en/guide`)·HowTo 구조화 데이터·OG 이미지는 `prebuild`와 `npm run og:gen` 이 registry에서 자동 파생합니다.
- 생성된 `page.tsx`의 `// TODO` 핵심 로직을 실제 동작 코드로 채우세요. **얇은 더미 페이지는 받지 않습니다 — 실제로 동작해야 합니다.**

배치 추가는 `--spec tools.json`(객체/배열)을 사용하세요.

## 품질 게이트 (PR 전 통과 필수)

```bash
cd web
npm run check      # tsc --noEmit + eslint
npm run build      # 정적 export 성공
npm run audit      # registry ↔ 페이지 정합성 (고아·중복·아이콘·키워드)
npm run budget     # gzip First-Load JS 예산 (회귀 차단)
```

추가 규칙:
- 첫 줄 `'use client'`, UI·에러 메시지는 한국어 + 에러는 `role="alert"`
- 키워드는 한·영 둘 다, 최소 5개
- 외부 네트워크 의존 금지(처리 중 서버 호출 없음)
- 모바일 브레이크포인트(`sm:`/`md:`) 고려, 키보드 접근성 유지

## 라이선스

기여물은 [MIT 라이선스](LICENSE)로 배포됩니다.
