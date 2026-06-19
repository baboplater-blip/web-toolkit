'use client';

import { useMemo, useState } from 'react';
import { FileType, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/**
 * 확장자 → MIME 타입 매핑(약 80종). 한 확장자가 여러 후보를 가질 수 있고,
 * 한 MIME 타입이 여러 확장자에 매핑될 수 있어 역방향 조회는 배열로 모은다.
 */
const EXT_TO_MIME: Record<string, string> = {
  // 텍스트·코드
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  ts: 'text/typescript',
  md: 'text/markdown',
  xml: 'application/xml',
  rtf: 'application/rtf',
  ics: 'text/calendar',
  vcf: 'text/vcard',
  // 데이터·설정
  json: 'application/json',
  jsonld: 'application/ld+json',
  yaml: 'application/yaml',
  yml: 'application/yaml',
  toml: 'application/toml',
  wasm: 'application/wasm',
  // 문서
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odp: 'application/vnd.oasis.opendocument.presentation',
  epub: 'application/epub+zip',
  // 이미지
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/vnd.microsoft.icon',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
  // 폰트
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  // 오디오
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  weba: 'audio/webm',
  mid: 'audio/midi',
  midi: 'audio/midi',
  // 비디오
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  ogv: 'video/ogg',
  ts_video: 'video/mp2t',
  // 압축·바이너리
  zip: 'application/zip',
  gz: 'application/gzip',
  tar: 'application/x-tar',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  bz2: 'application/x-bzip2',
  bin: 'application/octet-stream',
  exe: 'application/octet-stream',
  apk: 'application/vnd.android.package-archive',
  jar: 'application/java-archive',
};

interface ExtRow {
  ext: string;
  mime: string;
}

/** MIME → 확장자 목록 역인덱스(모듈 로드 시 1회 계산). */
const MIME_TO_EXTS: Record<string, string[]> = (() => {
  const index: Record<string, string[]> = {};
  for (const [ext, mime] of Object.entries(EXT_TO_MIME)) {
    (index[mime] ??= []).push(ext);
  }
  return index;
})();

/** 입력 문자열이 MIME 타입 형태(type/subtype)인지 판별. */
function looksLikeMime(query: string): boolean {
  return query.includes('/');
}

/** 입력에 맞는 결과 행을 계산한다. 빈 입력이면 전체 목록을 확장자 기준 정렬로 반환. */
function lookup(rawQuery: string): ExtRow[] {
  const query = rawQuery.trim().toLowerCase().replace(/^\./, '');
  const all: ExtRow[] = Object.entries(EXT_TO_MIME).map(([ext, mime]) => ({ ext, mime }));
  if (query === '') return all.sort((a, b) => a.ext.localeCompare(b.ext));

  if (looksLikeMime(query)) {
    return all
      .filter((row) => row.mime.toLowerCase().includes(query))
      .sort((a, b) => a.mime.localeCompare(b.mime) || a.ext.localeCompare(b.ext));
  }
  return all
    .filter((row) => row.ext.includes(query))
    .sort((a, b) => a.ext.localeCompare(b.ext));
}

export default function MimeTypeLookupPage() {
  const [query, setQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const rows = useMemo(() => lookup(query), [query]);
  const mode: 'mime' | 'ext' = looksLikeMime(query.trim()) ? 'ext' : 'mime';

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setQuery('');
    setCopiedKey(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="MIME 타입 조회" onReset={query ? reset : undefined} />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileType className="h-4 w-4 text-primary" aria-hidden />
          확장자를 입력하면 MIME 타입을, MIME 타입을 입력하면 확장자를 찾습니다.
        </p>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">확장자 또는 MIME 타입</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: png  ·  .json  ·  image/  ·  application/pdf"
              aria-label="확장자 또는 MIME 타입 입력"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {rows.length}개 결과 · {query.trim() === '' ? '전체 목록' : mode === 'ext' ? 'MIME → 확장자' : '확장자 → MIME'}
          </p>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            {rows.map((row) => {
              const key = `${row.ext}|${row.mime}`;
              const copyTarget = mode === 'ext' ? row.ext : row.mime;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">.{row.ext}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{row.mime}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyValue(key, copyTarget)}
                    aria-label={`${copyTarget} 복사`}
                  >
                    {copiedKey === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === key ? '복사됨' : '복사'}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            일치하는 항목이 없습니다.
          </p>
        )}
      </main>
    </div>
  );
}
