'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { slugify } from '@/lib/tools/slugify';

export default function SlugifyPage() {
  const [input, setInput] = useState('안녕하세요 Hello World');
  const [separator, setSeparator] = useState<'-' | '_'>('-');
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => slugify(input, separator, lowercase),
    [input, separator, lowercase],
  );

  async function copy() {
    if (!output) return;
    await navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="슬러그 변환" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">제목을 URL 슬러그로 변환합니다. 한글은 로마자로 음역합니다.</p>

      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
        <label className="flex items-center gap-2">
          구분자
          <select
            className="rounded-lg border bg-background px-2 py-1 text-sm"
            value={separator}
            onChange={(e) => setSeparator(e.target.value === '_' ? '_' : '-')}
            aria-label="구분자"
          >
            <option value="-">하이픈 ( - )</option>
            <option value="_">밑줄 ( _ )</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={lowercase}
            onChange={(e) => setLowercase(e.target.checked)}
          />
          소문자로 변환
        </label>
      </div>

      <div className="space-y-2">
        <textarea
          className="min-h-32 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="제목을 입력하세요"
          aria-label="입력"
        />
        <div className="flex items-center gap-2">
          <textarea
            className="min-h-16 flex-1 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="슬러그 결과"
            aria-label="결과"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={copy}
            disabled={!output}
            aria-label="슬러그 복사"
            title="복사"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </main>
    </div>
  );
}
