'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';
import { parseSubtitle, serializeSubtitle, type SubtitleFormat } from '@/lib/tools/subtitles';

export default function SubtitleConvertPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [target, setTarget] = useState<SubtitleFormat>('vtt');
  const [origFormat, setOrigFormat] = useState<SubtitleFormat | null>(null);
  const [cueCount, setCueCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [filename, setFilename] = useState('subtitle.vtt');

  async function handleFile(f: File) {
    const text = await f.text();
    setInput(text);
    setFilename(`${f.name.replace(/\.[^.]+$/, '')}.${target}`);
    convertText(text, target);
  }

  function convertText(text: string, fmt: SubtitleFormat) {
    setError(null);
    try {
      const { cues, format } = parseSubtitle(text);
      setOrigFormat(format);
      setCueCount(cues.length);
      const out = serializeSubtitle(cues, fmt);
      setOutput(out);
      const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환 실패');
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="자막 포맷 변환" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">SRT ↔ VTT ↔ ASS ↔ LRC ↔ TXT 간 자유 변환.</p>

      </header>

      <FileDropZone accept=".srt,.vtt,.ass,.lrc,.txt,text/plain" onFiles={(f) => f[0] && handleFile(f[0])} title="자막 파일 드롭" />

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium">출력 포맷:</label>
          {(['srt', 'vtt', 'ass', 'lrc', 'txt'] as SubtitleFormat[]).map((f) => (
            <Button
              key={f}
              variant={target === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTarget(f);
                setFilename((n) => n.replace(/\.[^.]+$/, '') + '.' + f);
                if (input) convertText(input, f);
              }}
            >
              {f.toUpperCase()}
            </Button>
          ))}
        </div>
        {origFormat && (
          <p className="text-[11px] text-muted-foreground">
            원본 {origFormat.toUpperCase()} · {cueCount}개 cue · → {target.toUpperCase()}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">입력</label>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (e.target.value) convertText(e.target.value, target);
          }}
          placeholder="자막 텍스트를 직접 붙여넣거나 파일을 드롭하세요."
          className="w-full rounded-md border bg-background p-3 text-xs font-mono min-h-40 resize-y leading-relaxed" aria-label="입력" />
      </div>

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {output && (
        <>
          <div className="space-y-2">
            <label className="text-xs font-medium">결과</label>
            <textarea readOnly value={output} className="w-full rounded-md border bg-card p-3 text-xs font-mono min-h-40 resize-y leading-relaxed" aria-label="결과" />
          </div>
          <a href={downloadUrl} download={filename} className={buttonVariants({ variant: 'default', className: 'w-full' })}>
            <Download className="h-4 w-4" /> {filename} 다운로드
          </a>
        </>
      )}
    </main>
    </div>
  );
}
