---
name: tool-page-template
description: 신규 도구 페이지의 표준 보일러플레이트. FileDropZone + 워커 호출 + ResultCard + 에러 상태가 한 파일에 들어있다.
---

# 도구 페이지 표준 템플릿

새 도구 페이지를 만들 때 이 템플릿을 복사해 시작한다. 모든 도구의 골격이 동일해 사용자 학습 비용이 0 에 가깝다.

## 디렉터리

```
web/src/app/tools/{category}/{slug}/
├── page.tsx        # 본 템플릿
└── (옵션) SPEC.md  # tool-architect 설계 문서
```

워커가 필요하면:
```
web/src/workers/{slug}.worker.ts
```

## page.tsx 템플릿

```tsx
'use client';

import { useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

export default function ToolPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  function reset() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setProgress(0);
    setProcessing(false);
  }

  async function handleProcess() {
    if (files.length === 0) {
      setError('파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setResult(null);
    setProcessing(true);
    setProgress(0);

    try {
      // 옵션 A: 동적 import 후 직접 처리
      // const { processFile } = await import('@/lib/tools/{slug}');
      // const blob = await processFile(files, (p) => setProgress(p));

      // 옵션 B: Worker 호출
      const worker = new Worker(new URL('@/workers/{slug}.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      const blob = await new Promise<Blob>((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.type === 'progress') setProgress(e.data.percent);
          else if (e.data.type === 'done') resolve(e.data.result);
          else if (e.data.type === 'error') reject(new Error(e.data.message));
        };
        worker.onerror = (e) => reject(e);
        worker.postMessage({ type: 'process', files });
      });

      setResult({ blob, filename: '{output-filename}' });
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      reset();
    }
  }

  function handleCancel() {
    reset();
    setError('작업이 취소되었습니다.');
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{도구명}</h1>
        <p className="text-sm text-muted-foreground">{한 줄 설명}</p>
      </header>

      <FileDropZone
        accept="application/pdf"
        multiple
        onFiles={setFiles}
        disabled={processing}
      />

      {/* 옵션 패널 (도구별) */}

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={processing || files.length === 0}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          처리 시작
        </Button>
        {processing && (
          <>
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="취소">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && <ResultCard blob={result.blob} filename={result.filename} />}
    </main>
  );
}
```

## 메타데이터 (별도 server 파일 권장)

`'use client'` 와 `generateMetadata` 는 같은 파일에 못 둔다. 패턴:
- `page.tsx` (server) — metadata export + `<ClientPage />` 렌더
- `client.tsx` (`'use client'`) — 실제 UI

간단한 도구는 metadata 생략해도 OK.

## 체크리스트

- [ ] `'use client'` 첫 줄
- [ ] FileDropZone + ResultCard 사용
- [ ] 진행률에 `role="progressbar"` + `aria-valuenow/min/max`
- [ ] 취소 버튼
- [ ] 에러 한국어 메시지 + `role="alert"`
- [ ] 큰 라이브러리는 `await import(...)` 동적 로드
- [ ] 워커는 `new URL('...', import.meta.url)` 형식
- [ ] registry.ts 항목 추가
