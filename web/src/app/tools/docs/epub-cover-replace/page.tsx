'use client';

import { useEffect, useState } from 'react';
import { Loader2, ImagePlus } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import {
  fmtBytes,
  parseEpub,
  repackageEpub,
  resolveHref,
  type ParsedEpub,
} from '@/lib/tools/epub-common';

export default function EpubCoverReplacePage() {
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [epub, setEpub] = useState<ParsedEpub | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [oldCoverUrl, setOldCoverUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (oldCoverUrl) URL.revokeObjectURL(oldCoverUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEpubLoad(f: File) {
    setEpubFile(f);
    setError(null);
    setBusy(true);
    setEpub(null);
    setResult(null);
    if (oldCoverUrl) URL.revokeObjectURL(oldCoverUrl);
    setOldCoverUrl('');
    try {
      const parsed = await parseEpub(f);
      setEpub(parsed);
      if (parsed.coverItemId) {
        const item = parsed.manifest.get(parsed.coverItemId);
        if (item) {
          const zf = parsed.zip.file(resolveHref(parsed.opfDir, item.href));
          if (zf) {
            const blob = await zf.async('blob');
            const url = URL.createObjectURL(new Blob([blob], { type: item.mediaType || 'image/jpeg' }));
            setOldCoverUrl(url);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'EPUB 을 열 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleCoverPick(f: File) {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  }

  async function handleSave() {
    if (!epub || !coverFile || !epubFile) return;
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const ext = (coverFile.type.split('/').pop() || 'jpg').toLowerCase();
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      const coverName = `cover.${safeExt}`;
      const newCoverPath = `${epub.opfDir}${coverName}`;
      const buf = await coverFile.arrayBuffer();
      epub.zip.file(newCoverPath, buf);

      // OPF 수정 — 기존 cover-image properties 제거, 새 manifest item + meta name="cover" 갱신
      let opfXml = epub.opfXml;

      // 기존 cover-image 자산 properties 제거 (zip 파일도 제거)
      if (epub.coverItemId) {
        const oldItem = epub.manifest.get(epub.coverItemId);
        if (oldItem) {
          const oldPath = resolveHref(epub.opfDir, oldItem.href);
          // 같은 path 가 아니면 삭제
          if (oldPath !== newCoverPath) {
            epub.zip.remove(oldPath);
          }
          // properties="cover-image" 토큰만 제거
          opfXml = opfXml.replace(
            new RegExp(
              `(<item\\b[^>]*\\bid\\s*=\\s*["']${escapeReg(epub.coverItemId)}["'][^>]*\\bproperties\\s*=\\s*["'][^"']*)\\bcover-image\\b([^"']*["'])`,
              'i',
            ),
            '$1$2',
          );
          // 기존 cover-image item 자체를 삭제하지는 않음 — id 충돌 시 새 id 사용
        }
      }

      // 기존 cover-image manifest item 제거 (같은 id 'cover-image' 가 있으면)
      opfXml = opfXml.replace(
        /<item\b[^>]*\bid\s*=\s*["']cover-image["'][^>]*\/?>(?:\s*<\/item>)?/i,
        '',
      );

      // 기존 meta name="cover" 제거
      opfXml = opfXml.replace(/<meta[^>]*\bname\s*=\s*["']cover["'][^>]*\/?>(?:\s*<\/meta>)?\s*/i, '');

      // 새 항목 삽입
      const newItem = `    <item id="cover-image" href="${coverName}" media-type="${coverFile.type}" properties="cover-image"/>`;
      opfXml = opfXml.replace(/<manifest\b[^>]*>/i, (m) => `${m}\n${newItem}`);

      // meta cover 삽입 (EPUB2 호환)
      opfXml = opfXml.replace(
        /<metadata\b[^>]*>/i,
        (m) => `${m}\n    <meta name="cover" content="cover-image"/>`,
      );

      epub.zip.file(epub.opfPath, opfXml);
      const blob = await repackageEpub(epub.zip);
      const baseName = epubFile.name.replace(/\.epub$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-newcover.epub`,
        originalSize: epubFile.size,
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
          <ImagePlus className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EPUB 표지 교체</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          EPUB 의 표지 이미지를 새 그림으로 교체해 새 파일로 저장합니다.
        </p>
      </header>

      <section className="space-y-2">
        <p className="text-xs font-semibold">1. EPUB 파일</p>
        <FileDropZone
          accept="application/epub+zip,.epub"
          onFiles={(files) => files[0] && handleEpubLoad(files[0])}
          title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
        />
      </section>

      {epub && (
        <section className="space-y-2">
          <p className="text-xs font-semibold">2. 새 표지 이미지</p>
          <FileDropZone
            accept="image/*"
            onFiles={(files) => files[0] && handleCoverPick(files[0])}
            title="이미지 파일을 끌어다 놓거나 선택"
            hint="JPG / PNG / WEBP — 비율은 자동으로 그대로 보존됩니다."
          />
        </section>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {(oldCoverUrl || coverPreview) && (
        <div className="grid grid-cols-2 gap-3">
          {oldCoverUrl && (
            <div className="rounded-lg border p-2 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">현재 표지</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={oldCoverUrl} alt="현재 표지" className="mx-auto max-h-60 rounded" />
            </div>
          )}
          {coverPreview && (
            <div className="rounded-lg border p-2 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">새 표지 ({coverFile && fmtBytes(coverFile.size)})</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverPreview} alt="새 표지" className="mx-auto max-h-60 rounded" />
            </div>
          )}
        </div>
      )}

      {epub && coverFile && (
        <Button onClick={handleSave} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          새 EPUB 저장
        </Button>
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

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
