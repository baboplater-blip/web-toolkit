'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

/**
 * EPUB → PDF
 *
 * 처리 흐름:
 *   1. EPUB(zip) 풀기 (JSZip)
 *   2. META-INF/container.xml → OPF 경로
 *   3. OPF 의 manifest + spine 분석 → 챕터 reading order
 *   4. 각 챕터 XHTML 의 이미지(src) 를 zip 내 자산 → Blob URL 로 치환
 *   5. 모든 챕터를 하나의 hidden div 에 결합
 *   6. jsPDF.html() 호출 → A4 페이지 자동 분할
 *
 * 제약:
 *   - html2canvas 가 모든 콘텐츠를 이미지로 변환 → PDF 내 텍스트 검색·복사 불가
 *   - 한국어 폰트 의존 없음 (이미지 변환이라 깨짐 X)
 *   - 50MB / 200페이지 미만 EPUB 권장 (메모리 한계)
 */

type Stage = 'idle' | 'unzipping' | 'parsing' | 'rendering' | 'pdf' | 'done';

export default function EpubToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<{ aborted: boolean } | null>(null);

  const processing = stage !== 'idle' && stage !== 'done';

  function reset() {
    abortRef.current = null;
    setStage('idle');
    setProgress(0);
    setProgressText('');
  }

  async function handleProcess() {
    if (!file) {
      setError('EPUB 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setResult(null);
    const token = { aborted: false };
    abortRef.current = token;

    try {
      const checkAbort = () => {
        if (token.aborted) throw new Error('작업이 취소되었습니다.');
      };

      setStage('unzipping');
      setProgressText('EPUB 압축 풀기');
      setProgress(2);

      const JSZipMod = await import('jszip');
      const JSZip = JSZipMod.default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      checkAbort();

      setStage('parsing');
      setProgressText('목차 분석');
      setProgress(8);

      // 1) container.xml → OPF 경로
      const containerFile = zip.file('META-INF/container.xml');
      if (!containerFile) throw new Error('유효한 EPUB이 아닙니다 (META-INF/container.xml 없음).');
      const containerXml = await containerFile.async('text');
      const opfPath = parseContainer(containerXml);
      const opfFile = zip.file(opfPath);
      if (!opfFile) throw new Error(`OPF 파일을 찾을 수 없습니다: ${opfPath}`);
      const opfXml = await opfFile.async('text');

      // 2) OPF 의 manifest + spine
      const { manifest, spine, title } = parseOpf(opfXml);
      if (spine.length === 0) throw new Error('읽을 챕터가 없습니다.');

      // 3) OPF 기준 상대 경로 헬퍼
      const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
      const resolve = (href: string) => normalize(opfDir + href);

      // 4) 이미지 자산을 Blob URL 로 캐시
      const blobUrls = new Map<string, string>();
      const releaseBlobs = () => {
        for (const url of blobUrls.values()) URL.revokeObjectURL(url);
        blobUrls.clear();
      };

      try {
        setStage('rendering');
        setProgressText('챕터 변환 중');
        setProgress(15);

        // 5) 모든 챕터 HTML 을 결합
        const sections: string[] = [];
        for (let i = 0; i < spine.length; i++) {
          checkAbort();
          const idref = spine[i];
          const item = manifest.get(idref);
          if (!item) continue;
          const chapterPath = resolve(item.href);
          const chapterFile = zip.file(chapterPath);
          if (!chapterFile) continue;
          const xhtml = await chapterFile.async('text');
          const transformed = await rewriteAssets(xhtml, chapterPath, zip, blobUrls);
          sections.push(`<section data-chapter="${i}">${transformed}</section>`);

          const percent = 15 + Math.round(((i + 1) / spine.length) * 45); // 15→60
          setProgress(percent);
          setProgressText(`챕터 변환 중 (${i + 1}/${spine.length})`);
        }

        const combined = sections.join('\n<div style="page-break-after: always;"></div>\n');

        // 6) 임시 hidden div 에 주입
        setStage('pdf');
        setProgressText('PDF 조립 중 — 큰 파일은 시간이 걸립니다');
        setProgress(65);

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '595px'; // A4 width in pt
        container.style.padding = '36pt 40pt';
        container.style.color = '#111';
        container.style.background = '#fff';
        container.style.fontFamily = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
        container.style.fontSize = '11pt';
        container.style.lineHeight = '1.6';
        container.innerHTML = combined;
        document.body.appendChild(container);

        try {
          const { jsPDF } = await import('jspdf');
          const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });

          await pdf.html(container, {
            x: 0,
            y: 0,
            width: 595,
            windowWidth: 595,
            margin: 0,
            autoPaging: 'text',
            html2canvas: {
              scale: 0.96,
              useCORS: false,
              allowTaint: true,
              backgroundColor: '#ffffff',
            },
            callback: () => {},
          });
          checkAbort();
          setProgress(95);

          const baseName = file.name.replace(/\.epub$/i, '') || title || 'book';
          const blob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(blob);
          setResult({
            blobUrl,
            filename: `${baseName}.pdf`,
            originalSize: file.size,
            compressedSize: blob.size,
          });
          setProgress(100);
          setStage('done');
        } finally {
          container.remove();
        }
      } finally {
        releaseBlobs();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '변환에 실패했습니다.';
      setError(msg);
      reset();
    } finally {
      setProgressText('');
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EPUB → PDF" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          EPUB 전자책을 PDF 로 변환합니다. 50 MB · 200 페이지 이하 권장.
        </p>

      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
        hint="50 MB 이하 권장"
      />

      {file && !processing && !result && (
        <p className="text-xs text-muted-foreground">
          선택됨: <span className="text-foreground font-medium">{file.name}</span> ({fmtSize(file.size)})
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={processing || !file}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          PDF 로 변환
        </Button>
        {processing && (
          <>
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="변환 진행률"
            >
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="취소">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {processing && progressText && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {progressText}
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {result && (
        <ResultCard
          fileName={result.filename}
          originalSize={result.originalSize}
          compressedSize={result.compressedSize}
          blobUrl={result.blobUrl}
          extraInfo="브라우저에서 직접 변환됨"
        />
      )}

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">알아두실 점</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>변환은 모두 브라우저 안에서 수행되며 EPUB 파일이 서버로 전송되지 않습니다.</li>
          <li>PDF 내 텍스트는 이미지로 변환되어 복사·검색이 어려울 수 있습니다.</li>
          <li>큰 책(100 MB+) 은 메모리 부족이 날 수 있어 권장하지 않습니다.</li>
        </ul>
      </div>
    </main>
    </div>
  );
}

/* ---------- helpers ---------- */

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseContainer(xml: string): string {
  const m = xml.match(/<rootfile[^>]*full-path=["']([^"']+)["']/i);
  if (!m) throw new Error('container.xml 에서 OPF 경로를 찾지 못했습니다.');
  return m[1];
}

interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

function parseOpf(xml: string): {
  manifest: Map<string, ManifestItem>;
  spine: string[];
  title: string;
} {
  const manifest = new Map<string, ManifestItem>();
  const itemRegex = /<item\b[^>]*\/>/gi;
  for (const m of xml.matchAll(itemRegex)) {
    const tag = m[0];
    const id = attr(tag, 'id');
    const href = attr(tag, 'href');
    const mediaType = attr(tag, 'media-type');
    if (id && href) manifest.set(id, { id, href, mediaType: mediaType ?? '' });
  }

  const spine: string[] = [];
  const itemrefRegex = /<itemref\b[^>]*>/gi;
  for (const m of xml.matchAll(itemrefRegex)) {
    const idref = attr(m[0], 'idref');
    if (idref) spine.push(idref);
  }

  const titleMatch = xml.match(/<dc:title[^>]*>([^<]*)<\/dc:title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  return { manifest, spine, title };
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
  const m = tag.match(re);
  return m ? m[1] : null;
}

function normalize(path: string): string {
  const parts: string[] = [];
  for (const seg of path.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

async function rewriteAssets(
  xhtml: string,
  chapterPath: string,
  zip: any, // JSZip 인스턴스
  cache: Map<string, string>,
): Promise<string> {
  const chapterDir = chapterPath.includes('/')
    ? chapterPath.substring(0, chapterPath.lastIndexOf('/') + 1)
    : '';

  // body 내부만 추출 (head·script 제거로 안정성 확보)
  const bodyMatch = xhtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : xhtml;

  // <img src="..."> 와 <image href="..."> (SVG) 의 상대 경로를 blob URL 로
  const srcRegex = /\b(src|href|xlink:href)\s*=\s*["']([^"']+)["']/gi;
  const replacements: Array<{ raw: string; replacement: string }> = [];
  const matches = [...body.matchAll(srcRegex)];
  for (const m of matches) {
    const [raw, attrName, value] = m;
    if (/^(https?:|data:|blob:|#|mailto:)/i.test(value)) continue;
    const resolved = normalize(chapterDir + value);
    const ext = resolved.split('.').pop()?.toLowerCase() ?? '';
    // 이미지 자산만 치환
    if (!['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) continue;

    let blobUrl = cache.get(resolved);
    if (!blobUrl) {
      const f = zip.file(resolved);
      if (!f) continue;
      const blob = await f.async('blob');
      const mime =
        ext === 'svg'
          ? 'image/svg+xml'
          : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : `image/${ext}`;
      blobUrl = URL.createObjectURL(new Blob([blob], { type: mime }));
      cache.set(resolved, blobUrl);
    }
    replacements.push({ raw, replacement: `${attrName}="${blobUrl}"` });
  }

  // 한꺼번에 치환 (대체 순서가 길이 변화에 영향받지 않도록 unique 대체)
  for (const { raw, replacement } of replacements) {
    body = body.replace(raw, replacement);
  }

  // 스크립트·외부 스타일시트 링크 제거 (안정성)
  body = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*\/?>/gi, '');

  return body;
}
