'use client';

import { useRef, useState } from 'react';
import { Loader2, BookPlus, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { buildEpub } from '@/lib/tools/epub-common';
import { extractMarkdown, getPdfMetadata, openPdfDoc } from '@/lib/tools/pdf-text';

export default function PdfToEpubPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('ko');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const abortRef = useRef<{ aborted: boolean } | null>(null);

  async function handleFile(f: File) {
    setFile(f);
    setError(null);
    setResult(null);
    if (!title || !author) {
      try {
        const pdf = await openPdfDoc(f);
        const meta = await getPdfMetadata(pdf);
        pdf.destroy();
        if (!title) setTitle(meta.title || f.name.replace(/\.pdf$/i, ''));
        if (!author) setAuthor(meta.author);
      } catch {
        if (!title) setTitle(f.name.replace(/\.pdf$/i, ''));
      }
    }
  }

  async function handleProcess() {
    if (!file) {
      setError('PDF 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    setProgress(0);
    const token = { aborted: false };
    abortRef.current = token;

    try {
      const pdf = await openPdfDoc(file);
      const md = await extractMarkdown(pdf, {
        signal: token,
        onProgress: (p) => setProgress(Math.round(p * 75)),
      });
      pdf.destroy();
      setProgress(80);

      const markedMod = await import('marked');
      const marked = markedMod.marked;
      marked.setOptions({ breaks: false, gfm: true });

      // 헤딩으로 챕터 분할 — h1 우선, 없으면 h2, 그것도 없으면 단일 챕터
      const chapters = splitMarkdownByHeading(md, marked);

      const blob = await buildEpub({
        title: title || file.name.replace(/\.pdf$/i, ''),
        creator: author || '',
        language: language || 'ko',
        chapters,
      });
      setProgress(100);

      const baseName = (title || file.name.replace(/\.pdf$/i, '')).replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.epub`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BookPlus className="h-5 w-5" />
          <h1 className="text-xl font-semibold">PDF → EPUB</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          PDF 의 텍스트를 추출해 헤딩 단위로 챕터를 만들고 EPUB 전자책으로 만듭니다.
        </p>
      </header>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => files[0] && handleFile(files[0])}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="제목" value={title} onChange={setTitle} />
          <Field label="저자" value={author} onChange={setAuthor} />
        </div>
        <Field label="언어" value={language} onChange={setLanguage} />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file || !title.trim()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          EPUB 만들기
        </Button>
        {busy && (
          <>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
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

interface MarkedLike {
  parse: (s: string) => string | Promise<string>;
}

function splitMarkdownByHeading(md: string, marked: MarkedLike): Array<{ id: string; title: string; bodyHtml: string }> {
  const lines = md.split('\n');
  const has1 = lines.some((l) => /^#\s+/.test(l));
  const splitLevel = has1 ? 1 : lines.some((l) => /^##\s+/.test(l)) ? 2 : 0;
  if (splitLevel === 0) {
    return [{ id: 'chap1', title: 'Document', bodyHtml: String(marked.parse(md) as string) }];
  }
  const re = new RegExp(`^${'#'.repeat(splitLevel)}\\s+(.+)$`);
  const chunks: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      if (current) chunks.push(current);
      current = { title: m[1].trim(), lines: [] };
    } else {
      if (!current) current = { title: 'Preface', lines: [] };
      current.lines.push(line);
    }
  }
  if (current) chunks.push(current);
  return chunks.map((c, i) => ({
    id: `chap${i + 1}`,
    title: c.title,
    bodyHtml: `<h1>${escapeHtml(c.title)}</h1>\n${String(marked.parse(c.lines.join('\n')) as string)}`,
  }));
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" aria-label="$" />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
