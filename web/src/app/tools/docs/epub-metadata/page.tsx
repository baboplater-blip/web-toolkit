'use client';

import { useState } from 'react';
import { Loader2, FileEdit, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import {
  parseEpub,
  repackageEpub,
  rewriteOpfMetadata,
  type EpubMetadata,
  type ParsedEpub,
} from '@/lib/tools/epub-common';

export default function EpubMetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [epub, setEpub] = useState<ParsedEpub | null>(null);
  const [meta, setMeta] = useState<EpubMetadata | null>(null);
  const [subjectInput, setSubjectInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  async function handleLoad(f: File) {
    setFile(f);
    setError(null);
    setBusy(true);
    setMeta(null);
    setResult(null);
    try {
      const parsed = await parseEpub(f);
      setEpub(parsed);
      setMeta({ ...parsed.metadata, subjects: [...parsed.metadata.subjects] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'EPUB 을 열 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  function addSubject() {
    const v = subjectInput.trim();
    if (!v || !meta) return;
    if (meta.subjects.includes(v)) {
      setSubjectInput('');
      return;
    }
    setMeta({ ...meta, subjects: [...meta.subjects, v] });
    setSubjectInput('');
  }

  function removeSubject(idx: number) {
    if (!meta) return;
    setMeta({ ...meta, subjects: meta.subjects.filter((_, i) => i !== idx) });
  }

  async function handleSave() {
    if (!epub || !meta || !file) return;
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const newOpf = rewriteOpfMetadata(epub.opfXml, meta);
      epub.zip.file(epub.opfPath, newOpf);
      const blob = await repackageEpub(epub.zip);
      const baseName = file.name.replace(/\.epub$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-edited.epub`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileEdit className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EPUB 메타데이터 편집</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          제목·저자·언어·설명·발행자·태그 등을 수정해 새 EPUB 으로 저장합니다.
        </p>
      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => files[0] && handleLoad(files[0])}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      {busy && !meta && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> 분석 중…
        </p>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {meta && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <Field label="제목" value={meta.title} onChange={(v) => setMeta({ ...meta, title: v })} />
          <Field label="저자" value={meta.creator} onChange={(v) => setMeta({ ...meta, creator: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="언어 (ko, en…)" value={meta.language} onChange={(v) => setMeta({ ...meta, language: v })} />
            <Field label="발행일 (YYYY-MM-DD)" value={meta.date ?? ''} onChange={(v) => setMeta({ ...meta, date: v || undefined })} />
          </div>
          <Field label="발행자" value={meta.publisher ?? ''} onChange={(v) => setMeta({ ...meta, publisher: v || undefined })} />
          <Field
            label="식별자 (ISBN / UUID)"
            value={meta.identifier}
            onChange={(v) => setMeta({ ...meta, identifier: v })}
            mono
          />
          <div className="space-y-1">
            <label className="text-xs font-medium">설명</label>
            <textarea
              value={meta.description ?? ''}
              onChange={(e) => setMeta({ ...meta, description: e.target.value || undefined })}
              className="w-full rounded-md border bg-background p-2 text-sm h-24" aria-label="설명" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">태그 / 주제</label>
            <div className="flex gap-2">
              <input
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubject();
                  }
                }}
                placeholder="태그 입력 후 Enter"
                className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" aria-label="태그 / 주제" />
              <Button variant="outline" size="sm" onClick={addSubject}>추가</Button>
            </div>
            {meta.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {meta.subjects.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {s}
                    <button onClick={() => removeSubject(i)} aria-label="제거">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Field label="저작권" value={meta.rights ?? ''} onChange={(v) => setMeta({ ...meta, rights: v || undefined })} />

          <Button onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            새 EPUB 저장
          </Button>
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

function Field({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border bg-background px-2 py-1.5 text-sm ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}
