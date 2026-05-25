'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

interface ParsedHwpx {
  /** 본문 텍스트 (문단별 줄바꿈) */
  text: string;
  /** 본문을 단순 HTML(<p>) 로 묶은 출력 */
  html: string;
  /** 추출된 이미지 (originalName, url, type) */
  images: Array<{ name: string; url: string; type: string; size: number }>;
  /** META.xml 또는 manifest 에서 추출한 정보 */
  meta: {
    title?: string;
    author?: string;
    sectionCount?: number;
  };
  /** 헤더 통계 */
  stats: {
    paragraphs: number;
    chars: number;
    sections: number;
    imageCount: number;
  };
}

const MIME_FROM_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

/**
 * HWPX 파일 (한컴 오피스 XML 기반 표준) 을 파싱.
 *
 * HWPX 구조 (ZIP):
 *   - mimetype                                "application/hwp+zip"
 *   - META-INF/manifest.xml                    내부 파일 목록
 *   - Contents/header.xml                      메타정보
 *   - Contents/section0.xml, section1.xml…     본문
 *   - BinData/*                                 이미지 등 바이너리
 *
 * 텍스트 추출: section*.xml 안 <hp:t>...</hp:t> (또는 ns 무관 <t>) 을 순차로 모은다.
 * 문단 단위: <hp:p> 또는 <p> 로 끊는다.
 * 이미지: BinData/* 안의 모든 미디어 파일을 Blob URL 로 노출.
 */
async function parseHwpx(file: File): Promise<ParsedHwpx> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file);

  // mimetype 검증
  const mimetypeFile = zip.file('mimetype');
  if (mimetypeFile) {
    const mt = (await mimetypeFile.async('string')).trim();
    if (mt && !mt.includes('hwp') && !mt.includes('hancom')) {
      throw new Error(`HWPX 파일이 아닙니다 (mimetype: ${mt}).`);
    }
  }

  // 섹션 파일 (Contents/section*.xml) 모두 수집
  const sectionEntries = Object.keys(zip.files)
    .filter((n) => /Contents\/section\d+\.xml$/i.test(n))
    .sort((a, b) => {
      const an = Number(a.match(/section(\d+)/i)?.[1] ?? 0);
      const bn = Number(b.match(/section(\d+)/i)?.[1] ?? 0);
      return an - bn;
    });

  if (sectionEntries.length === 0) {
    throw new Error('HWPX 본문(section0.xml) 을 찾을 수 없습니다.');
  }

  const paragraphs: string[] = [];

  for (const sectionName of sectionEntries) {
    const xml = await zip.file(sectionName)!.async('string');
    // 문단 블록 추출: <hp:p ...>...</hp:p> 또는 <p ...>...</p>
    const paraRe = /<(?:hp:)?p\b[^>]*>([\s\S]*?)<\/(?:hp:)?p>/g;
    let m: RegExpExecArray | null;
    while ((m = paraRe.exec(xml)) !== null) {
      const block = m[1];
      // 문단 안 <hp:t> 또는 <t> 의 텍스트 노드들을 순차로 이어붙임
      const textRe = /<(?:hp:)?t\b[^>]*>([\s\S]*?)<\/(?:hp:)?t>/g;
      const parts: string[] = [];
      let tm: RegExpExecArray | null;
      while ((tm = textRe.exec(block)) !== null) {
        parts.push(decodeXmlEntities(tm[1]));
      }
      const line = parts.join('').replace(/\s+/g, ' ').trim();
      paragraphs.push(line);
    }
  }

  // 빈 문단도 의도된 빈 줄로 보존하되, 너무 많은 연속 공백은 정리
  const text = paragraphs.join('\n').replace(/\n{3,}/g, '\n\n');
  const html = paragraphs
    .map((p) => (p ? `<p>${escapeHtml(p)}</p>` : '<p>&nbsp;</p>'))
    .join('\n');

  // header.xml 메타
  const meta: ParsedHwpx['meta'] = {};
  const headerFile = zip.file('Contents/header.xml');
  if (headerFile) {
    const headerXml = await headerFile.async('string');
    const titleM = headerXml.match(/<(?:hp:)?docInfo[^>]*\btitle="([^"]*)"/i);
    const authorM = headerXml.match(/<(?:hp:)?creator[^>]*>([\s\S]*?)<\/(?:hp:)?creator>/i);
    if (titleM) meta.title = decodeXmlEntities(titleM[1]);
    if (authorM) meta.author = decodeXmlEntities(authorM[1]).trim();
  }
  meta.sectionCount = sectionEntries.length;

  // 이미지 추출 (BinData/*)
  const images: ParsedHwpx['images'] = [];
  for (const name of Object.keys(zip.files)) {
    if (!/^BinData\//i.test(name)) continue;
    const f = zip.files[name];
    if (f.dir) continue;
    const ext = (name.split('.').pop() ?? '').toLowerCase();
    if (!MIME_FROM_EXT[ext]) continue;
    const bytes = await f.async('uint8array');
    const blob = new Blob([bytes as unknown as BlobPart], { type: MIME_FROM_EXT[ext] });
    const url = URL.createObjectURL(blob);
    images.push({
      name: name.replace(/^BinData\//, ''),
      url,
      type: MIME_FROM_EXT[ext],
      size: bytes.length,
    });
  }

  return {
    text,
    html,
    images,
    meta,
    stats: {
      paragraphs: paragraphs.length,
      chars: text.length,
      sections: sectionEntries.length,
      imageCount: images.length,
    },
  };
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type View = 'text' | 'html' | 'images';

export default function HwpxViewerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedHwpx | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('text');
  const [copied, setCopied] = useState(false);

  const accept = useCallback(async (f: File) => {
    setError(null);
    setParsed(null);
    setFile(f);
    setBusy(true);
    try {
      const result = await parseHwpx(f);
      setParsed(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'HWPX 파일을 읽지 못했습니다. HWPX 표준(.hwpx)만 지원합니다.',
      );
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (parsed) {
        for (const img of parsed.images) URL.revokeObjectURL(img.url);
      }
    };
  }, [parsed]);

  const reset = () => {
    if (parsed) for (const img of parsed.images) URL.revokeObjectURL(img.url);
    setFile(null);
    setParsed(null);
    setError(null);
  };

  const copyText = async () => {
    if (!parsed) return;
    try {
      await navigator.clipboard.writeText(parsed.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const downloadText = () => {
    if (!parsed || !file) return;
    const base = file.name.replace(/\.[^.]+$/, '');
    const blob = new Blob([parsed.text], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, `${base}.txt`);
  };

  const downloadHtml = () => {
    if (!parsed || !file) return;
    const base = file.name.replace(/\.[^.]+$/, '');
    const titleEsc = escapeHtml(parsed.meta.title ?? base);
    const html =
      `<!DOCTYPE html>\n<html lang="ko">\n<head><meta charset="utf-8"><title>${titleEsc}</title>` +
      `<style>body{font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif;max-width:760px;margin:2em auto;padding:0 1em;line-height:1.7}p{margin:0.6em 0}</style>` +
      `</head>\n<body>\n<h1>${titleEsc}</h1>\n${parsed.html}\n</body>\n</html>\n`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    triggerDownload(blob, `${base}.html`);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'h-8 w-8',
              })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <BookOpen className="h-5 w-5" />
            <h1 className="font-semibold text-base">HWPX 뷰어</h1>
          </div>
          {file && !busy && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!file && (
          <FileDropZone
            accept=".hwpx,application/hwp+zip,application/vnd.hancom.hwpx,application/zip"
            description="HWPX 파일 선택 (한컴 오피스 표준)"
            hint="HWPX 만 지원합니다. 옛 .hwp 바이너리 포맷은 지원하지 않습니다."
            onFiles={(picked) => accept(picked[0])}
          />
        )}

        {busy && (
          <div className="rounded-xl border bg-card p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            HWPX 파싱 중...
          </div>
        )}

        {file && parsed && !busy && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {parsed.meta.title || file.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {parsed.meta.author && `작성자: ${parsed.meta.author} · `}
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <Stat label="섹션" value={parsed.stats.sections} />
                <Stat label="문단" value={parsed.stats.paragraphs} />
                <Stat label="문자" value={parsed.stats.chars} />
                <Stat label="이미지" value={parsed.stats.imageCount} />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                <TabBtn
                  active={view === 'text'}
                  onClick={() => setView('text')}
                  label="텍스트"
                />
                <TabBtn
                  active={view === 'html'}
                  onClick={() => setView('html')}
                  label="HTML 미리보기"
                />
                <TabBtn
                  active={view === 'images'}
                  onClick={() => setView('images')}
                  label={`이미지 (${parsed.stats.imageCount})`}
                />
              </div>

              {view === 'text' && (
                <>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={copyText}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          복사
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={downloadText}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      .txt
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    value={parsed.text}
                    rows={18}
                    className="w-full rounded-lg border bg-muted px-3 py-2 text-xs font-mono resize-y"
                    aria-label="HWPX 텍스트 결과"
                  />
                </>
              )}

              {view === 'html' && (
                <>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={downloadHtml}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      .html
                    </Button>
                  </div>
                  <div
                    className="prose prose-sm max-w-none rounded-lg border bg-background p-4 max-h-[60vh] overflow-auto"
                    dangerouslySetInnerHTML={{ __html: parsed.html }}
                  />
                </>
              )}

              {view === 'images' && (
                <>
                  {parsed.images.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      이미지가 없습니다.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {parsed.images.map((img) => (
                        <div
                          key={img.name}
                          className="rounded-lg border bg-background p-2 space-y-1.5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-32 object-contain bg-muted rounded"
                            loading="lazy"
                          />
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[10px] text-muted-foreground truncate flex-1">
                              {img.name}
                            </p>
                            <a
                              href={img.url}
                              download={img.name}
                              className="text-[10px] text-primary hover:underline shrink-0"
                            >
                              저장
                            </a>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {formatBytes(img.size)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1.5">
          <p>
            HWPX 는 한컴 오피스의 ZIP+XML 기반 표준 문서 포맷입니다. JSZip 으로 압축을
            풀어 본문 XML 을 직접 파싱합니다.
          </p>
          <p>
            <strong className="text-foreground">.hwp (옛 바이너리)</strong> 는 지원하지
            않습니다. 한컴 오피스에서 다른 이름으로 저장 → HWPX 로 변환한 뒤 사용하세요.
          </p>
          <p>
            파일은 서버로 전송되지 않으며 브라우저 메모리에서만 처리됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 text-xs rounded-md border ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-muted border-border'
      }`}
    >
      {label}
    </button>
  );
}
