'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useEffect, useState } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

export default function DocxToMdPage() {
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 언마운트·결과 교체 시 이전 ObjectURL 해제(메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result?.blobUrl]);

  async function handleProcess() {
    if (!file) {
      setError('DOCX 파일을 선택해주세요.');
      return;
    }
    setError(null);
    setMarkdown('');
    // 이전 결과 URL 을 먼저 해제한 뒤 새로 만든다(재실행 누수 방지)
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setResult(null);
    setBusy(true);
    try {
      const mammothMod = (await import('mammoth')) as unknown as {
        convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: Array<{ message: string }> }>;
      };
      const buf = await file.arrayBuffer();
      const r = await mammothMod.convertToHtml({ arrayBuffer: buf });

      const TurndownMod = await import('turndown');
      const TurndownService = TurndownMod.default;
      const td = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
      });
      const md = td.turndown(r.value);

      setMarkdown(md);
      setWarnings(r.messages.map((m) => m.message));

      const blob = new Blob([md], { type: 'text/markdown' });
      const baseName = file.name.replace(/\.docx$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.md`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="DOCX → Markdown" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Word 문서를 Markdown 으로 변환합니다.
        </p>

      </header>

      <FileDropZone
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="DOCX 파일을 끌어다 놓거나 클릭하여 선택"
        hint=".docx (구버전 .doc 은 지원 안 함)"
      />

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Markdown 으로 변환
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {markdown && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              변환 결과
            </h2>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <textarea
            readOnly
            value={markdown}
            className="h-72 w-full rounded-md border bg-card p-3 text-xs font-mono leading-relaxed" aria-label="변환 결과" />
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

      {warnings.length > 0 && (
        <div className="rounded-lg border bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-300">
          <p className="mb-1 font-medium">변환 경고</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {warnings.slice(0, 10).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
            {warnings.length > 10 && <li>… 외 {warnings.length - 10}건</li>}
          </ul>
        </div>
      )}
    </main>
    </div>
  );
}
