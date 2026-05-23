'use client';

import { useState } from 'react';
import { Loader2, BookPlus } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { buildEpub } from '@/lib/tools/epub-common';

type SplitMode = 'blankline' | 'heading' | 'pagebreak' | 'auto';

export default function TxtToEpubPage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('ko');
  const [splitMode, setSplitMode] = useState<SplitMode>('auto');
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
      if (!title) {
        setTitle(f.name.replace(/\.(txt|md)$/i, ''));
      }
    };
    reader.readAsText(f);
  }

  function splitChapters(input: string): Array<{ title: string; body: string }> {
    const t = input.replace(/\r\n/g, '\n');
    if (splitMode === 'pagebreak') {
      // form feed \f 또는 페이지 구분자 ---
      const parts = t.split(/\n?\f\n?|\n-{3,}\n/);
      return parts.map((p, i) => ({ title: `Chapter ${i + 1}`, body: p.trim() })).filter((c) => c.body);
    }
    if (splitMode === 'heading') {
      // === 또는 "제 N장" 같은 헤딩으로 분할
      const lines = t.split('\n');
      const chunks: Array<{ title: string; body: string[] }> = [];
      let current: { title: string; body: string[] } = { title: '서두', body: [] };
      const headingRe = /^(={2,}.*={2,}|#+\s.+|제\s*\d+\s*[장편부]|Chapter\s+\d+|CHAPTER\s+\d+)/;
      for (const line of lines) {
        if (headingRe.test(line.trim()) && current.body.length > 0) {
          chunks.push(current);
          current = { title: line.replace(/^#+\s*/, '').replace(/=/g, '').trim(), body: [] };
        } else {
          if (chunks.length === 0 && current.body.length === 0 && headingRe.test(line.trim())) {
            current.title = line.replace(/^#+\s*/, '').replace(/=/g, '').trim();
          } else {
            current.body.push(line);
          }
        }
      }
      if (current.body.length > 0) chunks.push(current);
      return chunks
        .map((c) => ({ title: c.title || 'Chapter', body: c.body.join('\n').trim() }))
        .filter((c) => c.body);
    }
    if (splitMode === 'blankline') {
      // 빈 줄 3개 이상으로 분할
      const parts = t.split(/\n{3,}/);
      return parts.map((p, i) => ({ title: `Chapter ${i + 1}`, body: p.trim() })).filter((c) => c.body);
    }
    // auto — 헤딩이 있으면 heading 모드, 없으면 길이 기준 자동 분할
    const headingMatch = /^(?:={2,}.*={2,}|#+\s.+|제\s*\d+\s*[장편부]|Chapter\s+\d+|CHAPTER\s+\d+)/m.test(t);
    if (headingMatch) {
      const old = splitMode;
      (splitMode as unknown as string) === old; // noop
      return splitTextByHeading(t);
    }
    // 길이 기준 — 25k자 단위
    const CHUNK = 25000;
    if (t.length <= CHUNK) return [{ title: title || 'Chapter 1', body: t.trim() }];
    const parts: Array<{ title: string; body: string }> = [];
    let i = 1;
    for (let p = 0; p < t.length; p += CHUNK) {
      const chunk = t.slice(p, p + CHUNK);
      parts.push({ title: `Chapter ${i++}`, body: chunk.trim() });
    }
    return parts;
  }

  function textToHtml(s: string): string {
    return s
      .split(/\n{2,}/)
      .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br />')}</p>`)
      .join('\n');
  }

  async function handleBuild() {
    const body = text.trim();
    if (!body) {
      setError('변환할 텍스트가 비어 있습니다.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const chapters = splitChapters(body).map((c, i) => ({
        id: `chap${i + 1}`,
        title: c.title,
        bodyHtml: `<h1>${escapeHtml(c.title)}</h1>\n${textToHtml(c.body)}`,
      }));

      const blob = await buildEpub({
        title: title || 'Untitled',
        creator: author || '',
        language: language || 'ko',
        chapters,
      });
      const baseName = (title || 'untitled').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.epub`,
        originalSize: new Blob([body]).size,
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
          <h1 className="text-xl font-semibold">텍스트 → EPUB</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          텍스트 파일이나 직접 입력한 내용을 EPUB 전자책으로 만듭니다.
        </p>
      </header>

      <FileDropZone
        accept=".txt,text/plain"
        onFiles={(files) => files[0] && handleFile(files[0])}
        title="TXT 파일을 끌어다 놓거나 아래에 직접 입력"
        hint="UTF-8 권장"
      />

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="제목 *" value={title} onChange={setTitle} required />
          <Field label="저자" value={author} onChange={setAuthor} />
        </div>
        <Field label="언어 (BCP47, ko/en)" value={language} onChange={setLanguage} />

        <div className="space-y-1">
          <p className="text-xs font-medium">챕터 분할 방식</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={splitMode === 'auto' ? 'default' : 'outline'} size="sm" onClick={() => setSplitMode('auto')}>자동</Button>
            <Button variant={splitMode === 'heading' ? 'default' : 'outline'} size="sm" onClick={() => setSplitMode('heading')}>제목 줄 (# / 제 N장)</Button>
            <Button variant={splitMode === 'blankline' ? 'default' : 'outline'} size="sm" onClick={() => setSplitMode('blankline')}>빈 줄 3개</Button>
            <Button variant={splitMode === 'pagebreak' ? 'default' : 'outline'} size="sm" onClick={() => setSplitMode('pagebreak')}>--- 구분자</Button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">본문</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="여기에 텍스트를 붙여넣거나 위에서 TXT 파일을 올리세요."
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

function splitTextByHeading(t: string): Array<{ title: string; body: string }> {
  const lines = t.split('\n');
  const chunks: Array<{ title: string; body: string[] }> = [];
  let current: { title: string; body: string[] } | null = null;
  const headingRe = /^(={2,}.*={2,}|#+\s.+|제\s*\d+\s*[장편부]|Chapter\s+\d+|CHAPTER\s+\d+)/;
  for (const line of lines) {
    const trimmed = line.trim();
    if (headingRe.test(trimmed)) {
      if (current) chunks.push(current);
      current = { title: trimmed.replace(/^#+\s*/, '').replace(/=/g, '').trim() || 'Chapter', body: [] };
    } else {
      if (!current) current = { title: 'Preface', body: [] };
      current.body.push(line);
    }
  }
  if (current) chunks.push(current);
  return chunks
    .map((c) => ({ title: c.title, body: c.body.join('\n').trim() }))
    .filter((c) => c.body);
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
