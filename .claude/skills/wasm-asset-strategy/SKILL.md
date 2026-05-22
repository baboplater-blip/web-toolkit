---
name: wasm-asset-strategy
description: 큰 WASM/모델 자산(FFmpeg core, Tesseract lang pack, ONNX 모델)의 배치·캐싱·preload·CDN 폴백 전략.
---

# WASM·모델 자산 전략

도구마다 다른 큰 자산(수십~수백 MB)을 효율적으로 배포한다.

## 자산 위치 규칙

`web/public/` 하위에 카테고리 폴더로 정리:

```
web/public/
├── ffmpeg/                   # FFmpeg.wasm core
│   ├── ffmpeg-core.js
│   ├── ffmpeg-core.wasm
│   └── ffmpeg-core.worker.js
├── pdfjs/                    # PDF.js worker
│   └── pdf.worker.min.js
├── tessdata/                 # Tesseract 언어팩
│   ├── eng.traineddata
│   └── kor.traineddata
├── onnx/                     # ONNX 모델 (배경제거 등)
│   └── briaai-rmbg-1.4.onnx
└── upscale/                  # 업스케일 모델
    └── esrgan-x4.onnx
```

CDN 폴백을 코드에서 처리할 수 있게 환경변수 또는 상수로:

```ts
const FFMPEG_BASE = process.env.NEXT_PUBLIC_FFMPEG_CDN ?? '/ffmpeg';
```

## 로드 시점

**절대 페이지 진입 시 로드 금지.** 사용자가 "처리 시작" 클릭한 직후에만:

```ts
async function handleProcess() {
  setLoading(true);
  setStage('엔진 로드 중');
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  });
  setStage('처리 중');
  // ...
}
```

## 캐싱

브라우저 HTTP 캐시가 자동 처리하지만 큰 자산은 의도적으로 강화:

### Service Worker 사전 캐시 (옵션)
첫 로드 후 다음 방문 시 즉시 사용 가능:

```ts
// web/src/sw.ts (또는 next-pwa 설정)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('wasm-v1').then((c) => c.addAll([
    '/ffmpeg/ffmpeg-core.js',
    '/ffmpeg/ffmpeg-core.wasm',
  ])));
});
```

### Cache-Control 헤더
`next.config.ts` 또는 Vercel/CF Pages 설정:
```
/ffmpeg/* → Cache-Control: public, max-age=31536000, immutable
/tessdata/* → same
```

WASM 버전 업할 때 파일명에 해시 포함하면 캐시 무효화 자동.

## preload (선택)

특정 도구 카테고리 진입 시 미리 로드 시작:

```tsx
// /tools/pdf 페이지 진입 시
<link rel="prefetch" href="/pdfjs/pdf.worker.min.js" as="script" />
```

사용자가 진짜 도구 누를 때까지 자산 다운로드 완료될 수도. 단, 모바일 데이터 절약 모드 고려해 보수적으로.

## 버전 관리

`package.json` 에서 `@ffmpeg/ffmpeg` 등 업그레이드 시:
1. `node_modules/@ffmpeg/core/dist/*` 의 새 파일을 `public/ffmpeg/` 로 복사
2. 코드의 `coreURL`·`wasmURL` 갱신
3. SW 캐시 버전 bump

자동화 스크립트:
```bash
# web/scripts/sync-wasm.sh
cp node_modules/@ffmpeg/core/dist/umd/* public/ffmpeg/
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdfjs/
```

## 크기 별 전략

| 자산 크기 | 전략 |
|-----------|------|
| < 50 KB | 일반 import 가능 (작은 워커 등) |
| 50 KB - 1 MB | dynamic import, 사용 시점 로드 |
| 1 MB - 10 MB | dynamic + 사용자에게 "엔진 로드 중" 표시 |
| 10 MB+ | dynamic + SW 사전 캐시 검토 + 모바일 경고 |

## 모바일 데이터 경고

10MB+ 자산을 처음 로드할 때:

```tsx
{loadStage === 'engine' && (
  <p className="text-xs text-muted-foreground">
    엔진을 다운로드하고 있어요 (약 20 MB). Wi-Fi 환경을 권장합니다.
  </p>
)}
```
