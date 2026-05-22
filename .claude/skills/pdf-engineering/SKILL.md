---
name: pdf-engineering
description: PDF 작업의 라이브러리 선택(pdf-lib vs PDF.js)·암호화·래스터 폴백·메모리 관리 가이드.
---

# PDF 엔지니어링

## 라이브러리 선택 매트릭스

| 작업 | 도구 |
|------|------|
| 페이지 합치기·분할·삽입·삭제·복제 | `pdf-lib` |
| 페이지 회전 | `pdf-lib` |
| 이미지 → PDF | `pdf-lib` |
| 텍스트·이미지 워터마크 | `pdf-lib` |
| 페이지 번호 삽입 | `pdf-lib` |
| 페이지 박스 자르기(crop) | `pdf-lib` (MediaBox/CropBox 수정) |
| 암호화(권한·열람) | `pdf-lib` 의 `encrypt` 옵션 (제한적) |
| PDF → 이미지(렌더) | `pdfjs-dist` |
| 텍스트 추출 | `pdfjs-dist` (`getTextContent`) |
| 썸네일 생성 | `pdfjs-dist` |
| 잠금 해제(권한 제거) | `pdfjs-dist` 로 렌더 후 `pdf-lib` 로 새 PDF 조립 |
| 복구(손상 PDF) | 1차: `pdf-lib` `ignoreEncryption: true` → 2차: PDF.js 렌더 폴백 |

**두 라이브러리 동시 로드는 번들 부담.** 한 도구 안에서 둘 다 필요하면 dynamic import 로 순차 로드.

## pdf-lib 핵심 패턴

### 합치기
```ts
import { PDFDocument } from 'pdf-lib';

const merged = await PDFDocument.create();
for (const file of files) {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = await merged.copyPages(src, src.getPageIndices());
  pages.forEach((p) => merged.addPage(p));
}
const out = await merged.save();
return new Blob([out], { type: 'application/pdf' });
```

### 회전
```ts
import { degrees } from 'pdf-lib';
doc.getPages().forEach((p) => p.setRotation(degrees(90)));
```

### 워터마크
```ts
import { rgb, StandardFonts } from 'pdf-lib';
const font = await doc.embedFont(StandardFonts.HelveticaBold);
doc.getPages().forEach((p) => {
  p.drawText('CONFIDENTIAL', {
    x: 50, y: 50, size: 50, font,
    color: rgb(0.95, 0.1, 0.1), opacity: 0.3,
    rotate: degrees(45),
  });
});
```

한글 워터마크는 `StandardFonts` 가 지원 안 함 → 별도 한글 폰트 임베드 필요 (Noto Sans KR 등) — 번들에 OTF 추가하거나 fontkit + 동적 fetch.

## PDF.js 핵심 패턴

### 페이지 렌더 (이미지 추출)
```ts
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

const doc = await pdfjs.getDocument({ data: bytes }).promise;
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
  const jpg = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 0.92));
}
```

### 텍스트 추출
```ts
const page = await doc.getPage(i);
const tc = await page.getTextContent();
const text = tc.items.map((it: any) => it.str).join(' ');
```

## 잠금 해제 패턴 (2단계)

1차: 권한 암호만 걸린 PDF → `pdf-lib.load(..., { ignoreEncryption: true })` 후 다시 save
2차: 열람 암호 PDF → 사용자에게 비밀번호 입력 받고, 안 되면 PDF.js 로 렌더 후 이미지로 재조립(품질 손실 + 텍스트 사라짐 경고)

## 큰 PDF (>50MB)

- 워커에서 처리 (메인 차단 방지)
- `ArrayBuffer` 를 `postMessage` 의 transferable 로 전달
- 페이지별로 진행률 보고
- 메모리 GC 유도: 처리 완료 페이지의 reference 제거

## 자주 발생하는 실패

- 암호화 PDF → `Encrypted PDF` 에러 → `ignoreEncryption: true` 추가
- 손상 헤더 → `PDFDocument.load` 던짐 → try/catch + PDF.js 폴백
- 한글 추출 누락 → ToUnicode CMap 없는 폰트. PDF.js 의 `getTextContent({ disableNormalization: false })` 시도
