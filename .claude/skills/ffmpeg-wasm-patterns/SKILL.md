---
name: ffmpeg-wasm-patterns
description: FFmpeg.wasm 사용 시 args 설계·메모리 한계·워커 풀·진행률 보고·파일 시스템 정리 패턴.
---

# FFmpeg.wasm 사용 패턴

## 초기 셋업

```ts
// web/src/workers/ffmpeg.worker.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

await ffmpeg.load({
  coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
  wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
});
```

자산은 `public/ffmpeg/` 에 배치 (CDN 폴백 가능).

## 워커에서 호출 패턴

```ts
ffmpeg.on('progress', ({ progress }) => {
  self.postMessage({ type: 'progress', percent: Math.round(progress * 100) });
});

ffmpeg.on('log', () => {}); // 프로덕션에서는 끔

await ffmpeg.writeFile('input.mp4', await fetchFile(file));
await ffmpeg.exec(['-i', 'input.mp4', '-c:v', 'libx264', '-crf', '28', 'output.mp4']);
const data = await ffmpeg.readFile('output.mp4');
await ffmpeg.deleteFile('input.mp4');
await ffmpeg.deleteFile('output.mp4');
```

## 명령어 레시피

### 비디오 → GIF
```
-i input.mp4 -vf "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif
```

### 비디오 자르기
```
-ss 10 -to 30 -i input.mp4 -c copy output.mp4
```
`-ss` 가 `-i` 앞이면 빠름(키프레임 단위), 뒤면 정확함(재인코딩).

### 비디오 압축
```
-i input.mp4 -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 128k output.mp4
```
CRF 18=고화질 / 23=기본 / 28=저용량 / 35=매우작음.

### 비디오 → MP3
```
-i input.mp4 -vn -acodec libmp3lame -b:a 192k output.mp3
```

### 비디오 → 프레임
```
-i input.mp4 -vf fps=1 frame_%03d.png
```

### 오디오 변환
```
-i input.wav output.mp3
```
컨테이너 변경만이면 `-c copy` 옵션 시도.

## 메모리 한계

- 브라우저 WASM 메모리는 보통 ~2GB
- 큰 비디오(500MB+) 는 자주 OOM → 사용자에게 100MB 권장
- 처리 후 `deleteFile` 로 가상 FS 정리 필수
- 동일 워커에서 연속 작업 시 `ffmpeg.terminate()` 후 재로드 권장

## 워커 풀 (선택)

여러 도구를 동시에 쓰려면:
```ts
// pool.ts — 워커 N개 라운드 로빈
const workers: Worker[] = [];
let next = 0;
export function getWorker() {
  if (workers.length < 2) {
    const w = new Worker(new URL('./ffmpeg.worker.ts', import.meta.url), { type: 'module' });
    workers.push(w);
    return w;
  }
  const w = workers[next];
  next = (next + 1) % workers.length;
  return w;
}
```

대부분 도구는 워커 1개로 충분. 풀은 비디오 길이가 길거나 동시 처리 요구 때만.

## 취소

```ts
// 메인 쪽
worker.terminate(); // 즉시 중단, 메모리 회수
// (필요시 즉시 새 워커 생성 준비)
```

`ffmpeg.terminate()` 도 있지만 메인 측에서는 `worker.terminate()` 가 가장 확실.

## 진행률 보고

`ffmpeg.on('progress', ...)` 는 명령마다 0→1 으로 가지만 일부 명령(`-vf` 복잡한 필터)에서 부정확할 수 있음. 부정확하면 spinner 로 폴백.

## 자주 발생하는 실패

- "SharedArrayBuffer is not defined" → COOP/COEP 헤더 필요
  - `next.config.ts` 의 `headers` 에서 `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` 설정
- "ffmpeg.wasm not loaded" → load() 호출 누락
- 결과 파일이 0 바이트 → 명령 옵션 잘못 (log on 으로 디버그 후 prod 에서는 off)
