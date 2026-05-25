'use client';

import { useMemo, useState } from 'react';
import { Subtitles, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  formatTimecode,
  parseSubtitle,
  serializeSubtitle,
  shiftSubtitles,
  type SubtitleCue,
  type SubtitleFormat,
} from '@/lib/tools/subtitles';

export default function SubtitleEditPage() {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [origFormat, setOrigFormat] = useState<SubtitleFormat>('srt');
  const [outputFormat, setOutputFormat] = useState<SubtitleFormat>('srt');
  const [offset, setOffset] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(f: File) {
    setError(null);
    try {
      const text = await f.text();
      const parsed = parseSubtitle(text);
      setCues(parsed.cues);
      setOrigFormat(parsed.format);
      setOutputFormat(parsed.format === 'txt' ? 'srt' : parsed.format);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파싱 실패');
    }
  }

  function updateCue(idx: number, patch: Partial<SubtitleCue>) {
    setCues((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function removeCue(idx: number) {
    setCues((prev) => prev.filter((_, i) => i !== idx));
  }

  function addCue() {
    const last = cues[cues.length - 1];
    const start = last ? last.end : 0;
    setCues((prev) => [...prev, { index: prev.length + 1, start, end: start + 3, text: '' }]);
  }

  const shifted = useMemo(() => shiftSubtitles(cues, offset, rate), [cues, offset, rate]);
  const serialized = useMemo(() => serializeSubtitle(shifted, outputFormat), [shifted, outputFormat]);

  const downloadUrl = useMemo(() => {
    const blob = new Blob([serialized], { type: 'text/plain;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, [serialized]);

  const filename = `subtitle.${outputFormat}`;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Subtitles className="h-5 w-5" />
          <h1 className="text-xl font-semibold">자막 편집·시간 보정·변환</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          SRT · VTT · ASS · LRC 자막을 편집하고 시간을 보정한 뒤 원하는 포맷으로 내보냅니다.
        </p>
      </header>

      <FileDropZone accept=".srt,.vtt,.ass,.lrc,.txt,text/plain" onFiles={(f) => f[0] && handleFile(f[0])} title="자막 파일 드롭" />

      {error && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {cues.length > 0 && (
        <>
          <div className="rounded-xl border bg-card p-3 grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">시간 보정 (초)</label>
              <input type="number" step={0.1} value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="시간 보정 (초)" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">시간 배속</label>
              <input type="number" step={0.01} min={0.1} max={5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="시간 배속" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">출력 포맷</label>
              <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as SubtitleFormat)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
                <option value="srt">SRT</option>
                <option value="vtt">VTT</option>
                <option value="ass">ASS</option>
                <option value="lrc">LRC</option>
                <option value="txt">TXT (텍스트만)</option>
              </select>
            </div>
            <p className="col-span-3 text-[10px] text-muted-foreground">원본 포맷: {origFormat.toUpperCase()} · {cues.length}개 cue</p>
          </div>

          <div className="rounded-xl border bg-card divide-y max-h-[60vh] overflow-y-auto">
            {cues.map((c, i) => (
              <div key={i} className="p-2 grid grid-cols-[80px_80px_1fr_24px] gap-2 items-start text-xs">
                <input
                  value={formatTimecode(c.start, ',')}
                  onChange={(e) => updateCue(i, { start: parseTimeInput(e.target.value) })}
                  aria-label={`자막 ${i + 1} 시작 시간`}
                  className="rounded-md border bg-background px-1 py-0.5 font-mono"
                />
                <input
                  value={formatTimecode(c.end, ',')}
                  onChange={(e) => updateCue(i, { end: parseTimeInput(e.target.value) })}
                  aria-label={`자막 ${i + 1} 끝 시간`}
                  className="rounded-md border bg-background px-1 py-0.5 font-mono"
                />
                <textarea
                  value={c.text}
                  onChange={(e) => updateCue(i, { text: e.target.value })}
                  aria-label={`자막 ${i + 1} 텍스트`}
                  className="rounded-md border bg-background px-1.5 py-1 min-h-[2em] leading-snug"
                  rows={2}
                />
                <button onClick={() => removeCue(i)} className="text-destructive hover:text-destructive/70" title="삭제">×</button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addCue}>+ cue 추가</Button>

          <a href={downloadUrl} download={filename} className={buttonVariants({ variant: 'default', className: 'w-full' })}>
            <Download className="h-4 w-4" /> {filename} 다운로드
          </a>
        </>
      )}
    </main>
  );
}

function parseTimeInput(s: string): number {
  const cleaned = s.replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
  return Number(parts[0]) || 0;
}
