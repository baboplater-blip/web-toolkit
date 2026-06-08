'use client';

import { useRef, useState } from 'react';
import { Loader2, X, FileText } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { extractPlainText, openPdfDoc } from '@/lib/tools/pdf-text';

interface Match {
  filename: string;
  page: number;
  snippet: string;
  start: number;
}

export default function PdfSearchPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [whole, setWhole] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const abortRef = useRef<{ aborted: boolean } | null>(null);

  async function handleSearch() {
    if (files.length === 0 || !query.trim()) {
      setError('PDF 1개 이상 + 검색어를 입력하세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setMatches([]);
    setProgress(0);
    const token = { aborted: false };
    abortRef.current = token;

    try {
      const out: Match[] = [];
      const re = buildRegex(query, caseSensitive, whole);

      for (let f = 0; f < files.length; f++) {
        if (token.aborted) break;
        const file = files[f];
        try {
          const pdf = await openPdfDoc(file);
          const pages = await extractPlainText(pdf, {
            signal: token,
            onProgress: (p) => setProgress(Math.round(((f + p) / files.length) * 100)),
          });
          pdf.destroy();
          pages.forEach((text, pageIdx) => {
            let m: RegExpExecArray | null;
            while ((m = re.exec(text))) {
              const start = Math.max(0, m.index - 40);
              const end = Math.min(text.length, m.index + m[0].length + 40);
              const snippet = text.slice(start, end).replace(/\n/g, ' ');
              out.push({
                filename: file.name,
                page: pageIdx + 1,
                snippet,
                start: m.index - start,
              });
              if (m.index === re.lastIndex) re.lastIndex++;
            }
          });
          setMatches([...out]);
        } catch (e) {
          out.push({ filename: file.name, page: 0, snippet: `[오류: ${e instanceof Error ? e.message : '읽기 실패'}]`, start: 0 });
        }
      }
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : '검색에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.aborted = true;
  }

  function handleReset() {
    setFiles([]);
    setQuery('');
    setMatches(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="다중 PDF 텍스트 검색" widthClass="max-w-3xl" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        여러 PDF 에서 키워드를 한꺼번에 찾고 페이지·문맥을 표시합니다.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        maxBytes={100 * 1024 * 1024}
        multiple
        onFiles={(arr) => setFiles((prev) => [...prev, ...arr])}
        title="PDF 여러 개를 끌어다 놓거나 클릭"
      />

      {files.length > 0 && (
        <div className="rounded-xl border bg-card p-3 space-y-1">
          <p className="text-xs font-semibold">{files.length}개 파일</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-1">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate flex-1">{f.name}</span>
                <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" onClick={() => setFiles([])}>모두 제거</Button>
        </div>
      )}

      <div className="space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="검색어"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" aria-label="검색어" />
        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" className="h-3.5 w-3.5" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
            대소문자 구분
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" className="h-3.5 w-3.5" checked={whole} onChange={(e) => setWhole(e.target.checked)} />
            전체 단어
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSearch} disabled={busy || files.length === 0 || !query.trim()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          검색
        </Button>
        {busy && (
          <>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="취소">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {matches && matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium">검색 결과: {matches.length.toLocaleString()}건</p>
          <div className="rounded-xl border bg-card max-h-[60vh] overflow-y-auto divide-y">
            {matches.slice(0, 500).map((m, i) => (
              <div key={i} className="p-3 text-xs space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{m.filename}</span>
                  <span>· p.{m.page}</span>
                </div>
                <p className="font-mono leading-relaxed">
                  …{highlightMatch(m.snippet, query, caseSensitive, whole)}…
                </p>
              </div>
            ))}
            {matches.length > 500 && (
              <p className="p-3 text-xs text-muted-foreground">… 외 {matches.length - 500}건 (상위 500건만 표시)</p>
            )}
          </div>
        </div>
      )}

      {matches && matches.length === 0 && !busy && (
        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">검색 결과 없음</div>
      )}
      </main>
    </div>
  );
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegex(q: string, caseSensitive: boolean, whole: boolean): RegExp {
  const flags = caseSensitive ? 'g' : 'gi';
  const base = escapeReg(q);
  const pat = whole ? `\\b${base}\\b` : base;
  return new RegExp(pat, flags);
}

function highlightMatch(snippet: string, q: string, caseSensitive: boolean, whole: boolean): React.ReactNode {
  const re = buildRegex(q, caseSensitive, whole);
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(snippet))) {
    if (m.index > last) parts.push(snippet.slice(last, m.index));
    parts.push(<mark key={m.index} className="bg-amber-300/50 dark:bg-amber-500/40 rounded px-0.5">{m[0]}</mark>);
    last = m.index + m[0].length;
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  if (last < snippet.length) parts.push(snippet.slice(last));
  return parts;
}
