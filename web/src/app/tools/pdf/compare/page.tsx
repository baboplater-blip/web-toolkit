'use client';

import { useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { extractPlainText, openPdfDoc } from '@/lib/tools/pdf-text';

interface DiffLine {
  type: 'add' | 'remove' | 'eq';
  text: string;
}

export default function PdfComparePage() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<DiffLine[] | null>(null);
  const [stats, setStats] = useState<{ add: number; remove: number; eq: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<{ aborted: boolean } | null>(null);

  async function handleProcess() {
    if (!a || !b) {
      setError('비교할 PDF 두 개를 모두 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setDiff(null);
    setStats(null);
    setProgress(0);
    const token = { aborted: false };
    abortRef.current = token;

    let pdfA: Awaited<ReturnType<typeof openPdfDoc>> | null = null;
    let pdfB: Awaited<ReturnType<typeof openPdfDoc>> | null = null;
    try {
      [pdfA, pdfB] = await Promise.all([openPdfDoc(a), openPdfDoc(b)]);
      // A·B 를 순차 추출하며 진행률 합산 (각 50%). 취소 토큰을 추출기에 전달.
      const textA = await extractPlainText(pdfA, {
        signal: token,
        onProgress: (p) => setProgress(Math.round(p * 50)),
      });
      const textB = await extractPlainText(pdfB, {
        signal: token,
        onProgress: (p) => setProgress(50 + Math.round(p * 50)),
      });
      if (token.aborted) throw new Error('취소되었습니다.');
      const linesA = textA.join('\n\n').split('\n').map((s) => s.trim());
      const linesB = textB.join('\n\n').split('\n').map((s) => s.trim());

      const diffLib = await import('diff');
      const result = diffLib.diffArrays(linesA, linesB);
      const out: DiffLine[] = [];
      let add = 0;
      let remove = 0;
      let eq = 0;
      for (const part of result) {
        for (const line of part.value) {
          if (part.added) {
            out.push({ type: 'add', text: line });
            add++;
          } else if (part.removed) {
            out.push({ type: 'remove', text: line });
            remove++;
          } else {
            out.push({ type: 'eq', text: line });
            eq++;
          }
        }
      }
      setDiff(out);
      setStats({ add, remove, eq });
    } catch (e) {
      setError(e instanceof Error ? e.message : '비교에 실패했습니다.');
    } finally {
      pdfA?.destroy();
      pdfB?.destroy();
      setBusy(false);
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  function handleReset() {
    if (abortRef.current) abortRef.current.aborted = true;
    setA(null);
    setB(null);
    setDiff(null);
    setStats(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 텍스트 비교" widthClass="max-w-3xl" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        두 PDF 의 텍스트를 추출해 줄 단위로 차이점을 보여줍니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold">기준 PDF (A)</p>
          <FileDropZone
            accept="application/pdf,.pdf"
            maxBytes={100 * 1024 * 1024}
            onFiles={(files) => setA(files[0] ?? null)}
            title="A 파일"
          />
          {a && <p className="text-xs text-muted-foreground truncate">{a.name}</p>}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">비교 PDF (B)</p>
          <FileDropZone
            accept="application/pdf,.pdf"
            maxBytes={100 * 1024 * 1024}
            onFiles={(files) => setB(files[0] ?? null)}
            title="B 파일"
          />
          {b && <p className="text-xs text-muted-foreground truncate">{b.name}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !a || !b}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          비교
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

      {stats && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1">+{stats.add}</span>
          <span className="rounded-full bg-destructive/10 text-destructive px-2 py-1">−{stats.remove}</span>
          <span className="rounded-full bg-muted text-muted-foreground px-2 py-1">동일 {stats.eq}</span>
        </div>
      )}

      {diff && (
        <div className="rounded-xl border bg-card max-h-[60vh] overflow-y-auto">
          <pre className="text-xs font-mono leading-relaxed p-3">
            {diff.map((d, i) => (
              <span
                key={i}
                className={
                  d.type === 'add'
                    ? 'block bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : d.type === 'remove'
                      ? 'block bg-destructive/10 text-destructive'
                      : 'block text-muted-foreground'
                }
              >
                {d.type === 'add' ? '+ ' : d.type === 'remove' ? '- ' : '  '}
                {d.text || ' '}
              </span>
            ))}
          </pre>
        </div>
      )}
      </main>
    </div>
  );
}
