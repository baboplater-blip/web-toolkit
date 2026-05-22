---
name: web-worker-template
description: 도구 워커의 표준 메시지 인터페이스(process/cancel · progress/done/error). transferable 사용.
---

# Web Worker 표준 인터페이스

모든 도구의 워커는 같은 메시지 포맷을 따른다. 메인↔워커 통신을 표준화하면 ui-polisher 가 공용 hook 으로 처리 가능.

## 메시지 스키마

```ts
// 메인 → 워커
type WorkerInput =
  | { type: 'process'; files: File[]; options?: Record<string, unknown> }
  | { type: 'cancel' };

// 워커 → 메인
type WorkerOutput =
  | { type: 'progress'; percent: number; stage?: string }
  | { type: 'done'; result: Blob | Blob[]; meta?: Record<string, unknown> }
  | { type: 'error'; message: string; code?: string };
```

## 워커 보일러플레이트

```ts
// web/src/workers/{slug}.worker.ts
type WorkerInput = ...; // 위 스키마
type WorkerOutput = ...;

let cancelled = false;

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  if (e.data.type === 'cancel') {
    cancelled = true;
    return;
  }

  if (e.data.type === 'process') {
    cancelled = false;
    try {
      const result = await doWork(e.data.files, e.data.options, (p, stage) => {
        post({ type: 'progress', percent: p, stage });
      });

      if (cancelled) return;
      post({ type: 'done', result });
    } catch (err) {
      post({ type: 'error', message: errorMessage(err) });
    }
  }
};

function post(msg: WorkerOutput) {
  // Blob 은 자동 구조화 클론. ArrayBuffer 는 transferable 사용
  self.postMessage(msg);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function doWork(
  files: File[],
  options: Record<string, unknown> | undefined,
  onProgress: (p: number, stage?: string) => void,
): Promise<Blob> {
  // 실제 처리 로직. 중간 중간 if (cancelled) throw 로 조기 종료
  // ...
  onProgress(50, '처리 중');
  // ...
  return new Blob([...], { type: '...' });
}
```

## 메인 측 호출 헬퍼 (제안)

```ts
// web/src/lib/tools/run-worker.ts
export async function runWorker<R = Blob>(
  worker: Worker,
  input: { files: File[]; options?: Record<string, unknown> },
  onProgress?: (p: number, stage?: string) => void,
): Promise<R> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') onProgress?.(msg.percent, msg.stage);
      else if (msg.type === 'done') resolve(msg.result);
      else if (msg.type === 'error') reject(new Error(msg.message));
    };
    worker.onerror = (e) => reject(new Error(e.message || '워커 에러'));
    worker.postMessage({ type: 'process', ...input });
  });
}
```

도구 페이지에서:
```ts
const worker = new Worker(new URL('@/workers/x.worker.ts', import.meta.url), { type: 'module' });
const blob = await runWorker(worker, { files }, (p) => setProgress(p));
worker.terminate();
```

## Transferable

`ArrayBuffer` 는 transferable 로 보내면 복사 비용 0:

```ts
const buf = await file.arrayBuffer();
worker.postMessage({ type: 'process', buf }, [buf]); // buf 는 메인에서 사용 불가가 됨
```

`Blob`, `File` 은 자동으로 구조화 클론(빠름) → transferable 불필요.

## 취소

메인:
```ts
worker.postMessage({ type: 'cancel' });  // 협력적 취소
// 또는
worker.terminate();                      // 강제 취소 (즉시)
```

권장: 짧은 작업은 terminate. 정리 코드(임시 파일 삭제)가 필요한 워커는 cancel 메시지 후 워커가 정리하고 종료.

## 에러 코드

선택적으로 `code` 필드 사용:
- `'UNSUPPORTED_FORMAT'`
- `'FILE_TOO_LARGE'`
- `'CORRUPTED_INPUT'`
- `'OUT_OF_MEMORY'`

ui-polisher 가 코드별로 다른 한국어 메시지로 변환.
