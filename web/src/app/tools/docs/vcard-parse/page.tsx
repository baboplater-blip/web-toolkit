'use client';

import { useState } from 'react';
import { Contact, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';

interface VCardEntry {
  name: string;
  org: string;
  phones: string[];
  emails: string[];
}

const CSV_HEADERS = ['이름', '조직', '전화', '이메일'] as const;

/**
 * vCard 의 folded line(다음 줄이 공백/탭으로 시작하면 이어진 줄)을 펼친다.
 * RFC 6350 §3.2.
 */
function unfoldLines(text: string): string[] {
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const unfolded: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

/**
 * vCard 라인을 `이름;파라미터:값` 구조로 분해한다.
 * 콜론 앞부분에서 첫 세미콜론까지가 속성명, 나머지는 파라미터.
 */
function parseLine(line: string): { property: string; value: string } | null {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return null;
  const head = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1);
  const property = head.split(';')[0].toUpperCase();
  return { property, value };
}

/** vCard TEXT 값 언이스케이프 (\\n, \\,, \\; , \\\\) */
function unescapeValue(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** N 속성(성;이름;...)을 사람이 읽을 이름으로 조합한다. */
function formatStructuredName(value: string): string {
  const parts = value.split(';').map((part) => unescapeValue(part).trim());
  const [family = '', given = '', additional = ''] = parts;
  // 한국식: 성 + 이름 붙여쓰기 우선, 공백 분리가 자연스러운 경우 대비해 trim
  const joined = [family, given, additional].filter(Boolean).join(' ').trim();
  return joined;
}

/**
 * 펼쳐진 라인들을 vCard 단위(BEGIN:VCARD…END:VCARD)로 묶어 파싱한다.
 */
function parseVCards(text: string): VCardEntry[] {
  const lines = unfoldLines(text);
  const entries: VCardEntry[] = [];
  let current: VCardEntry | null = null;
  let structuredName = '';
  let formattedName = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const parsed = parseLine(trimmed);
    if (!parsed) continue;
    const { property, value } = parsed;

    if (property === 'BEGIN' && value.trim().toUpperCase() === 'VCARD') {
      current = { name: '', org: '', phones: [], emails: [] };
      structuredName = '';
      formattedName = '';
      continue;
    }

    if (property === 'END' && value.trim().toUpperCase() === 'VCARD') {
      if (current) {
        current.name = formattedName || structuredName || '(이름 없음)';
        entries.push(current);
      }
      current = null;
      continue;
    }

    if (!current) continue;

    switch (property) {
      case 'FN':
        formattedName = unescapeValue(value).trim();
        break;
      case 'N':
        structuredName = formatStructuredName(value);
        break;
      case 'TEL': {
        const phone = unescapeValue(value).trim();
        if (phone) current.phones.push(phone);
        break;
      }
      case 'EMAIL': {
        const email = unescapeValue(value).trim();
        if (email) current.emails.push(email);
        break;
      }
      case 'ORG':
        current.org = value
          .split(';')
          .map((part) => unescapeValue(part).trim())
          .filter(Boolean)
          .join(', ');
        break;
      default:
        break;
    }
  }

  return entries;
}

/** CSV 필드 따옴표 처리 (콤마·따옴표·줄바꿈 포함 시 감싸고 내부 따옴표는 이중화) */
function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(entries: VCardEntry[]): string {
  const rows: string[] = [];
  rows.push(CSV_HEADERS.join(','));
  for (const entry of entries) {
    rows.push(
      [
        csvField(entry.name),
        csvField(entry.org),
        csvField(entry.phones.join(' / ')),
        csvField(entry.emails.join(' / ')),
      ].join(','),
    );
  }
  // Excel 한글 호환을 위해 UTF-8 BOM 포함
  return '﻿' + rows.join('\r\n') + '\r\n';
}

export default function VcardParsePage() {
  const [entries, setEntries] = useState<VCardEntry[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    setError(null);
    const file = files[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (!/BEGIN:VCARD/i.test(text)) {
        setEntries(null);
        setFileName(null);
        setError('vCard(BEGIN:VCARD) 형식을 찾을 수 없습니다. .vcf 파일인지 확인해 주세요.');
        return;
      }
      const parsed = parseVCards(text);
      if (parsed.length === 0) {
        setEntries(null);
        setFileName(null);
        setError('연락처를 추출하지 못했습니다. 파일이 손상되었을 수 있습니다.');
        return;
      }
      setEntries(parsed);
      setFileName(file.name);
    } catch (e) {
      console.error('vCard parse failed:', e);
      setEntries(null);
      setFileName(null);
      setError(e instanceof Error ? e.message : 'vCard 파일을 읽을 수 없습니다.');
    }
  }

  function exportCsv() {
    if (!entries || entries.length === 0) return;
    const blob = new Blob([toCsv(entries)], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, 'contacts.csv');
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Contact className="h-5 w-5 text-primary" aria-hidden />
          vCard 파서
        </h1>
        <p className="text-sm text-muted-foreground">
          .vcf 연락처 파일을 읽어 이름·전화·이메일을 표로 보여주고 CSV 로 내보냅니다.
        </p>
      </header>

      <FileDropZone
        accept=".vcf,text/vcard"
        onFiles={handleFiles}
        onError={setError}
        description="vCard 파일(.vcf)을 선택하세요"
      />

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {entries && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {fileName} · 연락처 {entries.length}명
            </span>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" /> CSV 내보내기
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/60">
                <tr>
                  {CSV_HEADERS.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="border-b px-3 py-2 text-left font-medium"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className="odd:bg-background even:bg-muted/20">
                    <td className="border-b px-3 py-1.5 align-top">{entry.name}</td>
                    <td className="border-b px-3 py-1.5 align-top">
                      {entry.org || '—'}
                    </td>
                    <td className="border-b px-3 py-1.5 align-top">
                      {entry.phones.length > 0 ? (
                        <ul className="space-y-0.5">
                          {entry.phones.map((phone, phoneIndex) => (
                            <li key={phoneIndex} className="font-mono text-xs">
                              {phone}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="border-b px-3 py-1.5 align-top">
                      {entry.emails.length > 0 ? (
                        <ul className="space-y-0.5">
                          {entry.emails.map((email, emailIndex) => (
                            <li key={emailIndex} className="font-mono text-xs">
                              {email}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
