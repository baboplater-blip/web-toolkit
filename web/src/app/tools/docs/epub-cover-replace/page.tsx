'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import {
  fmtBytes,
  mimeForExt,
  parseEpub,
  repackageEpub,
  resolveHref,
  rewriteResourceRefs,
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
      // 저장할 때마다 원본에서 다시 파싱 — 이전 저장이 zip 을 변형해 두 번째 저장이 꼬이지 않도록.
      const ep = await parseEpub(epubFile);
      const nameExt = (coverFile.name.split('.').pop() || '').toLowerCase();
      const typeExt = (coverFile.type.split('/').pop() || '').toLowerCase();
      const rawExt = typeExt || nameExt || 'jpg';
      const safeExt = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt;
      const coverMime = coverFile.type || mimeForExt(safeExt);
      const buf = await coverFile.arrayBuffer();
      let opfXml = ep.opfXml;

      const oldItem = ep.coverItemId ? ep.manifest.get(ep.coverItemId) : undefined;
      if (oldItem) {
        // 기존 표지 manifest 항목을 그대로 재사용: 같은 폴더·같은 이름에 확장자만 새 형식으로.
        // (항목을 지우고 새로 넣으면 본문·표지 페이지의 <img> 참조가 깨진다)
        const oldPath = resolveHref(ep.opfDir, oldItem.href);
        const newPath = oldPath.replace(/\.[^./]+$/, '') + `.${safeExt}`;
        const newHref = oldItem.href.replace(/\.[^./]+$/, '') + `.${safeExt}`;
        if (newPath !== oldPath) ep.zip.remove(oldPath);
        ep.zip.file(newPath, buf);
        opfXml = opfXml.replace(
          new RegExp(`<item\\b[^>]*\\bid\\s*=\\s*["']${escapeReg(oldItem.id)}["'][^>]*>`, 'i'),
          (tag) =>
            tag
              .replace(/\bhref\s*=\s*["'][^"']*["']/i, `href="${newHref}"`)
              .replace(/\bmedia-type\s*=\s*["'][^"']*["']/i, `media-type="${coverMime}"`),
        );
        // EPUB2 호환 meta name="cover" 가 없으면 추가
        if (!/<meta[^>]*\bname\s*=\s*["']cover["']/i.test(opfXml)) {
          opfXml = opfXml.replace(
            /<metadata\b[^>]*>/i,
            (m) => `${m}\n    <meta name="cover" content="${oldItem.id}"/>`,
          );
        }
        if (newPath !== oldPath) {
          await rewriteResourceRefs(ep.zip, new Map([[oldPath, newPath]]));
        }
      } else {
        // 표지가 없던 책: 새 manifest 항목 + meta cover 추가
        let coverName = `cover.${safeExt}`;
        for (let n = 1; ep.zip.file(`${ep.opfDir}${coverName}`) && n < 100; n++) {
          coverName = `cover-${n}.${safeExt}`;
        }
        let itemId = 'cover-image';
        for (let n = 1; ep.manifest.has(itemId) && n < 100; n++) itemId = `cover-image-${n}`;
        ep.zip.file(`${ep.opfDir}${coverName}`, buf);
        const props = ep.version === '3' ? ' properties="cover-image"' : '';
        const newItem = `    <item id="${itemId}" href="${coverName}" media-type="${coverMime}"${props}/>`;
        opfXml = opfXml.replace(/<manifest\b[^>]*>/i, (m) => `${m}\n${newItem}`);
        opfXml = opfXml.replace(/<meta[^>]*\bname\s*=\s*["']cover["'][^>]*\/?>(?:\s*<\/meta>)?\s*/i, '');
        opfXml = opfXml.replace(
          /<metadata\b[^>]*>/i,
          (m) => `${m}\n    <meta name="cover" content="${itemId}"/>`,
        );
      }

      ep.zip.file(ep.opfPath, opfXml);
      const blob = await repackageEpub(ep.zip);
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
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EPUB 표지 교체" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
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
    </div>
  );
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
