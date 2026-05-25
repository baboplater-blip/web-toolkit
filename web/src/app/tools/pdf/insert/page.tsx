'use client';

import { useEffect, useState } from 'react';
import { Loader2, FilePlus } from 'lucide-react';
import { PDFDocument } from '@cantoo/pdf-lib';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

type Position = 'start' | 'end' | 'after';

export default function PdfInsertPage() {
  const [base, setBase] = useState<File | null>(null);
  const [insert, setInsert] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('end');
  const [afterPage, setAfterPage] = useState(1);
  const [basePages, setBasePages] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  useEffect(() => {
    if (!base) {
      setBasePages(0);
      return;
    }
    base
      .arrayBuffer()
      .then((buf) => PDFDocument.load(buf, { updateMetadata: false }))
      .then((doc) => setBasePages(doc.getPageCount()))
      .catch(() => setBasePages(0));
  }, [base]);

  async function handleProcess() {
    if (!base || !insert) {
      setError('대상 PDF 와 삽입할 PDF 를 모두 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const baseDoc = await PDFDocument.load(await base.arrayBuffer(), { updateMetadata: false });
      const insertDoc = await PDFDocument.load(await insert.arrayBuffer(), { updateMetadata: false });
      const insertIndices = Array.from({ length: insertDoc.getPageCount() }, (_, i) => i);
      const insertPages = await baseDoc.copyPages(insertDoc, insertIndices);

      let insertAt: number;
      if (position === 'start') insertAt = 0;
      else if (position === 'end') insertAt = baseDoc.getPageCount();
      else insertAt = Math.min(Math.max(afterPage, 0), baseDoc.getPageCount());

      for (let i = 0; i < insertPages.length; i++) {
        baseDoc.insertPage(insertAt + i, insertPages[i]);
      }

      const bytes = await baseDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = base.name.replace(/\.pdf$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-inserted.pdf`,
        originalSize: base.size + insert.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '삽입에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FilePlus className="h-5 w-5" />
          <h1 className="text-xl font-semibold">PDF 페이지 삽입</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          다른 PDF 의 페이지를 대상 PDF 의 원하는 위치에 끼워 넣습니다.
        </p>
      </header>

      <section className="space-y-2">
        <p className="text-xs font-semibold">1. 대상 PDF (기준 문서)</p>
        <FileDropZone
          accept="application/pdf,.pdf"
          onFiles={(files) => setBase(files[0] ?? null)}
          title="기준이 될 PDF"
        />
        {base && <p className="text-xs text-muted-foreground">{base.name} · {basePages} 페이지</p>}
      </section>

      {base && (
        <section className="space-y-2">
          <p className="text-xs font-semibold">2. 삽입할 PDF</p>
          <FileDropZone
            accept="application/pdf,.pdf"
            onFiles={(files) => setInsert(files[0] ?? null)}
            title="끼워 넣을 PDF"
          />
        </section>
      )}

      {base && insert && (
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <p className="text-xs font-semibold">3. 삽입 위치</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={position === 'start' ? 'default' : 'outline'} size="sm" onClick={() => setPosition('start')}>맨 앞</Button>
            <Button variant={position === 'end' ? 'default' : 'outline'} size="sm" onClick={() => setPosition('end')}>맨 뒤</Button>
            <Button variant={position === 'after' ? 'default' : 'outline'} size="sm" onClick={() => setPosition('after')}>특정 페이지 뒤</Button>
          </div>
          {position === 'after' && (
            <div className="flex items-center gap-2">
              <label className="text-xs">대상 페이지</label>
              <input
                type="number"
                min={0}
                max={basePages}
                value={afterPage}
                onChange={(e) => setAfterPage(Math.max(0, Math.min(basePages, Number(e.target.value))))}
                className="w-20 rounded-md border bg-background px-2 py-1 text-sm" aria-label="대상 페이지" />
              <span className="text-xs text-muted-foreground">뒤에 삽입 (0 = 맨 앞)</span>
            </div>
          )}
        </div>
      )}

      <Button onClick={handleProcess} disabled={busy || !base || !insert}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        삽입 실행
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
