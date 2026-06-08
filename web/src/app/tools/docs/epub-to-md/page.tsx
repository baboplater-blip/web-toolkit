'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import {
  chapterTitle,
  extractBody,
  parseEpub,
  readChapter,
} from '@/lib/tools/epub-common';

type Mode = 'single' | 'zip';

export default function EpubToMdPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('single');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('EPUB 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const epub = await parseEpub(file);
      const TurndownMod = await import('turndown');
      const TurndownService = TurndownMod.default;
      const td = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
      });

      const chapters: Array<{ title: string; md: string }> = [];
      for (let i = 0; i < epub.spine.length; i++) {
        const ch = await readChapter(epub, epub.spine[i]);
        if (!ch) continue;
        const body = extractBody(ch.xhtml);
        const md = td.turndown(body);
        const title = chapterTitle(ch.xhtml, `Chapter ${i + 1}`);
        chapters.push({ title, md });
      }

      const baseName = file.name.replace(/\.epub$/i, '');
      let blob: Blob;
      let filename: string;
      if (mode === 'single') {
        const combined = chapters
          .map((c) => `# ${c.title}\n\n${c.md}`)
          .join('\n\n---\n\n');
        blob = new Blob([combined], { type: 'text/markdown;charset=utf-8' });
        filename = `${baseName}.md`;
      } else {
        const zip = new JSZip();
        chapters.forEach((c, i) => {
          const safeTitle = c.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
          const fname = `${String(i + 1).padStart(3, '0')}-${safeTitle || 'chapter'}.md`;
          zip.file(fname, `# ${c.title}\n\n${c.md}`);
        });
        blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        filename = `${baseName}-markdown.zip`;
      }
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EPUB → Markdown" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          EPUB 의 챕터별 본문을 Markdown 으로 변환합니다.
        </p>

      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      <div className="space-y-2">
        <p className="text-xs font-medium">출력 모드</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('single')}
          >
            단일 .md 파일
          </Button>
          <Button
            variant={mode === 'zip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('zip')}
          >
            챕터별 ZIP
          </Button>
        </div>
      </div>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Markdown 으로 변환
      </Button>

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
        />
      )}
    </main>
    </div>
  );
}
