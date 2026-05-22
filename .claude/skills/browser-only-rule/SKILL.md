---
name: browser-only-rule
description: 모든 도구는 브라우저에서만 동작. Node 전용 모듈·API Route·서버 처리 금지 원칙과 검증 절차.
---

# Browser-Only 원칙

`web-toolkit` 의 단일 미션:

> **사용자 파일은 서버로 전송되지 않는다.**

이 원칙에서 다음 금지가 도출된다.

## 금지 목록

### Node 전용 모듈
```ts
// ✗ 절대 금지
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { Buffer } from 'buffer';  // (Node Buffer)
```

브라우저 대체:
```ts
// ✓
const buf = await file.arrayBuffer();
const u8 = new Uint8Array(buf);
const text = await file.text();
const blob = new Blob([u8], { type: 'application/pdf' });
```

### API Route
- `web/src/app/api/**` 신규 생성 금지
- 기존 `/api/agent`, `/api/install` 등은 _legacy 이전 대상 (legacy-pruner 참조)

### 서버 액션 (Server Actions)
- 도구 처리에는 사용하지 않음
- 폼 제출 후 서버 처리 = browser-only 원칙 위배

### 외부 API 호출
- 사용자 파일을 외부 서비스로 보내는 도구 금지 (OCR.space, Cloudconvert 등)
- 예외: 사용자가 명시적으로 파일이 아닌 텍스트/URL 만 보내는 경우 (예: URL → QR)

## 허용 목록

- WASM 자산 다운로드 (FFmpeg core, Tesseract lang pack 등)
- 정적 JSON·CSV (라이브러리 메타데이터)
- 폰트 다운로드
- 분석 (Plausible, Vercel Analytics — 사용자 데이터 미포함)

## 검증 방법

### 코드 검색
```bash
grep -rn "from 'fs'" web/src/
grep -rn "from 'path'" web/src/
grep -rn "from 'child_process'" web/src/
grep -rn "use server" web/src/app/tools/
grep -rn "fetch.*upload" web/src/app/tools/
```

### Network 탭
도구 사용 중 DevTools Network 탭 확인:
- 사용자 파일이 outgoing 요청에 들어있으면 위반
- WASM/lang pack/static asset 만 다운로드 OK

## 예외 검토 절차

새 도구가 외부 처리를 정말 필요로 한다면:
1. 다른 도구로 분리 (별도 카테고리 `ai-online` 같은 식)
2. 사용자에게 명확히 고지 ("이 도구는 입력을 외부 서비스로 전송합니다")
3. CLAUDE.md 미션 문구 갱신 필요 → 사용자 승인 필수

브라우저로 못 옮기는 도구는 추가하지 않는 게 기본.

## 좋은 패턴

```ts
// ✓ 'use client' 페이지에서 파일 처리
'use client';
const buf = await file.arrayBuffer();
const result = await processInBrowser(buf);
```

## 나쁜 패턴

```ts
// ✗ 서버로 업로드
const form = new FormData();
form.append('file', file);
await fetch('/api/process', { method: 'POST', body: form });
```
