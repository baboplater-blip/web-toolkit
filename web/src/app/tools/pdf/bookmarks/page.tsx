'use client';

import { useState } from 'react';
import { Loader2, BookMarked } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { getPdfOutline, openPdfDoc, type OutlineNode } from '@/lib/tools/pdf-text';

export default function PdfBookmarksPage() {
  const [file, setFile] = useState<File | null>(null);
  const [outline, setOutline] = useState<OutlineNode[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoad(f: File) {
    setFile(f);
    setError(null);
    setBusy(true);
    setOutline(null);
    try {
      const pdf = await openPdfDoc(f);
      const o = await getPdfOutline(pdf);
      pdf.destroy();
      setOutline(o);
      if (o.length === 0) {
        setError('이 PDF 에는 책갈피(목차) 가 없습니다.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 를 열 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  function exportMarkdown() {
    if (!outline) return;
    const lines: string[] = [];
    function walk(nodes: OutlineNode[], indent: number) {
      for (const n of nodes) {
        lines.push(`${'  '.repeat(indent)}- ${n.title}`);
        if (n.children.length > 0) walk(n.children, indent + 1);
      }
    }
    walk(outline, 0);
    const md = lines.join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(file?.name ?? 'outline').replace(/\.pdf$/i, '')}-bookmarks.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5" />
          <h1 className="text-xl font-semibold">PDF 책갈피 보기</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          PDF 의 목차/책갈피 트리를 표시하고 Markdown 으로 내보냅니다.
        </p>
      </header>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => files[0] && handleLoad(files[0])}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      {busy && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> 분석 중…
        </p>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {outline && outline.length > 0 && (
        <div className="rounded-xl border bg-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">{countNodes(outline)} 항목</p>
            <Button variant="outline" size="sm" onClick={exportMarkdown}>Markdown 으로 내보내기</Button>
          </div>
          <ul className="text-sm space-y-1">
            <OutlineList nodes={outline} />
          </ul>
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>책갈피 편집은 PDF 사양상 복잡하여 현재 읽기 전용 + Markdown 내보내기만 지원합니다. 새 책갈피 생성은 다음 라운드 예정.</p>
      </div>
    </main>
  );
}

function countNodes(nodes: OutlineNode[]): number {
  let c = nodes.length;
  for (const n of nodes) c += countNodes(n.children);
  return c;
}

function OutlineList({ nodes }: { nodes: OutlineNode[] }) {
  return (
    <>
      {nodes.map((n, i) => (
        <li key={i}>
          <div className="text-sm">{n.title || '(이름 없음)'}</div>
          {n.children.length > 0 && (
            <ul className="ml-4 mt-1 space-y-1 border-l border-border/40 pl-3">
              <OutlineList nodes={n.children} />
            </ul>
          )}
        </li>
      ))}
    </>
  );
}
