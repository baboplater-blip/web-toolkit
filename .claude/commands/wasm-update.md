---
description: FFmpeg / PDF.js / Tesseract / 모델 자산을 node_modules 의 최신본으로 동기화
---

# /wasm-update

`@ffmpeg/core`, `pdfjs-dist`, `tesseract.js` 등이 npm 으로 업데이트된 뒤 `public/` 의 정적 자산도 함께 동기화해야 한다. 이 커맨드가 그것을 자동화한다.

## 동기화 대상

| 라이브러리 | 출처 | 도착 |
|-----------|------|------|
| FFmpeg core | `node_modules/@ffmpeg/core/dist/umd/*` | `public/ffmpeg/` |
| PDF.js worker | `node_modules/pdfjs-dist/build/pdf.worker.min.js` | `public/pdfjs/` |
| Tesseract worker/core | `node_modules/tesseract.js/dist/worker.min.js` 등 | `public/tesseract/` |
| Tesseract lang pack | (별도 다운로드) | `public/tessdata/` |
| ONNX 모델 | (별도 관리) | `public/onnx/` |

## 절차

1. **버전 확인**
   ```bash
   cd web
   cat package.json | grep -E '@ffmpeg|pdfjs-dist|tesseract.js'
   ```

2. **자산 복사**
   ```bash
   cp node_modules/@ffmpeg/core/dist/umd/* public/ffmpeg/
   cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdfjs/
   cp node_modules/tesseract.js/dist/worker.min.js public/tesseract/
   ```

3. **버전 매니페스트 갱신** — `public/wasm-versions.json` (있다면):
   ```json
   {
     "ffmpeg": "0.12.x",
     "pdfjs": "4.x.x",
     "tesseract": "5.x.x"
   }
   ```

4. **빌드 검증**
   ```bash
   npm run build
   ```

5. **회귀 점검** — `qa-tester` 표준 시나리오 (큰 파일, 손상 입력) 1회 실행. WASM 메이저 업그레이드 시 API 변화 가능성.

## 출력

```markdown
# /wasm-update

복사 완료:
- public/ffmpeg/ ← 0.12.10
- public/pdfjs/ ← 4.5.136
- public/tesseract/ ← 5.1.1

빌드: OK
회귀: pdf-merge / video-trim 검증 PASS
```

## 주의

- 메이저 업그레이드(예: ffmpeg 0.11→0.12)는 API 변경 가능 → wasm-engineer 가 코드 호환성 검토
- public/ 의 파일은 git 에 커밋. node_modules 는 .gitignore
- 새 모델·언어팩 추가는 별도 다운로드 후 같은 폴더에
