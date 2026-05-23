'use client';

import { useState } from 'react';
import { Loader2, BarChart3 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import {
  chapterTitle,
  extractBody,
  fmtBytes,
  htmlToPlainText,
  parseEpub,
  readChapter,
  resolveHref,
} from '@/lib/tools/epub-common';

interface ChapterStat {
  index: number;
  title: string;
  chars: number;
  words: number;
  paragraphs: number;
}

interface Stats {
  title: string;
  creator: string;
  language: string;
  version: '2' | '3';
  totalChapters: number;
  totalChars: number;
  totalWords: number;
  totalParagraphs: number;
  images: number;
  imageBytes: number;
  fileBytes: number;
  chapters: ChapterStat[];
}

export default function EpubStatsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('EPUB 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setStats(null);
    try {
      const epub = await parseEpub(file);
      const chapters: ChapterStat[] = [];
      let totalChars = 0;
      let totalWords = 0;
      let totalParagraphs = 0;

      for (let i = 0; i < epub.spine.length; i++) {
        const ch = await readChapter(epub, epub.spine[i]);
        if (!ch) continue;
        const body = extractBody(ch.xhtml);
        const plain = htmlToPlainText(body);
        const words = plain.split(/\s+/).filter(Boolean).length;
        const paragraphs = plain.split(/\n\n+/).filter((p) => p.trim()).length;
        const title = chapterTitle(ch.xhtml, `Chapter ${i + 1}`);
        chapters.push({
          index: i + 1,
          title,
          chars: plain.length,
          words,
          paragraphs,
        });
        totalChars += plain.length;
        totalWords += words;
        totalParagraphs += paragraphs;
      }

      let images = 0;
      let imageBytes = 0;
      for (const item of epub.manifest.values()) {
        if (!item.mediaType.startsWith('image/')) continue;
        images++;
        const f = epub.zip.file(resolveHref(epub.opfDir, item.href));
        if (f) {
          const u8 = await f.async('uint8array');
          imageBytes += u8.byteLength;
        }
      }

      setStats({
        title: epub.metadata.title,
        creator: epub.metadata.creator,
        language: epub.metadata.language,
        version: epub.version,
        totalChapters: chapters.length,
        totalChars,
        totalWords,
        totalParagraphs,
        images,
        imageBytes,
        fileBytes: file.size,
        chapters,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EPUB 통계</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          단어·문자·챕터·이미지 수와 챕터별 분량을 분석합니다.
        </p>
      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        분석
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {stats && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h2 className="text-sm font-semibold">{stats.title || '제목 없음'}</h2>
            {stats.creator && <p className="text-xs text-muted-foreground">{stats.creator}</p>}
            <p className="text-[10px] text-muted-foreground">
              EPUB {stats.version} · {stats.language}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
              <Box label="챕터" value={stats.totalChapters.toLocaleString()} />
              <Box label="단어" value={stats.totalWords.toLocaleString()} />
              <Box label="문자" value={stats.totalChars.toLocaleString()} />
              <Box label="문단" value={stats.totalParagraphs.toLocaleString()} />
              <Box label="이미지" value={stats.images.toLocaleString()} />
              <Box label="이미지 용량" value={fmtBytes(stats.imageBytes)} />
              <Box label="EPUB 용량" value={fmtBytes(stats.fileBytes)} />
              <Box label="단어/챕터" value={stats.totalChapters ? Math.round(stats.totalWords / stats.totalChapters).toLocaleString() : '—'} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">챕터별 분량</h3>
            <div className="max-h-72 overflow-y-auto text-xs">
              <table className="w-full">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="text-left px-2 py-1">#</th>
                    <th className="text-left px-2 py-1">제목</th>
                    <th className="text-right px-2 py-1">단어</th>
                    <th className="text-right px-2 py-1">문자</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.chapters.map((c) => (
                    <tr key={c.index} className="border-b border-border/30 last:border-b-0">
                      <td className="px-2 py-1 text-muted-foreground">{c.index}</td>
                      <td className="px-2 py-1 truncate max-w-[280px]" title={c.title}>{c.title}</td>
                      <td className="px-2 py-1 text-right font-mono">{c.words.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right font-mono">{c.chars.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}
