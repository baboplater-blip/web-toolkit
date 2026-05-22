---
name: registry-add
description: 신규 도구를 web/src/lib/tools/registry.ts 에 추가하는 절차와 체크리스트. id·카테고리·키워드·아이콘·phase 결정.
---

# Registry 항목 추가

신규 도구는 **페이지 + registry** 항상 한 쌍이다. 페이지만 만들면 허브에서 보이지 않고, registry 만 추가하면 404.

## ToolMeta 필드

```ts
{
  id: 'pdf-shrink',                          // 전역 유니크
  title: 'PDF 용량 줄이기',                   // UI 표시명 (도구 카드)
  description: 'PDF 를 다시 압축해 용량 감소.', // 카드 부제 (1줄)
  href: '/tools/pdf/shrink',                  // 실제 페이지 경로
  category: 'pdf',                            // 카테고리 (URL prefix 와 일치)
  icon: FileMinus,                            // lucide-react 아이콘
  status: 'ready',                            // 'ready' 또는 'planned'
  phase: 7,                                   // 구현 시점 그룹
  keywords: ['압축', '용량', 'compress', 'shrink'],
}
```

## id 규칙

- `{category}-{slug}` 형식 권장 (`pdf-merge`, `image-resize`)
- 전역 유니크 — 같은 id 두 번 들어가면 검색에서 중복
- snake_case 금지, kebab-case 만

## href 규칙

- 반드시 `/tools/{category}/{slug}` 형식
- 카테고리와 일치 (`category: 'pdf'` → `href: '/tools/pdf/...'`)
- 페이지 파일과 1:1 (`page.tsx` 가 같은 경로에)

## icon 선택 (lucide-react)

| 의미 | 아이콘 |
|------|--------|
| 합치기 | `Merge` |
| 분할 | `SplitSquareHorizontal`, `Scissors` |
| 회전 | `RotateCw` |
| 압축 | `Archive`, `FileMinus` |
| 변환 | `Repeat`, `Shuffle` |
| 이미지 일반 | `FileImage`, `Image` |
| PDF 일반 | `FileText` |
| 비디오 | `FileVideo`, `Film`, `Clapperboard` |
| 오디오 | `Music`, `Volume2` |
| 텍스트 | `Type`, `FileText` |
| 보안 | `ShieldOff`, `FileLock`, `KeyRound` |
| AI | `Wand2`, `Eraser`, `ScanText` |

추상 아이콘(`Wand2`, `Hexagon`) 남발 금지. 의미가 직관적인 것 우선.

## keywords 규칙

- **한·영 둘 다** 최소 1개씩
- 사용자가 검색 박스에 칠 법한 단어 모두
- 파일 확장자도 포함 (`mp4`, `jpg`, `webp`)
- 기술 용어 1개 OK (`ffmpeg`, `tesseract`) — 개발자 검색 대응

좋은 예:
```ts
keywords: ['압축', '용량', '줄이기', 'compress', 'shrink', 'reduce']
```

나쁜 예:
```ts
keywords: ['압축']                  // 영문 없음
keywords: ['shrink', 'reduce']      // 한글 없음
keywords: ['도구', 'tool']          // 너무 일반적, 검색 의미 없음
```

## phase 규칙

기존 `TOOLS` 배열은 `// ---- Phase N: ... ----` 주석으로 묶여있다:

| Phase | 그룹 |
|-------|------|
| 1 | 고빈도 PDF |
| 2 | 이미지 |
| 3 | 보안/편집 |
| 4 | AI |
| 5 | 비디오 & GIF |
| 6 | 오디오 & 유틸 |
| 7 | 문서 변환 / 텍스트 / 개발자 |

신규 도구가 명확한 그룹에 들어가면 해당 그룹 마지막에 추가. 새로운 카테고리/시점이면 phase 7 로.

## 추가 후 검증

```bash
cd web && npm run build
```

빌드 통과 + `/tools` 허브에서 새 카드 + 검색·카테고리 필터 동작 확인.

## 자주 발생하는 실수

- `category` 와 `href` 불일치 → audit-tools 가 잡음
- `import { ... } from 'lucide-react'` 에 아이콘 추가 누락 → 빌드 에러
- `status: 'planned'` 인데 페이지 이미 존재 → ready 로 승격해야 함
- 동일 id 두 번 → 검색 결과 중복
