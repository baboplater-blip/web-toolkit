'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useState } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { epubToText, parseEpub } from '@/lib/tools/epub-common';

export default function EpubToTxtPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [includeTitles, setIncludeTitles] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('EPUB 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setText('');
    setResult(null);
    try {
      const epub = await parseEpub(file);
      const plain = await epubToText(epub, { includeTitles });
      setText(plain);
      const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
      const baseName = file.name.replace(/\.epub$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}.txt`,
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
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EPUB → TXT" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          EPUB 의 본문만 추출해 일반 텍스트 파일로 저장합니다. 단락·챕터 구분 유지.
        </p>

      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
        hint=".epub 파일"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeTitles}
          onChange={(e) => setIncludeTitles(e.target.checked)}
          className="h-4 w-4"
        />
        챕터 제목 포함 (# 형식)
      </label>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        텍스트로 변환
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {text && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">미리보기</h2>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <textarea readOnly value={text} className="h-72 w-full rounded-md border bg-card p-3 text-xs leading-relaxed" aria-label="미리보기" />
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
