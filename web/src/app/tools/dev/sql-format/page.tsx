'use client';

import { useState } from 'react';
import { Database, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DIALECTS = [
  { value: 'sql', label: '표준 SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'tsql', label: 'SQL Server (T-SQL)' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'redshift', label: 'Redshift' },
  { value: 'spark', label: 'Spark SQL' },
] as const;

type Dialect = (typeof DIALECTS)[number]['value'];

export default function SqlFormatPage() {
  const [input, setInput] = useState(
    'select u.id,u.name,count(o.id) as orders from users u left join orders o on u.id=o.user_id where u.active=1 group by u.id,u.name having count(o.id)>0 order by orders desc limit 10;',
  );
  const [output, setOutput] = useState('');
  const [dialect, setDialect] = useState<Dialect>('sql');
  const [tabWidth, setTabWidth] = useState(2);
  const [keywordCase, setKeywordCase] = useState<'upper' | 'lower' | 'preserve'>('upper');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFormat() {
    setError(null);
    setBusy(true);
    try {
      const { format } = await import('sql-formatter');
      const out = format(input, {
        language: dialect,
        tabWidth,
        keywordCase,
        linesBetweenQueries: 2,
      });
      setOutput(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SQL 포맷에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMinify() {
    setError(null);
    setBusy(true);
    try {
      const minified = input
        .replace(/--[^\n]*\n/g, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      setOutput(minified);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SQL 압축에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h1 className="text-xl font-semibold">SQL 포맷터</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          SQL 쿼리를 보기 좋게 정렬·들여쓰기합니다. 10종 SQL 방언 지원.
        </p>
      </header>

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">방언</label>
            <select value={dialect} onChange={(e) => setDialect(e.target.value as Dialect)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">들여쓰기</label>
            <select value={tabWidth} onChange={(e) => setTabWidth(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
              <option value={2}>2 칸</option>
              <option value={4}>4 칸</option>
              <option value={1}>탭 (1)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">키워드</label>
            <select value={keywordCase} onChange={(e) => setKeywordCase(e.target.value as 'upper' | 'lower' | 'preserve')} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
              <option value="upper">대문자</option>
              <option value="lower">소문자</option>
              <option value="preserve">원본 유지</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">SQL</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-xs font-mono h-48 leading-relaxed" aria-label="SQL" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleFormat} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          포맷
        </Button>
        <Button variant="outline" onClick={handleMinify} disabled={busy}>한 줄로 압축</Button>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">결과</label>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <textarea readOnly value={output} className="w-full rounded-md border bg-card p-3 text-xs font-mono h-72 leading-relaxed" aria-label="결과" />
        </div>
      )}
    </main>
  );
}
