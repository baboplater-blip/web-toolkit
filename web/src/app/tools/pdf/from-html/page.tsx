'use client';

import DOMPurify from 'dompurify';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

type PageSize = 'a4' | 'letter';
type Orientation = 'portrait' | 'landscape';

const DEFAULT_HTML = `<h1>제목</h1>
<p>여기에 HTML 을 입력하면 PDF 로 변환됩니다.</p>
<p>한국어, <strong>볼드</strong>, <em>이탤릭</em>, 리스트, 표 모두 지원합니다.</p>
<ul>
  <li>항목 1</li>
  <li>항목 2</li>
</ul>`;

export default function HtmlToPdfPage() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [margin, setMargin] = useState(40);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  async function handleProcess() {
    if (!html.trim()) {
      setError('HTML 내용을 입력해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'pt', format: pageSize, orientation });
      const pageW = pdf.internal.pageSize.getWidth();

      // 화면 밖 배치는 바깥 host 에만 준다(캡처 대상 노드에는 위치 스타일을 두지 않는다).
      const host = document.createElement('div');
      host.style.position = 'fixed';
      host.style.left = '-9999px';
      host.style.top = '0';
      // 사이트 전역 Tailwind preflight(@layer base)가 h1·ul 등의 기본 스타일을 지워 버리므로,
      // 레이어 밖(우선순위 높음)·0 특이도 규칙으로 사용자 HTML 요소를 브라우저 기본 스타일로 되돌린다.
      // (사용자 <style>/인라인 스타일은 이 규칙보다 우선한다)
      const reset = document.createElement('style');
      reset.textContent = ':where(.h2p-root) :where(*) { all: revert; }';
      host.appendChild(reset);
      const container = document.createElement('div');
      container.className = 'h2p-root';
      container.style.width = `${pageW - margin * 2}px`;
      container.style.padding = '0';
      container.style.color = '#111';
      container.style.background = '#fff';
      container.style.fontFamily = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
      container.style.fontSize = '11pt';
      container.style.lineHeight = '1.6';
      // 업로드/입력된 HTML 을 라이브 DOM 에 그대로 주입하면 악성 <script>·<img onerror>
      // 등이 실행될 수 있으므로 DOMPurify 로 정화한다. jsPDF/html2canvas 렌더에는
      // 스크립트·이벤트 핸들러가 필요 없다(base64 인라인 이미지는 유지됨).
      // DOMPurify 는 window 가 필요하므로 클라이언트에서만 동작(이 핸들러는 항상 클라이언트).
      const wrapped = wrapHtml(html);
      container.innerHTML =
        typeof window !== 'undefined' ? DOMPurify.sanitize(wrapped) : wrapped;
      host.appendChild(container);
      document.body.appendChild(host);

      try {
        // jsPDF.html() 은 텍스트를 jsPDF 기본(라틴) 폰트로 다시 그려 한글이 깨진다.
        // → html2canvas-pro(최신 색 함수 지원)로 브라우저 폰트 그대로 래스터화한 뒤 페이지 높이로 잘라 넣는다.
        const html2canvas = (await import('html2canvas-pro')).default;
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        const pageH = pdf.internal.pageSize.getHeight();
        const contentW = pageW - margin * 2;
        const contentH = pageH - margin * 2;
        const pxPerPt = canvas.width / contentW;
        const sliceHpx = Math.max(1, Math.floor(contentH * pxPerPt));
        const breaks = computeBreaks(container, sliceHpx, canvas.width / (container.offsetWidth || contentW), canvas.height);
        for (let i = 0; i + 1 < breaks.length; i++) {
          const y = breaks[i];
          const h = Math.max(1, breaks[i + 1] - y);
          const slice = document.createElement('canvas');
          slice.width = canvas.width;
          slice.height = h;
          const sctx = slice.getContext('2d');
          if (!sctx) throw new Error('캔버스를 만들 수 없습니다.');
          sctx.fillStyle = '#ffffff';
          sctx.fillRect(0, 0, slice.width, h);
          sctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
          if (i > 0) pdf.addPage();
          pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, contentW, h / pxPerPt);
        }
        const blob = pdf.output('blob');
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        setResult({
          blobUrl: URL.createObjectURL(blob),
          filename: `html-${ts}.pdf`,
          originalSize: new Blob([html]).size,
          compressedSize: blob.size,
        });
      } finally {
        host.remove();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleFileUpload(f: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setHtml(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsText(f);
  }

  function handleReset() {
    setHtml(DEFAULT_HTML);
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="HTML → PDF" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        HTML 코드를 PDF 로 변환합니다. 한글 폰트·CSS·인라인 스타일 지원.
      </p>

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">페이지 크기</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PageSize)}
              className="w-full rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">방향</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as Orientation)}
              className="w-full rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="portrait">세로</option>
              <option value="landscape">가로</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">여백 (pt)</label>
            <input
              type="number"
              min={0}
              max={120}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="여백 (pt)" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input
            type="file"
            accept=".html,.htm,text/html"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="text-xs"
          />
          <span className="text-muted-foreground">HTML 파일 업로드 (선택)</span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">HTML</label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full rounded-md border bg-background p-2 text-xs font-mono h-72 leading-relaxed" aria-label="HTML" />
        </div>
      </div>

      <Button onClick={handleProcess} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        PDF 만들기
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

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>외부 이미지 URL 은 CORS 제약으로 로드되지 않을 수 있습니다. base64 인라인 이미지를 권장합니다.</p>
      </div>
      </main>
    </div>
  );
}

/**
 * 캔버스 픽셀 기준 페이지 분할 위치. 문단·표 행·이미지 등 블록이 페이지 경계에 걸치면
 * (한 페이지보다 작은 블록에 한해) 그 블록 시작점에서 잘라 글줄이 반으로 잘리지 않게 한다.
 */
function computeBreaks(root: HTMLElement, pageHpx: number, pxPerCss: number, totalPx: number): number[] {
  const base = root.getBoundingClientRect().top;
  const blocks: Array<[number, number]> = [];
  root.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6,li,img,tr,pre,blockquote,figure,svg,dt,dd').forEach((n) => {
    const r = n.getBoundingClientRect();
    if (r.height > 0) blocks.push([(r.top - base) * pxPerCss, (r.bottom - base) * pxPerCss]);
  });
  const breaks = [0];
  let y = 0;
  while (y + 1 < totalPx) {
    let cut = Math.min(y + pageHpx, totalPx);
    if (cut < totalPx) {
      for (let guard = 0; guard < 20; guard++) {
        let moved = false;
        for (const [top, bottom] of blocks) {
          if (top < cut - 1 && bottom > cut + 1 && bottom - top < pageHpx * 0.9 && top > y + pageHpx * 0.3) {
            cut = Math.floor(top);
            moved = true;
          }
        }
        if (!moved) break;
      }
    }
    if (cut <= y) cut = Math.min(y + pageHpx, totalPx);
    breaks.push(cut);
    y = cut;
  }
  return breaks;
}

function wrapHtml(inner: string): string {
  const trimmed = inner.trim();
  if (/^<(!doctype|html|body)/i.test(trimmed)) {
    return trimmed;
  }
  return `<div>${trimmed}</div>`;
}
