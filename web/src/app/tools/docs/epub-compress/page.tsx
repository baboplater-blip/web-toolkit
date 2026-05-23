'use client';

import { useState } from 'react';
import { Loader2, Archive } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import { fmtBytes, parseEpub, repackageEpub, resolveHref } from '@/lib/tools/epub-common';

type Quality = 0.6 | 0.75 | 0.85;
type Target = 'jpeg' | 'webp' | 'keep';

const QUALITY_LABEL: Record<string, string> = {
  '0.6': '강력 압축 (60%)',
  '0.75': '권장 (75%)',
  '0.85': '약한 압축 (85%)',
};

export default function EpubCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<Quality>(0.75);
  const [target, setTarget] = useState<Target>('jpeg');
  const [maxDim, setMaxDim] = useState(1600);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{
    imagesProcessed: number;
    imagesSkipped: number;
    bytesBefore: number;
    bytesAfter: number;
  } | null>(null);
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
    setResult(null);
    setReport(null);
    setProgress(0);
    try {
      const epub = await parseEpub(file);
      const images = Array.from(epub.manifest.values()).filter((i) => i.mediaType.startsWith('image/'));
      let processed = 0;
      let skipped = 0;
      let before = 0;
      let after = 0;

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const fullPath = resolveHref(epub.opfDir, item.href);
        const zf = epub.zip.file(fullPath);
        if (!zf) {
          skipped++;
          continue;
        }
        const u8 = await zf.async('uint8array');
        before += u8.byteLength;

        // SVG 는 그대로 (벡터 손실 방지)
        if (item.mediaType === 'image/svg+xml') {
          after += u8.byteLength;
          skipped++;
          continue;
        }

        try {
          const compressed = await compressImage(u8, item.mediaType, { quality, target, maxDim });
          if (compressed.bytes.byteLength < u8.byteLength) {
            // 원본보다 줄어든 경우만 교체
            const newPath = target === 'keep'
              ? fullPath
              : fullPath.replace(/\.[^./]+$/, target === 'jpeg' ? '.jpg' : '.webp');
            if (newPath !== fullPath) {
              epub.zip.remove(fullPath);
            }
            epub.zip.file(newPath, compressed.bytes);

            // OPF 의 manifest href + media-type 갱신
            if (newPath !== fullPath) {
              const newHref = item.href.replace(/\.[^./]+$/, target === 'jpeg' ? '.jpg' : '.webp');
              const newMime = target === 'jpeg' ? 'image/jpeg' : 'image/webp';
              let opf = epub.zip.file(epub.opfPath)
                ? await epub.zip.file(epub.opfPath)!.async('text')
                : epub.opfXml;
              opf = opf.replace(
                new RegExp(`(<item\\b[^>]*\\bid\\s*=\\s*["']${escapeReg(item.id)}["'][^>]*)`),
                (m) =>
                  m
                    .replace(/href\s*=\s*["'][^"']*["']/, `href="${newHref}"`)
                    .replace(/media-type\s*=\s*["'][^"']*["']/, `media-type="${newMime}"`),
              );
              epub.zip.file(epub.opfPath, opf);
            }
            after += compressed.bytes.byteLength;
            processed++;
          } else {
            after += u8.byteLength;
            skipped++;
          }
        } catch {
          after += u8.byteLength;
          skipped++;
        }
        setProgress(Math.round(((i + 1) / images.length) * 90));
      }

      const blob = await repackageEpub(epub.zip);
      const baseName = file.name.replace(/\.epub$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-compressed.epub`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
      setReport({ imagesProcessed: processed, imagesSkipped: skipped, bytesBefore: before, bytesAfter: after });
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : '압축에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EPUB 압축 (내부 이미지 최적화)</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          EPUB 안의 이미지를 재인코딩·축소해 전체 용량을 줄입니다. 텍스트는 그대로 유지됩니다.
        </p>
      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium">품질</p>
          <div className="flex flex-wrap gap-2">
            {([0.85, 0.75, 0.6] as Quality[]).map((q) => (
              <Button key={q} variant={quality === q ? 'default' : 'outline'} size="sm" onClick={() => setQuality(q)}>
                {QUALITY_LABEL[String(q)]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium">출력 포맷</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={target === 'jpeg' ? 'default' : 'outline'} size="sm" onClick={() => setTarget('jpeg')}>JPEG</Button>
            <Button variant={target === 'webp' ? 'default' : 'outline'} size="sm" onClick={() => setTarget('webp')}>WebP</Button>
            <Button variant={target === 'keep' ? 'default' : 'outline'} size="sm" onClick={() => setTarget('keep')}>원본 포맷 유지</Button>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium">최대 변</p>
          <div className="flex flex-wrap gap-2">
            {[1200, 1600, 2000, 2400].map((d) => (
              <Button key={d} variant={maxDim === d ? 'default' : 'outline'} size="sm" onClick={() => setMaxDim(d)}>
                {d}px
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        압축 실행
      </Button>

      {busy && progress > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {report && (
        <div className="rounded-xl border bg-card p-3 text-xs space-y-1">
          <p>이미지 압축: <span className="font-semibold">{report.imagesProcessed}</span> 장</p>
          <p>건너뜀: {report.imagesSkipped} 장 (변화 없음 / SVG / 손상)</p>
          <p>
            이미지 합계 {fmtBytes(report.bytesBefore)} → {fmtBytes(report.bytesAfter)} (
            <span className={report.bytesAfter < report.bytesBefore ? 'text-emerald-500' : 'text-amber-500'}>
              {report.bytesBefore > 0
                ? `-${Math.round(((report.bytesBefore - report.bytesAfter) / report.bytesBefore) * 100)}%`
                : '0%'}
            </span>
            )
          </p>
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

interface CompressOpts {
  quality: number;
  target: Target;
  maxDim: number;
}

async function compressImage(
  data: Uint8Array,
  mediaType: string,
  opts: CompressOpts,
): Promise<{ bytes: Uint8Array }> {
  // 1) Blob → Image
  const blob = new Blob([new Uint8Array(data)], { type: mediaType });
  const img = await blobToImage(blob);
  try {
    const { width, height } = img;
    const scale = Math.min(opts.maxDim / Math.max(width, height), 1);
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 컨텍스트 실패');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // JPEG 출력 시 배경 흰색
    const outMime = opts.target === 'webp'
      ? 'image/webp'
      : opts.target === 'jpeg'
        ? 'image/jpeg'
        : mediaType.startsWith('image/png') ? 'image/png' : 'image/jpeg';
    if (outMime === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, outW, outH);
    }
    ctx.drawImage(img, 0, 0, outW, outH);

    const outBlob = await new Promise<Blob>((res, rej) => {
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('인코딩 실패'))), outMime, opts.quality);
    });
    const buf = new Uint8Array(await outBlob.arrayBuffer());
    return { bytes: buf };
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(blob);
  });
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
