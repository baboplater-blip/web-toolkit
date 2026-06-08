'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useEffect, useState } from 'react';
import { Loader2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import {
  buildEpub,
  chapterTitle,
  extractBody,
  fmtBytes,
  parseEpub,
  readChapter,
} from '@/lib/tools/epub-common';

interface InputItem {
  file: File;
}

export default function EpubMergePage() {
  const [items, setItems] = useState<InputItem[]>([]);
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  // 언마운트·결과 교체 시 이전 ObjectURL 해제(메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result?.blobUrl]);

  function addFiles(files: File[]) {
    setItems((prev) => [...prev, ...files.map((f) => ({ file: f }))]);
  }

  function move(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleMerge() {
    if (items.length < 2) {
      setError('병합하려면 EPUB 2개 이상이 필요합니다.');
      return;
    }
    setError(null);
    setBusy(true);
    // 이전 결과 URL 을 먼저 해제한 뒤 새로 만든다(재실행 누수 방지)
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setResult(null);
    setProgress(0);
    try {
      const allChapters: Array<{ id: string; title: string; bodyHtml: string }> = [];
      const firstMeta: { title: string; creator: string; language: string; description?: string } = {
        title: title || '',
        creator: creator || '',
        language: 'ko',
      };

      let totalOriginal = 0;
      for (let i = 0; i < items.length; i++) {
        const f = items[i].file;
        totalOriginal += f.size;
        const epub = await parseEpub(f);
        if (i === 0 && !firstMeta.title) firstMeta.title = epub.metadata.title;
        if (i === 0 && !firstMeta.creator) firstMeta.creator = epub.metadata.creator;
        if (i === 0) {
          firstMeta.language = epub.metadata.language || 'ko';
          firstMeta.description = epub.metadata.description;
        }

        // 책 자체를 한 섹션의 시작으로 표시
        const bookTitle = epub.metadata.title || f.name.replace(/\.epub$/i, '');
        for (let j = 0; j < epub.spine.length; j++) {
          const ch = await readChapter(epub, epub.spine[j]);
          if (!ch) continue;
          const body = extractBody(ch.xhtml);
          const cTitle = chapterTitle(ch.xhtml, `${bookTitle} ${j + 1}`);
          allChapters.push({
            id: `book${i + 1}_ch${j + 1}`,
            title: j === 0 ? `[${bookTitle}] ${cTitle}` : cTitle,
            bodyHtml: body,
          });
        }
        setProgress(Math.round(((i + 1) / items.length) * 80));
      }

      const blob = await buildEpub({
        title: firstMeta.title || '병합 EPUB',
        creator: firstMeta.creator,
        language: firstMeta.language,
        description: firstMeta.description,
        chapters: allChapters,
      });
      setProgress(100);

      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `merged-${Date.now()}.epub`,
        originalSize: totalOriginal,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '병합에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EPUB 병합" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          여러 EPUB 을 순서대로 하나로 묶습니다. 각 책의 챕터를 모두 보존합니다.
        </p>

      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        multiple
        onFiles={addFiles}
        title="EPUB 여러 개를 끌어다 놓거나 선택"
        hint="추가 후 순서를 위/아래 화살표로 조정하세요."
      />

      {items.length > 0 && (
        <ul className="rounded-xl border bg-card divide-y">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
              <span className="flex-1 truncate">{item.file.name}</span>
              <span className="text-[10px] text-muted-foreground">{fmtBytes(item.file.size)}</span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded p-1 hover:bg-muted disabled:opacity-30"
                aria-label="위로"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="rounded p-1 hover:bg-muted disabled:opacity-30"
                aria-label="아래로"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(i)} className="rounded p-1 hover:bg-muted" aria-label="제거">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <p className="text-xs font-semibold">병합 결과 메타데이터</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="비워두면 첫 EPUB 제목 사용"
                className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="병합 결과 메타데이터" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">저자</label>
              <input
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="비워두면 첫 EPUB 저자 사용"
                className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="저자" />
            </div>
          </div>
        </div>
      )}

      <Button onClick={handleMerge} disabled={busy || items.length < 2}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {items.length} 개 EPUB 병합
      </Button>

      {busy && progress > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <ResultCard
          fileName={result.filename}
          originalSize={result.originalSize}
          compressedSize={result.compressedSize}
          blobUrl={result.blobUrl}
          extraInfo="여러 EPUB → 하나로 병합됨"
        />
      )}
    </main>
    </div>
  );
}
