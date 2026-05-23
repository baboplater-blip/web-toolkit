/**
 * 자막 파일(SRT/VTT/ASS/LRC/TXT) 파싱·직렬화 공통 유틸.
 */

export interface SubtitleCue {
  index: number;
  start: number; // 초
  end: number;
  text: string;
}

export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'lrc' | 'txt';

export function parseSubtitle(content: string): { cues: SubtitleCue[]; format: SubtitleFormat } {
  const trimmed = content.trim();
  if (/^WEBVTT/.test(trimmed)) {
    return { cues: parseVtt(trimmed), format: 'vtt' };
  }
  if (/^\[script\s*info\]/i.test(trimmed)) {
    return { cues: parseAss(trimmed), format: 'ass' };
  }
  if (/^\[\d+:\d+/.test(trimmed)) {
    return { cues: parseLrc(trimmed), format: 'lrc' };
  }
  return { cues: parseSrt(trimmed), format: 'srt' };
}

function parseSrt(s: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = s.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length < 2) continue;
    const timeIdx = lines[0].includes('-->') ? 0 : lines[1]?.includes('-->') ? 1 : -1;
    if (timeIdx < 0) continue;
    const m = lines[timeIdx].match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    if (!m) continue;
    const start = parseTimecode(m[1]);
    const end = parseTimecode(m[2]);
    const text = lines.slice(timeIdx + 1).join('\n');
    cues.push({ index: cues.length + 1, start, end, text });
  }
  return cues;
}

function parseVtt(s: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = s.replace(/\r\n/g, '\n').replace(/^WEBVTT[^\n]*\n/, '').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length < 2) continue;
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx < 0) continue;
    const m = lines[timeIdx].match(/([\d:.]+)\s*-->\s*([\d:.]+)/);
    if (!m) continue;
    cues.push({
      index: cues.length + 1,
      start: parseTimecode(m[1]),
      end: parseTimecode(m[2]),
      text: lines.slice(timeIdx + 1).join('\n'),
    });
  }
  return cues;
}

function parseAss(s: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = s.split(/\r?\n/);
  let inEvents = false;
  let format: string[] = [];
  for (const line of lines) {
    if (/^\[events\]/i.test(line.trim())) { inEvents = true; continue; }
    if (/^\[/.test(line.trim()) && inEvents) { inEvents = false; continue; }
    if (!inEvents) continue;
    if (/^format:/i.test(line)) {
      format = line.replace(/^format:\s*/i, '').split(',').map((s) => s.trim().toLowerCase());
      continue;
    }
    if (/^dialogue:/i.test(line)) {
      const parts = line.replace(/^dialogue:\s*/i, '').split(',');
      const startIdx = format.indexOf('start');
      const endIdx = format.indexOf('end');
      const textIdx = format.indexOf('text');
      if (startIdx < 0 || endIdx < 0) continue;
      const start = parseTimecode(parts[startIdx]);
      const end = parseTimecode(parts[endIdx]);
      const text = parts.slice(textIdx).join(',').replace(/\\N/g, '\n').replace(/\{[^}]*\}/g, '');
      cues.push({ index: cues.length + 1, start, end, text });
    }
  }
  return cues;
}

function parseLrc(s: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = s.split(/\r?\n/);
  const parsed: Array<{ time: number; text: string }> = [];
  for (const line of lines) {
    const m = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (!m) continue;
    const mm = Number(m[1]);
    const ss = Number(m[2]);
    parsed.push({ time: mm * 60 + ss, text: m[3].trim() });
  }
  for (let i = 0; i < parsed.length; i++) {
    const start = parsed[i].time;
    const end = i + 1 < parsed.length ? parsed[i + 1].time : start + 3;
    cues.push({ index: i + 1, start, end, text: parsed[i].text });
  }
  return cues;
}

export function serializeSubtitle(cues: SubtitleCue[], format: SubtitleFormat): string {
  switch (format) {
    case 'srt': return toSrt(cues);
    case 'vtt': return toVtt(cues);
    case 'ass': return toAss(cues);
    case 'lrc': return toLrc(cues);
    case 'txt': return cues.map((c) => c.text).join('\n');
  }
}

function toSrt(cues: SubtitleCue[]): string {
  return cues
    .map((c, i) => `${i + 1}\n${formatTimecode(c.start, ',')} --> ${formatTimecode(c.end, ',')}\n${c.text}`)
    .join('\n\n');
}

function toVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((c) => `${formatTimecode(c.start, '.')} --> ${formatTimecode(c.end, '.')}\n${c.text}`)
    .join('\n\n');
  return `WEBVTT\n\n${body}`;
}

function toAss(cues: SubtitleCue[]): string {
  const header = `[Script Info]
Title: Web Toolkit
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default, Arial, 32, &H00FFFFFF, &H00000000, 1, 1, 1, 2, 10, 10, 20, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const events = cues
    .map((c) => `Dialogue: 0,${formatAssTime(c.start)},${formatAssTime(c.end)},Default,,0,0,0,,${c.text.replace(/\n/g, '\\N')}`)
    .join('\n');
  return header + events;
}

function toLrc(cues: SubtitleCue[]): string {
  return cues
    .map((c) => `[${formatLrcTime(c.start)}]${c.text.replace(/\n/g, ' ')}`)
    .join('\n');
}

export function parseTimecode(s: string): number {
  const cleaned = s.replace(',', '.').trim();
  const parts = cleaned.split(':');
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  return Number(parts[0]);
}

export function formatTimecode(sec: number, msSep: '.' | ',' = ','): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const hh = Math.floor(sec / 3600);
  const mm = Math.floor((sec % 3600) / 60);
  const ss = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}${msSep}${String(ms).padStart(3, '0')}`;
}

function formatAssTime(sec: number): string {
  const hh = Math.floor(sec / 3600);
  const mm = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  return `${hh}:${String(mm).padStart(2, '0')}:${ss.toFixed(2).padStart(5, '0')}`;
}

function formatLrcTime(sec: number): string {
  const mm = Math.floor(sec / 60);
  const ss = sec - mm * 60;
  return `${String(mm).padStart(2, '0')}:${ss.toFixed(2).padStart(5, '0')}`;
}

/** 모든 cue 의 시간에 offset(초) 추가, 그리고 rate(배율) 적용 */
export function shiftSubtitles(cues: SubtitleCue[], offset: number, rate = 1.0): SubtitleCue[] {
  return cues.map((c) => ({
    ...c,
    start: Math.max(0, c.start * rate + offset),
    end: Math.max(0, c.end * rate + offset),
  }));
}
