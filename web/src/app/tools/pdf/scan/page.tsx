'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { buttonVariants } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';

interface Item {
  file: File;
  url: string;
}

type Enhance = 'none' | 'gray' | 'bw';

const FILTERS: Record<Enhance, string> = {
  none: 'none',
  gray: 'grayscale(1) contrast(1.35) brightness(1.05)',
  bw: 'grayscale(1) contrast(2.2) brightness(1.1)',
};

async function enhanceToJpeg(file: File, mode: Enhance): Promise<Uint8Array> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d')!;
  ctx.filter = FILTERS[mode];
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b!), 'image/jpeg', 0.85),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

export default function ScanToPdfPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<Enhance>('gray');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 언마운트 시 남아있는 미리보기 ObjectURL 을 모두 회수하기 위한 최신값 보관 ref
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(
    () => () => {
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
    },
    [],
  );

  function handleReset() {
    items.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
    setError(null);
  }

  function onFiles(files: File[]) {
    setError(null);
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  function remove(i: number) {
    setItems((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function buildPdf() {
    if (items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.create();
      for (const it of items) {
        const bytes = await enhanceToJpeg(it.file, mode);
        const img = await doc.embedJpg(bytes);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'scan.pdf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="스캔 → PDF"
        widthClass="max-w-3xl"
        onReset={items.length > 0 ? handleReset : undefined}
      />

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <FileDropZone accept="image/*" multiple onFiles={onFiles} onError={(m) => setError(m)} />
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <span className="text-xs font-medium block">보정 모드</span>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              ['none', '원본'],
              ['gray', '흑백 보정'],
              ['bw', '고대비 (문서)'],
            ] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`h-9 text-xs rounded-md border ${
                  mode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {items.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{items.length}장 · 순서대로 PDF 페이지가 됩니다</span>
            </div>
            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map((it, i) => (
                <li key={it.url} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.url}
                    alt={`스캔 ${i + 1}`}
                    className="aspect-[3/4] w-full object-cover rounded border"
                    style={{ filter: FILTERS[mode] === 'none' ? undefined : FILTERS[mode] }}
                  />
                  <span className="absolute top-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="absolute top-1 right-1 rounded bg-black/60 p-0.5 text-white"
                    aria-label="제거"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-1 inset-x-1 flex justify-between">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded bg-black/60 px-1 text-[11px] text-white disabled:opacity-30" aria-label="앞으로">←</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded bg-black/60 px-1 text-[11px] text-white disabled:opacity-30" aria-label="뒤로">→</button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={buildPdf}
              disabled={busy}
              className={buttonVariants({ className: 'gap-1.5 w-full' })}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? '생성 중…' : 'PDF로 저장'}
            </button>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            휴대폰으로 찍은 서류 사진 여러 장을 명암 보정 후 한 개의 PDF로 묶습니다.
            &quot;고대비(문서)&quot; 모드는 흰 종이의 글자를 또렷하게 만듭니다. 페이지 순서는 ←→로
            바꿀 수 있습니다. 모든 처리는 브라우저 안에서 이뤄지며 이미지는 어디로도
            전송되지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
