'use client';

import { useEffect, useState } from 'react';
import { Loader2, SplitSquareHorizontal } from 'lucide-react';
import JSZip from 'jszip';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import {
  buildEpub,
  chapterTitle,
  extractBody,
  parseEpub,
  readChapter,
  type ParsedEpub,
} from '@/lib/tools/epub-common';

interface ChapterPick {
  idref: string;
  title: string;
  selected: boolean;
}

export default function EpubSplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [epub, setEpub] = useState<ParsedEpub | null>(null);
  const [chapters, setChapters] = useState<ChapterPick[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result?.blobUrl]);

  async function handleLoad(f: File) {
    setFile(f);
    setError(null);
    setBusy(true);
    setEpub(null);
    setChapters([]);
    setResult(null);
    try {
      const parsed = await parseEpub(f);
      const picks: ChapterPick[] = [];
      for (let i = 0; i < parsed.spine.length; i++) {
        const ch = await readChapter(parsed, parsed.spine[i]);
        if (!ch) continue;
        picks.push({
          idref: parsed.spine[i],
          title: chapterTitle(ch.xhtml, `Chapter ${i + 1}`),
          selected: true,
        });
      }
      setEpub(parsed);
      setChapters(picks);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'EPUB 을 열 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  function toggle(i: number) {
    setChapters((arr) => arr.map((c, idx) => (idx === i ? { ...c, selected: !c.selected } : c)));
  }
  function setAll(v: boolean) {
    setChapters((arr) => arr.map((c) => ({ ...c, selected: v })));
  }

  async function handleSplit() {
    if (!epub || !file) return;
    const picked = chapters.filter((c) => c.selected);
    if (picked.length === 0) {
      setError('1개 이상의 챕터를 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    setProgress(0);
    try {
      const outZip = new JSZip();
      const baseName = file.name.replace(/\.epub$/i, '');

      for (let i = 0; i < picked.length; i++) {
        const c = picked[i];
        const ch = await readChapter(epub, c.idref);
        if (!ch) continue;
        const body = extractBody(ch.xhtml);
        const epubBlob = await buildEpub({
          title: `${epub.metadata.title || baseName} — ${c.title}`,
          creator: epub.metadata.creator,
          language: epub.metadata.language,
          description: epub.metadata.description,
          publisher: epub.metadata.publisher,
          subjects: epub.metadata.subjects,
          chapters: [{ id: 'chap1', title: c.title, bodyHtml: body }],
        });
        const safeTitle = c.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
        outZip.file(`${String(i + 1).padStart(3, '0')}-${safeTitle || 'chapter'}.epub`, epubBlob);
        setProgress(Math.round(((i + 1) / picked.length) * 100));
      }

      const finalBlob = await outZip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      setResult({
        blobUrl: URL.createObjectURL(finalBlob),
        filename: `${baseName}-split.zip`,
        originalSize: file.size,
        compressedSize: finalBlob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '분할에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <SplitSquareHorizontal className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EPUB 챕터별 분할</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          선택한 챕터를 각각 독립된 EPUB 파일로 만들어 ZIP 으로 묶습니다.
        </p>
      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => files[0] && handleLoad(files[0])}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {chapters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold">{chapters.filter((c) => c.selected).length} / {chapters.length} 선택</p>
            <Button variant="ghost" size="sm" onClick={() => setAll(true)}>모두 선택</Button>
            <Button variant="ghost" size="sm" onClick={() => setAll(false)}>모두 해제</Button>
          </div>
          <ul className="max-h-72 overflow-y-auto rounded-lg border bg-card divide-y">
            {chapters.map((c, i) => (
              <li key={i}>
                <label className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.selected}
                    onChange={() => toggle(i)}
                    className="h-4 w-4"
                  />
                  <span className="text-muted-foreground mr-1">{i + 1}.</span>
                  <span className="truncate">{c.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {chapters.length > 0 && (
        <Button onClick={handleSplit} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          선택한 챕터로 분할
        </Button>
      )}

      {busy && progress > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {result && (
        <ResultCard
          fileName={result.filename}
          originalSize={result.originalSize}
          compressedSize={result.compressedSize}
          blobUrl={result.blobUrl}
        />
      )}
    </main>
  );
}
