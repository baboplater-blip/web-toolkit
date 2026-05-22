---
name: tesseract-ocr
description: Tesseract.js 사용 시 언어팩 로딩·전처리·신뢰도·워커 재사용 패턴.
---

# Tesseract.js OCR

## 셋업

```ts
import { createWorker } from 'tesseract.js';

const worker = await createWorker(['kor', 'eng'], 1, {
  // langPath: '/tessdata',                 // 자체 호스팅 시
  // workerPath: '/tesseract/worker.min.js',
  // corePath: '/tesseract/tesseract-core.wasm.js',
});
```

언어팩 자체 호스팅 (오프라인·CDN 의존 제거) 시 `public/tessdata/{lang}.traineddata` 배치 + `langPath: '/tessdata'`.

## 인식 호출

```ts
const { data } = await worker.recognize(file, {
  rotateAuto: true,
});

console.log(data.text);           // 전체 텍스트
console.log(data.confidence);     // 0-100
console.log(data.words);          // 단어별 박스+신뢰도
```

## 한국어 OCR 품질 팁

- **해상도** — 300 DPI 이상 권장. 모바일 사진은 보통 충분, 스캔본은 확인
- **전처리** — 흑백 변환 + 대비 강화로 신뢰도 ~15% 향상
- **회전** — `rotateAuto: true` 또는 사전에 EXIF orientation 처리
- **블록 분리** — `tessedit_pageseg_mode: 6` (단일 블록) 시 한국어 표 인식 향상
- **숫자만** — `tessedit_char_whitelist: '0123456789'`

## 전처리 (Canvas)

```ts
function preprocess(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
    const bin = v < 128 ? 0 : 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = bin;
  }
  ctx.putImageData(img, 0, 0);
}
```

## PDF OCR (페이지별)

PDF.js 로 렌더 → 각 페이지를 canvas → Tesseract 에 넘김. 페이지마다 별도 호출, 결과를 누적.

```ts
for (let i = 1; i <= doc.numPages; i++) {
  const canvas = await renderPage(doc, i);
  const { data } = await worker.recognize(canvas);
  texts.push(data.text);
  setProgress(Math.round((i / doc.numPages) * 100));
}
```

## 워커 재사용 vs 종료

- 같은 페이지에서 여러 이미지 OCR → **재사용 (terminate 금지)**
- 다른 도구로 이동 → terminate
- 메모리 한도 가까이 → terminate 후 재생성

```ts
await worker.terminate();
```

## 신뢰도 임계값

- 90+ : 신뢰 가능
- 70-90 : 일반 텍스트 OK, 숫자/이름은 검토 권장
- 60-70 : 사용자에게 "OCR 정확도가 낮습니다. 결과를 확인해주세요." 경고
- 60 미만 : 입력 이미지 품질 문제. 재촬영/스캔 권장

## 자주 발생하는 실패

- 결과가 영어 알파벳만 → 언어팩 `kor` 누락
- 빈 결과 → 이미지 너무 작음 (300px 이하) 또는 너무 큼 (>4000px → 다운샘플)
- 느림 → langs 너무 많음, 1-2개로 제한
- OOM → 동시 워커 1개로 제한, 페이지 순차 처리
