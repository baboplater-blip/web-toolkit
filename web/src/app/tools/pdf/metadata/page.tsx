'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';

interface MetaForm {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export default function PdfMetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<MetaForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  // 언마운트 시 마지막 결과 ObjectURL 회수 (merge 의 생명주기와 동일)
  useEffect(() => () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); }, [result?.blobUrl]);

  async function handleLoad(f: File) {
    setFile(f);
    setError(null);
    setBusy(true);
    setMeta(null);
    setResult(null);
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { updateMetadata: false });
      setMeta({
        title: doc.getTitle() ?? '',
        author: doc.getAuthor() ?? '',
        subject: doc.getSubject() ?? '',
        keywords: (doc.getKeywords() ?? '') as string,
        creator: doc.getCreator() ?? '',
        producer: doc.getProducer() ?? '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 를 열 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!file || !meta) return;
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
      doc.setTitle(meta.title);
      doc.setAuthor(meta.author);
      doc.setSubject(meta.subject);
      doc.setKeywords(meta.keywords.split(',').map((k) => k.trim()).filter(Boolean));
      doc.setCreator(meta.creator || 'Web Toolkit');
      doc.setProducer(meta.producer || 'Web Toolkit');
      doc.setModificationDate(new Date());
      const bytes = await doc.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      // 새 URL 생성 전 직전 결과 URL 회수 (재실행 시 누수 방지)
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-meta.pdf`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setMeta(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 메타데이터 편집" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        제목·저자·주제·키워드 등 PDF 의 Info 메타데이터를 수정합니다.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => files[0] && handleLoad(files[0])}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {meta && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <Field label="제목" value={meta.title} onChange={(v) => setMeta({ ...meta, title: v })} />
          <Field label="저자" value={meta.author} onChange={(v) => setMeta({ ...meta, author: v })} />
          <Field label="주제" value={meta.subject} onChange={(v) => setMeta({ ...meta, subject: v })} />
          <Field label="키워드 (쉼표로 구분)" value={meta.keywords} onChange={(v) => setMeta({ ...meta, keywords: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="작성 프로그램 (Creator)" value={meta.creator} onChange={(v) => setMeta({ ...meta, creator: v })} />
            <Field label="생산 프로그램 (Producer)" value={meta.producer} onChange={(v) => setMeta({ ...meta, producer: v })} />
          </div>

          <Button onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            메타데이터 저장
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
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}
