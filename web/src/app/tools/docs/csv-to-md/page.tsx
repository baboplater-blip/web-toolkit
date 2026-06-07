'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Table } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

type Align = 'none' | 'left' | 'center' | 'right';

const SAMPLE_CSV = `이름,역할,점수
앨리스,"개발, 리드",95
밥,"디자인",88
"캐럴 ""C""",QA,73`;

/* ------------------------------------------------------------------ */
/* CSV 파서 (RFC 4180 기반)                                            */
/* 따옴표 필드, 이스케이프된 따옴표(""), 필드·줄바꿈 내 콤마 처리.     */
/* 구분자 선택(콤마·세미콜론·탭). 빈 줄은 건너뛴다.                    */
/* ------------------------------------------------------------------ */

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    // 완전히 빈 줄(필드 하나, 내용 없음)은 무시.
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === delimiter) {
      pushField();
      i++;
      continue;
    }
    if (ch === '\r') {
      // \r\n 은 한 줄바꿈으로.
      if (text[i + 1] === '\n') i++;
      pushRow();
      i++;
      continue;
    }
    if (ch === '\n') {
      pushRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // 마지막 필드/행 flush.
  if (field !== '' || row.length > 0) pushRow();
  return rows;
}

/** 마크다운 표 셀 내 위험 문자(파이프·줄바꿈)를 안전하게 치환. */
function escapeMdCell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function alignmentMarker(align: Align): string {
  switch (align) {
    case 'left':
      return ':---';
    case 'center':
      return ':---:';
    case 'right':
      return '---:';
    default:
      return '---';
  }
}

function toMarkdownTable(rows: string[][], hasHeader: boolean, align: Align): string {
  if (rows.length === 0) return '';

  const columnCount = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const normalize = (r: string[]): string[] => {
    const cells = r.map(escapeMdCell);
    while (cells.length < columnCount) cells.push('');
    return cells;
  };

  const headerCells = hasHeader
    ? normalize(rows[0])
    : Array.from({ length: columnCount }, (_, idx) => `열 ${idx + 1}`);
  const bodyRows = hasHeader ? rows.slice(1) : rows;

  const lines: string[] = [];
  lines.push(`| ${headerCells.join(' | ')} |`);
  lines.push(`| ${Array.from({ length: columnCount }, () => alignmentMarker(align)).join(' | ')} |`);
  for (const r of bodyRows) {
    lines.push(`| ${normalize(r).join(' | ')} |`);
  }
  return lines.join('\n') + '\n';
}

const DELIMITERS: { label: string; value: string }[] = [
  { label: '콤마 (,)', value: ',' },
  { label: '세미콜론 (;)', value: ';' },
  { label: '탭', value: '\t' },
];

const ALIGNMENTS: { label: string; value: Align }[] = [
  { label: '기본', value: 'none' },
  { label: '왼쪽', value: 'left' },
  { label: '가운데', value: 'center' },
  { label: '오른쪽', value: 'right' },
];

export default function CsvToMdPage() {
  const [input, setInput] = useState(SAMPLE_CSV);
  const [output, setOutput] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [align, setAlign] = useState<Align>('none');
  const [hasHeader, setHasHeader] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      const rows = parseCsv(input, delimiter);
      if (rows.length === 0) {
        setOutput('');
        setError('변환할 데이터가 없습니다.');
        return;
      }
      setOutput(toMarkdownTable(rows, hasHeader, align));
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : 'CSV 변환에 실패했습니다.');
    }
  }, [input, delimiter, align, hasHeader]);

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    triggerDownload(new Blob([output], { type: 'text/markdown;charset=utf-8' }), 'table.md');
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Table className="h-5 w-5" />
            <h1 className="font-semibold text-base">CSV → 마크다운 표</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <label className="flex items-center gap-1.5">
            구분자
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="rounded-md border bg-background px-2 py-1"
              aria-label="구분자 선택"
            >
              {DELIMITERS.map((d) => (
                <option key={d.label} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            열 정렬
            <select
              value={align}
              onChange={(e) => setAlign(e.target.value as Align)}
              className="rounded-md border bg-background px-2 py-1"
              aria-label="열 정렬 선택"
            >
              {ALIGNMENTS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
            />
            첫 행을 헤더로 사용
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">입력 (CSV)</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false}
              aria-label="입력"
            />
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">출력 (마크다운)</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={18}
              className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y"
              aria-label="결과"
            />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          RFC 4180 기반 자체 파서 — 따옴표 필드·이스케이프된 따옴표(&quot;&quot;)·필드 내 콤마/줄바꿈 처리. 셀 내 파이프는
          이스케이프, 줄바꿈은 &lt;br&gt; 로 변환.
        </p>
      </main>
    </div>
  );
}
