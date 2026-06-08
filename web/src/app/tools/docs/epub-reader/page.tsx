'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, BookOpen, ChevronLeft, ChevronRight, Menu, X, Type as TypeIcon, Sun, Moon, Maximize2, Minimize2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import {
  chapterTitle,
  extOf,
  extractBody,
  isImageExt,
  mimeForExt,
  parseEpub,
  readChapter,
  resolveHref,
  type ParsedEpub,
} from '@/lib/tools/epub-common';

interface ChapterInfo {
  idref: string;
  title: string;
}

type Theme = 'light' | 'sepia' | 'dark';

const THEME_STYLES: Record<Theme, { bg: string; fg: string }> = {
  light: { bg: '#ffffff', fg: '#1a1a1a' },
  sepia: { bg: '#fbf3e3', fg: '#3a2a14' },
  dark: { bg: '#1a1a1a', fg: '#e6e6e6' },
};

export default function EpubReaderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [epub, setEpub] = useState<ParsedEpub | null>(null);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chapterHtml, setChapterHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [theme, setTheme] = useState<Theme>('light');
  const [fullscreen, setFullscreen] = useState(false);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current) URL.revokeObjectURL(url);
      blobUrlsRef.current.clear();
    };
  }, []);

  // 브라우저 전체화면(Fullscreen API) 종료(Esc 등)와 상태 동기화
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // 전체화면(CSS 오버레이)에서 Esc 로 빠져나오기 (Fullscreen API 미지원 환경 대비)
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  function toggleFullscreen() {
    const next = !fullscreen;
    setFullscreen(next);
    if (next) {
      readerRef.current?.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  async function handleLoad(f: File) {
    setFile(f);
    setError(null);
    setBusy(true);
    setEpub(null);
    setChapters([]);
    setChapterHtml('');
    setCurrentIdx(0);
    // 이전 blob 정리
    for (const url of blobUrlsRef.current) URL.revokeObjectURL(url);
    blobUrlsRef.current.clear();
    try {
      const parsed = await parseEpub(f);
      const list: ChapterInfo[] = [];
      for (let i = 0; i < parsed.spine.length; i++) {
        const ch = await readChapter(parsed, parsed.spine[i]);
        if (!ch) continue;
        list.push({
          idref: parsed.spine[i],
          title: chapterTitle(ch.xhtml, `Chapter ${i + 1}`),
        });
      }
      setEpub(parsed);
      setChapters(list);
      if (list.length > 0) await loadChapter(parsed, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '읽을 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function loadChapter(parsed: ParsedEpub, idx: number) {
    setBusy(true);
    try {
      const ch = await readChapter(parsed, parsed.spine[idx]);
      if (!ch) return;
      const body = extractBody(ch.xhtml);
      const rewritten = await rewriteImages(parsed, ch.path, body, blobUrlsRef.current);
      setChapterHtml(rewritten);
      setCurrentIdx(idx);
      // 챕터 변경 시 스크롤 맨 위
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } finally {
      setBusy(false);
    }
  }

  const themeStyle = THEME_STYLES[theme];

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EPUB 리더</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          EPUB 파일을 브라우저에서 바로 읽습니다. 파일은 서버로 전송되지 않습니다.
        </p>
      </header>

      {!epub && (
        <>
          <FileDropZone
            accept="application/epub+zip,.epub"
            onFiles={(files) => files[0] && handleLoad(files[0])}
            title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
          />
          {busy && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> EPUB 분석 중…
            </p>
          )}
        </>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {epub && (
        <div
          ref={readerRef}
          className={
            fullscreen
              ? 'fixed inset-0 z-50 flex flex-col gap-2 overflow-hidden bg-background p-3'
              : 'space-y-3'
          }
        >
          {/* 메타 + 컨트롤 */}
          <div className="rounded-xl border bg-card p-3 flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{epub.metadata.title || file?.name}</p>
              {epub.metadata.creator && (
                <p className="text-xs text-muted-foreground truncate">{epub.metadata.creator}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setTocOpen((v) => !v)}>
              {tocOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
              목차
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="글자 작게"
              onClick={() => setFontSize((v) => Math.max(12, v - 1))}
            >
              <TypeIcon className="h-3.5 w-3.5" /> -
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="글자 크게"
              onClick={() => setFontSize((v) => Math.min(28, v + 1))}
            >
              <TypeIcon className="h-3.5 w-3.5" /> +
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setTheme((t) => (t === 'light' ? 'sepia' : t === 'sepia' ? 'dark' : 'light'))
              }
              aria-label="테마 전환"
            >
              {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? '전체화면 종료' : '전체화면으로 보기'}
              title={fullscreen ? '전체화면 종료 (Esc)' : '전체화면으로 보기'}
            >
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>

          <div
            className={`grid gap-3 ${tocOpen ? 'md:grid-cols-[240px_1fr]' : 'grid-cols-1'} ${
              fullscreen ? 'min-h-0 flex-1' : ''
            }`}
          >
            {/* TOC */}
            {tocOpen && (
              <aside
                className={`rounded-xl border bg-card p-2 overflow-y-auto ${
                  fullscreen ? 'max-h-full' : 'max-h-[70vh]'
                }`}
              >
                <ul className="space-y-0.5 text-xs">
                  {chapters.map((c, i) => (
                    <li key={i}>
                      <button
                        onClick={() => epub && loadChapter(epub, i)}
                        className={`block w-full text-left px-2 py-1.5 rounded ${
                          i === currentIdx ? 'bg-primary/10 font-medium' : 'hover:bg-muted'
                        }`}
                      >
                        <span className="text-muted-foreground mr-1">{i + 1}.</span>
                        {c.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            {/* 본문 */}
            <div
              ref={containerRef}
              className={`rounded-xl border overflow-y-auto p-6 leading-relaxed ${
                fullscreen ? 'h-full min-h-0' : 'h-[70vh]'
              }`}
              style={{
                background: themeStyle.bg,
                color: themeStyle.fg,
                fontSize: `${fontSize}px`,
                lineHeight: 1.7,
                fontFamily: '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",serif',
              }}
            >
              {busy ? (
                <p className="text-sm text-center opacity-60 mt-12">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> 챕터 불러오는 중…
                </p>
              ) : (
                <div
                  className="epub-content mx-auto w-full max-w-[42rem]"
                  dangerouslySetInnerHTML={{ __html: chapterHtml }}
                />
              )}
            </div>
          </div>

          {/* 네비 */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIdx <= 0 || busy}
              onClick={() => epub && loadChapter(epub, currentIdx - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              이전 챕터
            </Button>
            <p className="text-xs text-muted-foreground">
              {currentIdx + 1} / {chapters.length}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={currentIdx >= chapters.length - 1 || busy}
              onClick={() => epub && loadChapter(epub, currentIdx + 1)}
            >
              다음 챕터
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            <button className="underline hover:text-foreground" onClick={() => { setEpub(null); setFile(null); }}>
              다른 EPUB 열기
            </button>
          </p>
        </div>
      )}

      <style>{`
        .epub-content img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
        .epub-content h1, .epub-content h2, .epub-content h3 { line-height: 1.3; margin-top: 1.5em; }
        .epub-content p { margin: 0.8em 0; }
      `}</style>
    </main>
  );
}

async function rewriteImages(
  epub: ParsedEpub,
  chapterPath: string,
  html: string,
  cache: Set<string>,
): Promise<string> {
  const chapterDir = chapterPath.includes('/')
    ? chapterPath.substring(0, chapterPath.lastIndexOf('/') + 1)
    : '';
  const re = /\b(src|href|xlink:href)\s*=\s*["']([^"']+)["']/gi;
  const replacements: Array<[string, string]> = [];
  const urlMap = new Map<string, string>();

  for (const m of html.matchAll(re)) {
    const [raw, attrName, value] = m;
    if (/^(https?:|data:|blob:|#|mailto:)/i.test(value)) continue;
    const ext = extOf(value).toLowerCase();
    if (!isImageExt(ext)) continue;
    const resolved = resolveHref(chapterDir, value);
    let url = urlMap.get(resolved);
    if (!url) {
      const f = epub.zip.file(resolved);
      if (!f) continue;
      const blob = await f.async('blob');
      url = URL.createObjectURL(new Blob([blob], { type: mimeForExt(ext) }));
      urlMap.set(resolved, url);
      cache.add(url);
    }
    replacements.push([raw, `${attrName}="${url}"`]);
  }
  let out = html;
  for (const [from, to] of replacements) out = out.replace(from, to);
  return out;
}
