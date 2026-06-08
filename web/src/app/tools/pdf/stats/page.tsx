'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import {
  collectFonts,
  extractPlainText,
  getPdfMetadata,
  getPdfOutline,
  openPdfDoc,
} from '@/lib/tools/pdf-text';

interface Stats {
  pages: number;
  words: number;
  chars: number;
  paragraphs: number;
  fonts: string[];
  outlineItems: number;
  meta: { title: string; author: string; creator: string; producer: string };
  fileBytes: number;
  emptyPages: number;
  perPage: Array<{ page: number; words: number; chars: number }>;
}

export default function PdfStatsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('PDF 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setStats(null);
    setProgress(0);
    try {
      const pdf = await openPdfDoc(file);
      const meta = await getPdfMetadata(pdf);
      const outline = await getPdfOutline(pdf);
      const fonts = await collectFonts(pdf, Math.min(pdf.numPages, 10));
      const pages = await extractPlainText(pdf, {
        onProgress: (p) => setProgress(Math.round(p * 95)),
      });
      pdf.destroy();

      let words = 0;
      let chars = 0;
      let paragraphs = 0;
      let empty = 0;
      const perPage: Array<{ page: number; words: number; chars: number }> = [];
      pages.forEach((t, i) => {
        const pw = t.split(/\s+/).filter(Boolean).length;
        const pc = t.length;
        const pp = t.split(/\n\n+/).filter((s) => s.trim()).length;
        words += pw;
        chars += pc;
        paragraphs += pp;
        if (pc === 0) empty++;
        perPage.push({ page: i + 1, words: pw, chars: pc });
      });

      function countOutlineNodes(nodes: Array<{ children: unknown[] }>): number {
        let c = nodes.length;
        for (const n of nodes) c += countOutlineNodes(n.children as Array<{ children: unknown[] }>);
        return c;
      }

      setStats({
        pages: pages.length,
        words,
        chars,
        paragraphs,
        fonts,
        outlineItems: countOutlineNodes(outline),
        meta: { title: meta.title, author: meta.author, creator: meta.creator, producer: meta.producer },
        fileBytes: file.size,
        emptyPages: empty,
        perPage,
      });
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setStats(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 통계" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        페이지·단어·문자·폰트·목차·메타데이터를 분석합니다.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        maxBytes={100 * 1024 * 1024}
        onFiles={(files) => setFile(files[0] ?? null)}
        title="PDF 파일을 끌어다 놓거나 클릭"
      />

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={busy || !file}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          분석
        </Button>
        {busy && (
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {stats && (
        <div className="space-y-3">
          {(stats.meta.title || stats.meta.author) && (
            <div className="rounded-xl border bg-card p-3 space-y-1">
              {stats.meta.title && <p className="text-sm font-semibold">{stats.meta.title}</p>}
              {stats.meta.author && <p className="text-xs text-muted-foreground">{stats.meta.author}</p>}
              <p className="text-[10px] text-muted-foreground">
                {[stats.meta.creator, stats.meta.producer].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}

          <div className="rounded-xl border bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <Box label="페이지" value={stats.pages.toLocaleString()} />
            <Box label="단어" value={stats.words.toLocaleString()} />
            <Box label="문자" value={stats.chars.toLocaleString()} />
            <Box label="문단" value={stats.paragraphs.toLocaleString()} />
            <Box label="목차 항목" value={stats.outlineItems.toLocaleString()} />
            <Box label="고유 폰트" value={stats.fonts.length.toLocaleString()} />
            <Box label="빈 페이지" value={stats.emptyPages.toLocaleString()} />
            <Box label="파일 용량" value={fmtBytes(stats.fileBytes)} />
          </div>

          {stats.fonts.length > 0 && (
            <div className="rounded-xl border bg-card p-3 text-xs space-y-1">
              <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">사용 폰트</p>
              <div className="flex flex-wrap gap-1">
                {stats.fonts.map((f) => (
                  <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{f}</span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-card p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">페이지별 분량</h3>
            <div className="max-h-72 overflow-y-auto text-xs">
              <table className="w-full">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="text-left px-2 py-1">페이지</th>
                    <th className="text-right px-2 py-1">단어</th>
                    <th className="text-right px-2 py-1">문자</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perPage.map((p) => (
                    <tr key={p.page} className="border-b border-border/30 last:border-b-0">
                      <td className="px-2 py-1 text-muted-foreground">{p.page}</td>
                      <td className="px-2 py-1 text-right font-mono">{p.words.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right font-mono">{p.chars.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
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

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
