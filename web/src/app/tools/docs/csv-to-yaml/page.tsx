'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

const SAMPLE_CSV = `name,age,active,city
Alice,30,true,Seoul
Bob,25,false,Busan
Charlie,35,true,Incheon`;

/** YAML 에서 따옴표 없이 쓸 수 있는 평범한 스칼라(영숫자·일부 기호)면 true. */
function isPlainScalar(value: string): boolean {
  if (value === '') return false;
  // 예약/모호 토큰(특수 의미)은 평문 금지 → 인용 처리해 문자열임을 보존한다.
  const reserved = /^(null|~|true|false|yes|no|on|off)$/i;
  if (reserved.test(value)) return false;
  // 숫자처럼 보이는 문자열도 인용해 문자열임을 보존한다.
  if (/^[+-]?\d+(\.\d+)?$/.test(value)) return false;
  // 앞뒤 공백, 또는 YAML 흐름/특수 문자가 있으면 인용한다.
  if (value !== value.trim()) return false;
  return !/[:#{}\[\],&*!|>'"%@`?\n]/.test(value);
}

/** 문자열을 YAML 더블쿼트 스칼라로 이스케이프한다. */
function quoteYaml(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r');
  return `"${escaped}"`;
}

/**
 * 셀 문자열을 YAML 스칼라로 직렬화한다. typed 가 true 면 숫자/불리언/빈 값을
 * 각각 number·bool·null 로 추론하고, false 면 모든 값을 문자열로 취급한다.
 */
function serializeScalar(raw: string, typed: boolean): string {
  if (typed) {
    if (raw === '') return 'null';
    const lower = raw.toLowerCase();
    if (lower === 'true') return 'true';
    if (lower === 'false') return 'false';
    if (/^[+-]?\d+(\.\d+)?$/.test(raw) && Number.isFinite(Number(raw))) return raw;
  }
  if (raw === '') return "''";
  return isPlainScalar(raw) ? raw : quoteYaml(raw);
}

/** 헤더 키를 YAML 매핑 키로 직렬화한다(필요 시 인용). */
function serializeKey(key: string): string {
  return isPlainScalar(key) ? key : quoteYaml(key);
}

/**
 * 헤더 배열 + 행 객체 배열을 YAML 객체 리스트(시퀀스)로 변환한다.
 * 각 행은 `- key: value` 형태의 매핑으로, 빈 행은 건너뛴다.
 */
function rowsToYaml(headers: string[], rows: Record<string, unknown>[], typed: boolean): string {
  const lines: string[] = [];
  for (const row of rows) {
    let first = true;
    for (const header of headers) {
      const cell = row[header];
      const text = cell === null || cell === undefined ? '' : String(cell);
      const value = serializeScalar(text, typed);
      const key = serializeKey(header);
      // 시퀀스 첫 키만 "- " 들여쓰기, 나머지는 2칸 정렬.
      lines.push(`${first ? '- ' : '  '}${key}: ${value}`);
      first = false;
    }
    // 헤더가 있는데 매핑이 한 줄도 없으면(이론상) 빈 항목 방지.
    if (first) lines.push('- {}');
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}

export default function CsvToYamlPage() {
  const [input, setInput] = useState(SAMPLE_CSV);
  const [typed, setTyped] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setError(null);
      if (!input.trim()) {
        setOutput('');
        setRowCount(0);
        return;
      }
      try {
        const Papa = (await import('papaparse')).default;
        // dynamicTyping=false: 추론은 자체 옵션(typed)으로 일관되게 제어한다.
        const parsed = Papa.parse<Record<string, unknown>>(input, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
        });
        if (parsed.meta.fields == null || parsed.meta.fields.length === 0) {
          if (!cancelled) {
            setError('헤더 행을 찾을 수 없습니다. 첫 줄에 열 이름이 있어야 합니다.');
            setOutput('');
            setRowCount(0);
          }
          return;
        }
        const headers = parsed.meta.fields;
        const rows = parsed.data;
        const yaml = rowsToYaml(headers, rows, typed);
        if (!cancelled) {
          // 파싱 경고는 변환을 막지 않되 안내만 한다.
          setError(parsed.errors.length > 0 ? parsed.errors.map((e) => e.message).join('\n') : null);
          setOutput(yaml);
          setRowCount(rows.length);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'CSV 변환에 실패했습니다.');
          setOutput('');
          setRowCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [input, typed]);

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    triggerDownload(new Blob([output], { type: 'text/yaml;charset=utf-8' }), 'converted.yaml');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="CSV → YAML"
        widthClass="max-w-5xl"
        onReset={input !== SAMPLE_CSV ? () => setInput(SAMPLE_CSV) : undefined}
      />
      <main className="mx-auto max-w-5xl space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          CSV 표를 헤더를 키로 하는 YAML 객체 리스트로 변환합니다. 모든 처리는 브라우저 안에서 이루어집니다.
        </p>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={typed} onChange={(e) => setTyped(e.target.checked)} />
            타입 추론 (숫자·불리언·빈 값)
          </label>
          {rowCount > 0 && (
            <span className="ml-auto text-[10px] text-muted-foreground">레코드 {rowCount}개</span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="whitespace-pre-line rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <label className="text-xs font-medium" htmlFor="csv-input">
              입력 (CSV)
            </label>
            <textarea
              id="csv-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full resize-y rounded-lg border bg-background px-2.5 py-2 font-mono text-xs"
              aria-label="입력"
            />
          </div>
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">출력 (YAML)</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy} disabled={!output}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download} disabled={!output}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={18}
              className="w-full resize-y rounded-lg border bg-muted px-2.5 py-2 font-mono text-xs"
              aria-label="결과"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
