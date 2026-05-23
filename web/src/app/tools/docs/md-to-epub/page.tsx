'use client';

import { useState } from 'react';
import { Loader2, BookPlus } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { buildEpub } from '@/lib/tools/epub-common';

type Split = 'h1' | 'h2' | 'h3' | 'none';

export default function MdToEpubPage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('ko');
  const [split, setSplit] = useState<Split>('h1');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  function handleFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const t = typeof reader.result === 'string' ? reader.result : '';
      setText(t);
      if (!title) setTitle(f.name.replace(/\.(md|markdown|txt)$/i, ''));
    };
    reader.readAsText(f);
  }

  function handleCover(f: File) {
    setCoverFile(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(f));
  }

  async function handleBuild() {
    if (!text.trim()) {
      setError('변환할 Markdown 이 비어 있습니다.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const markedMod = await import('marked');
      const marked = markedMod.marked;
      marked.setOptions({ breaks: false, gfm: true });

      let chapters: Array<{ id: string; title: string; bodyHtml: string }>;

      if (split === 'none') {
        const html = await Promise.resolve(marked.parse(text));
        chapters = [{ id: 'chap1', title: title, bodyHtml: String(html) }];
      } else {
        const level = split === 'h1' ? 1 : split === 'h2' ? 2 : 3;
        chapters = await splitMarkdownByHeading(text, level, marked);
      }

      if (chapters.length === 0) {
        chapters = [{ id: 'chap1', title, bodyHtml: String(await Promise.resolve(marked.parse(text))) }];
      }

      const cover = coverFile
        ? {
            data: await coverFile.arrayBuffer(),
            mediaType: coverFile.type || 'image/jpeg',
          }
        : undefined;

      const blob = await buildEpub({
        title,
        creator: author,
        language: language || 'ko',
        chapters,
        cover,
      });
      const baseName = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || 'book';
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.epub`,
        originalSize: new Blob([text]).size + (coverFile?.size ?? 0),
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'EPUB 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BookPlus className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Markdown → EPUB</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Markdown 문서를 헤딩 단위로 챕터 분할해 EPUB 으로 만듭니다. 표지 이미지 첨부 가능.
        </p>
      </header>

      <FileDropZone
        accept=".md,.markdown,.txt,text/markdown"
        onFiles={(files) => files[0] && handleFile(files[0])}
        title="Markdown 파일을 끌어다 놓거나 클릭"
      />

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="제목 *" value={title} onChange={setTitle} />
          <Field label="저자" value={author} onChange={setAuthor} />
        </div>
        <Field label="언어" value={language} onChange={setLanguage} />

        <div className="space-y-1">
          <p className="text-xs font-medium">챕터 분할 헤딩</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={split === 'h1' ? 'default' : 'outline'} size="sm" onClick={() => setSplit('h1')}># (H1)</Button>
            <Button variant={split === 'h2' ? 'default' : 'outline'} size="sm" onClick={() => setSplit('h2')}>## (H2)</Button>
            <Button variant={split === 'h3' ? 'default' : 'outline'} size="sm" onClick={() => setSplit('h3')}>### (H3)</Button>
            <Button variant={split === 'none' ? 'default' : 'outline'} size="sm" onClick={() => setSplit('none')}>분할 없음</Button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium">표지 이미지 (선택)</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])}
            className="text-xs"
          />
          {coverPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="표지" className="mt-2 max-h-40 rounded border" />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Markdown 본문</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="# 첫 챕터&#10;&#10;본문…"
            className="w-full rounded-md border bg-background p-2 text-xs font-mono h-72 leading-relaxed"
          />
          <p className="text-[10px] text-muted-foreground">{text.length.toLocaleString()} 자</p>
        </div>
      </div>

      <Button onClick={handleBuild} disabled={busy || !text.trim() || !title.trim()}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        EPUB 만들기
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
  );
}

interface MarkedLike {
  parse: (s: string) => string | Promise<string>;
}

async function splitMarkdownByHeading(
  text: string,
  level: number,
  marked: MarkedLike,
): Promise<Array<{ id: string; title: string; bodyHtml: string }>> {
  const lines = text.split('\n');
  const re = new RegExp(`^${'#'.repeat(level)}\\s+(.+)$`);
  const chunks: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      if (current) chunks.push(current);
      current = { title: m[1].trim(), lines: [] };
    } else {
      if (!current) current = { title: 'Introduction', lines: [] };
      current.lines.push(line);
    }
  }
  if (current) chunks.push(current);

  const out: Array<{ id: string; title: string; bodyHtml: string }> = [];
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const body = await Promise.resolve(marked.parse(c.lines.join('\n')));
    out.push({
      id: `chap${i + 1}`,
      title: c.title,
      bodyHtml: `<h1>${escapeHtml(c.title)}</h1>\n${String(body)}`,
    });
  }
  return out;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
