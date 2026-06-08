'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import {
  chapterTitle,
  extOf,
  extractBody,
  isImageExt,
  mimeForExt,
  parseEpub,
  readChapter,
  resolveHref,
} from '@/lib/tools/epub-common';

type Mode = 'single' | 'zip';

export default function EpubToHtmlPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('single');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  // 언마운트·결과 교체 시 이전 ObjectURL 해제(메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result?.blobUrl]);

  async function handleProcess() {
    if (!file) {
      setError('EPUB 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    // 이전 결과 URL 을 먼저 해제한 뒤 새로 만든다(재실행 누수 방지)
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setResult(null);
    try {
      const epub = await parseEpub(file);
      const baseName = file.name.replace(/\.epub$/i, '');

      const chapters: Array<{ title: string; html: string; sourcePath: string }> = [];
      for (let i = 0; i < epub.spine.length; i++) {
        const ch = await readChapter(epub, epub.spine[i]);
        if (!ch) continue;
        const title = chapterTitle(ch.xhtml, `Chapter ${i + 1}`);
        chapters.push({ title, html: extractBody(ch.xhtml), sourcePath: ch.path });
      }

      let blob: Blob;
      let filename: string;

      if (mode === 'single') {
        // 이미지를 data URL 로 인라인 — 단일 HTML 자족
        const inlinedChapters: string[] = [];
        const imageCache = new Map<string, string>();

        for (const c of chapters) {
          const chapterDir = c.sourcePath.includes('/')
            ? c.sourcePath.substring(0, c.sourcePath.lastIndexOf('/') + 1)
            : '';
          let body = c.html;
          const re = /\b(src|href|xlink:href)\s*=\s*["']([^"']+)["']/gi;
          const replacements: Array<[string, string]> = [];
          for (const m of body.matchAll(re)) {
            const [raw, attrName, value] = m;
            if (/^(https?:|data:|blob:|#|mailto:)/i.test(value)) continue;
            const ext = extOf(value).toLowerCase();
            if (!isImageExt(ext)) continue;
            const resolved = resolveHref(chapterDir, value);
            let dataUrl = imageCache.get(resolved);
            if (!dataUrl) {
              const f = epub.zip.file(resolved);
              if (!f) continue;
              const u8 = await f.async('uint8array');
              dataUrl = `data:${mimeForExt(ext)};base64,${u8ToBase64(u8)}`;
              imageCache.set(resolved, dataUrl);
            }
            replacements.push([raw, `${attrName}="${dataUrl}"`]);
          }
          for (const [from, to] of replacements) body = body.replace(from, to);
          inlinedChapters.push(`<section class="chapter"><h2>${escapeHtml(c.title)}</h2>${body}</section>`);
        }

        const combined = `<!doctype html>
<html lang="${epub.metadata.language || 'ko'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(epub.metadata.title)}</title>
<style>
  body { font-family: 'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',serif; max-width: 720px; margin: 2em auto; padding: 0 1.5em; line-height: 1.7; color: #222; }
  h1 { border-bottom: 2px solid #333; padding-bottom: 0.3em; }
  h2 { margin-top: 2em; padding-top: 1em; border-top: 1px solid #ddd; }
  img { max-width: 100%; height: auto; }
  .chapter { page-break-after: always; }
</style>
</head>
<body>
<h1>${escapeHtml(epub.metadata.title)}</h1>
${epub.metadata.creator ? `<p><em>${escapeHtml(epub.metadata.creator)}</em></p>` : ''}
${inlinedChapters.join('\n')}
</body>
</html>`;
        blob = new Blob([combined], { type: 'text/html;charset=utf-8' });
        filename = `${baseName}.html`;
      } else {
        // ZIP — 자산 그대로 포함
        const zip = new JSZip();
        for (let i = 0; i < chapters.length; i++) {
          const c = chapters[i];
          const safeTitle = c.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
          const fname = `${String(i + 1).padStart(3, '0')}-${safeTitle || 'chapter'}.html`;
          zip.file(
            fname,
            `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(c.title)}</title></head><body>${c.html}</body></html>`,
          );
        }
        // 자산 (images/) 도 포함
        const assetsDir = 'assets/';
        for (const item of epub.manifest.values()) {
          if (!item.mediaType.startsWith('image/')) continue;
          const fullPath = resolveHref(epub.opfDir, item.href);
          const f = epub.zip.file(fullPath);
          if (!f) continue;
          const u8 = await f.async('uint8array');
          const fname = item.href.split('/').pop() || item.id;
          zip.file(`${assetsDir}${fname}`, u8);
        }
        blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        filename = `${baseName}-html.zip`;
      }

      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EPUB → HTML" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          EPUB 을 단일 HTML 또는 챕터별 HTML ZIP 으로 변환합니다.
        </p>

      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      <div className="space-y-2">
        <p className="text-xs font-medium">출력 모드</p>
        <div className="flex flex-wrap gap-2">
          <Button variant={mode === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setMode('single')}>
            단일 HTML (이미지 인라인)
          </Button>
          <Button variant={mode === 'zip' ? 'default' : 'outline'} size="sm" onClick={() => setMode('zip')}>
            챕터별 ZIP (이미지 별도)
          </Button>
        </div>
      </div>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        HTML 로 변환
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
    </div>
  );
}

function u8ToBase64(u8: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)));
  }
  return btoa(s);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
