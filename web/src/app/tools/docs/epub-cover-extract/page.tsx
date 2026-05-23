'use client';

import { useEffect, useState } from 'react';
import { Loader2, ImageIcon, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';
import { fmtBytes, parseEpub, resolveHref } from '@/lib/tools/epub-common';

export default function EpubCoverExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState<{
    url: string;
    size: number;
    mime: string;
    filename: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (cover?.url) URL.revokeObjectURL(cover.url);
    };
  }, [cover?.url]);

  async function handleProcess() {
    if (!file) {
      setError('EPUB 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setCover(null);
    try {
      const epub = await parseEpub(file);
      if (!epub.coverItemId) {
        setError('이 EPUB 에서 표지를 찾지 못했습니다.');
        return;
      }
      const item = epub.manifest.get(epub.coverItemId)!;
      const fullPath = resolveHref(epub.opfDir, item.href);
      const f = epub.zip.file(fullPath);
      if (!f) {
        setError('표지 파일을 zip 안에서 찾지 못했습니다.');
        return;
      }
      const u8 = await f.async('uint8array');
      const blob = new Blob([new Uint8Array(u8)], { type: item.mediaType || 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const ext = item.href.split('.').pop()?.toLowerCase() ?? 'jpg';
      const baseName = file.name.replace(/\.epub$/i, '');
      setCover({
        url,
        size: blob.size,
        mime: item.mediaType || 'image/jpeg',
        filename: `${baseName}-cover.${ext === 'jpeg' ? 'jpg' : ext}`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '표지 추출에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EPUB 표지 추출</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          EPUB 의 표지 이미지를 원본 그대로 추출합니다.
        </p>
      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        표지 추출
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {cover && (
        <div className="rounded-xl border bg-card p-4 space-y-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.url} alt="EPUB 표지" className="mx-auto max-h-[480px] rounded-md border" />
          <p className="text-xs text-muted-foreground">
            {cover.mime} · {fmtBytes(cover.size)}
          </p>
          <a
            href={cover.url}
            download={cover.filename}
            className={buttonVariants({ variant: 'default', className: 'w-full' })}
          >
            <Download className="h-4 w-4" />
            {cover.filename} 다운로드
          </a>
        </div>
      )}
    </main>
  );
}
