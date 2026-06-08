'use client';

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

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = `${pageW - margin * 2}px`;
      container.style.padding = '0';
      container.style.color = '#111';
      container.style.background = '#fff';
      container.style.fontFamily = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
      container.style.fontSize = '11pt';
      container.style.lineHeight = '1.6';
      container.innerHTML = wrapHtml(html);
      document.body.appendChild(container);

      try {
        await pdf.html(container, {
          x: margin,
          y: margin,
          width: pageW - margin * 2,
          windowWidth: pageW - margin * 2,
          margin: [margin, margin, margin, margin],
          autoPaging: 'text',
          html2canvas: {
            scale: 0.96,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
          },
          callback: () => {},
        });
        const blob = pdf.output('blob');
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        setResult({
          blobUrl: URL.createObjectURL(blob),
          filename: `html-${ts}.pdf`,
          originalSize: new Blob([html]).size,
          compressedSize: blob.size,
        });
      } finally {
        container.remove();
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

function wrapHtml(inner: string): string {
  const trimmed = inner.trim();
  if (/^<(!doctype|html|body)/i.test(trimmed)) {
    return trimmed;
  }
  return `<div>${trimmed}</div>`;
}
