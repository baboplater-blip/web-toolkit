'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import {
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Type as TypeIcon,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Search as SearchIcon,
  Settings2,
} from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import {
  chapterTitle,
  extOf,
  extractBody,
  htmlToPlainText,
  isImageExt,
  mimeForExt,
  parseEpub,
  parseToc,
  readChapter,
  resolveHref,
  type ParsedEpub,
  type TocEntry,
} from '@/lib/tools/epub-common';

interface ChapterInfo {
  idref: string;
  title: string;
}

type Theme = 'light' | 'sepia' | 'dark';
type FontFamily = 'sans' | 'serif';
type ReadWidth = 'narrow' | 'normal' | 'wide';

const THEME_STYLES: Record<Theme, { bg: string; fg: string }> = {
  light: { bg: '#ffffff', fg: '#1a1a1a' },
  sepia: { bg: '#fbf3e3', fg: '#3a2a14' },
  dark: { bg: '#1a1a1a', fg: '#e6e6e6' },
};

const WIDTH_MAP: Record<ReadWidth, string> = {
  narrow: '34rem',
  normal: '42rem',
  wide: '56rem',
};

const FONT_MAP: Record<FontFamily, string> = {
  sans: '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif',
  serif: '"Noto Serif KR","Nanum Myeongjo",Georgia,"Times New Roman",serif',
};

interface ReaderSettings {
  fontSize: number;
  fontFamily: FontFamily;
  theme: Theme;
  lineHeight: number;
  readWidth: ReadWidth;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 17,
  fontFamily: 'sans',
  theme: 'light',
  lineHeight: 1.7,
  readWidth: 'normal',
};

const SETTINGS_KEY = 'webtoolkit/epub-reader/settings/v1';
const POS_KEY = 'webtoolkit/epub-reader/pos/v1';

interface BookPos {
  idx: number;
  ratio: number;
}

function loadSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ReaderSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: ReaderSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* 저장 실패 무시 (프라이빗 모드 등) */
  }
}

function readAllPos(): Record<string, BookPos> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as Record<string, BookPos>) : {};
  } catch {
    return {};
  }
}

function readPos(bookKey: string): BookPos | null {
  return readAllPos()[bookKey] ?? null;
}

function writePos(bookKey: string, pos: BookPos) {
  if (typeof window === 'undefined' || !bookKey) return;
  try {
    const all = readAllPos();
    all[bookKey] = pos;
    // 최근 50권만 유지 (무한 증가 방지)
    const keys = Object.keys(all);
    if (keys.length > 50) delete all[keys[0]];
    localStorage.setItem(POS_KEY, JSON.stringify(all));
  } catch {
    /* 무시 */
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** HTML 텍스트 노드에서만 검색어를 <mark> 로 감싼다(태그/속성은 건드리지 않음). */
function highlightHtml(html: string, term: string): string {
  if (!term) return html;
  const re = new RegExp(`(${escapeRegExp(term)})`, 'gi');
  return html.replace(/(<[^>]+>)|([^<]+)/g, (_m, tag, text) =>
    tag ? tag : (text as string).replace(re, '<mark class="epub-hl">$1</mark>'),
  );
}

function makeSnippet(text: string, at: number, len: number): string {
  const start = Math.max(0, at - 40);
  const end = Math.min(text.length, at + len + 40);
  const pre = start > 0 ? '…' : '';
  const post = end < text.length ? '…' : '';
  return (pre + text.slice(start, end).replace(/\s+/g, ' ').trim() + post);
}

interface SearchHit {
  idx: number;
  title: string;
  snippet: string;
  count: number;
}

export default function EpubReaderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [epub, setEpub] = useState<ParsedEpub | null>(null);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chapterHtml, setChapterHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState('');
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resumed, setResumed] = useState(false);

  const blobUrlsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const bookKeyRef = useRef('');
  const resumeRatioRef = useRef(0);
  const highlightRef = useRef('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fillTokenRef = useRef(0);
  const idxRef = useRef(0);
  const totalRef = useRef(0);

  /* 설정 로드 (mount) */
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  /* 설정 변경 시 저장 */
  const updateSettings = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* 전체화면 종료(Esc 등) 동기화 */
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const chapterTitleAt = useCallback(
    (i: number) => chapters[i]?.title || `${i + 1}장`,
    [chapters],
  );

  const persistPos = useCallback(() => {
    const c = containerRef.current;
    const key = bookKeyRef.current;
    if (!c || !key) return;
    const denom = c.scrollHeight - c.clientHeight;
    const ratio = denom > 0 ? c.scrollTop / denom : 0;
    writePos(key, { idx: idxRef.current, ratio });
  }, []);

  const updateProgress = useCallback(() => {
    const c = containerRef.current;
    if (!c || totalRef.current === 0) return;
    const denom = c.scrollHeight - c.clientHeight;
    const ratio = denom > 0 ? c.scrollTop / denom : 0;
    setProgress((idxRef.current + Math.min(1, ratio)) / totalRef.current);
  }, []);

  const onScroll = useCallback(() => {
    updateProgress();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(persistPos, 400);
  }, [updateProgress, persistPos]);

  async function handleLoad(f: File) {
    setFile(f);
    setError(null);
    setBusy(true);
    setEpub(null);
    setChapters([]);
    setToc([]);
    setChapterHtml('');
    setCurrentIdx(0);
    setResumed(false);
    setSearched(false);
    setSearchResults([]);
    setHighlightTerm('');
    highlightRef.current = '';
    fillTokenRef.current++;
    for (const url of blobUrlsRef.current) URL.revokeObjectURL(url);
    blobUrlsRef.current.clear();
    try {
      const parsed = await parseEpub(f);
      const tocEntries = await parseToc(parsed);
      const titleByIdref = new Map<string, string>();
      for (const e of tocEntries) {
        if (e.idref && !titleByIdref.has(e.idref)) titleByIdref.set(e.idref, e.title);
      }
      const list: ChapterInfo[] = parsed.spine.map((idref) => ({
        idref,
        title: titleByIdref.get(idref) ?? '',
      }));

      const bookKey =
        parsed.metadata.identifier ||
        `${parsed.metadata.title}::${parsed.metadata.creator}`;
      bookKeyRef.current = bookKey;
      const pos = readPos(bookKey);
      const startIdx = pos && pos.idx >= 0 && pos.idx < list.length ? pos.idx : 0;
      resumeRatioRef.current = pos ? pos.ratio : 0;
      if (pos && (pos.idx > 0 || pos.ratio > 0.02)) setResumed(true);

      totalRef.current = list.length;
      setEpub(parsed);
      setToc(tocEntries);
      setChapters(list);
      if (list.length > 0) await loadChapter(parsed, startIdx, list);

      // 제목이 비어 있는 챕터(목차에 없는 spine 항목)는 백그라운드로 채움
      void fillMissingTitles(parsed, list, fillTokenRef.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : '읽을 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  /** 목차에서 제목을 못 얻은 챕터의 제목을 백그라운드로 추출(첫 화면 차단 안 함). */
  async function fillMissingTitles(parsed: ParsedEpub, list: ChapterInfo[], token: number) {
    const missing = list
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !c.title);
    if (missing.length === 0) return;
    const titles = new Map<number, string>();
    for (const { i } of missing) {
      if (fillTokenRef.current !== token) return; // 다른 책 로드됨
      const ch = await readChapter(parsed, parsed.spine[i]);
      if (ch) titles.set(i, chapterTitle(ch.xhtml, `${i + 1}장`));
      if (titles.size % 12 === 0) {
        setChapters((prev) => prev.map((c, j) => (titles.has(j) ? { ...c, title: titles.get(j)! } : c)));
      }
    }
    if (fillTokenRef.current !== token) return;
    setChapters((prev) => prev.map((c, j) => (titles.has(j) ? { ...c, title: titles.get(j)! } : c)));
  }

  const loadChapter = useCallback(
    async (parsed: ParsedEpub, idx: number, list?: ChapterInfo[]) => {
      const total = list ? list.length : totalRef.current;
      if (idx < 0 || (total > 0 && idx >= total)) return;
      setBusy(true);
      try {
        const ch = await readChapter(parsed, parsed.spine[idx]);
        if (!ch) return;
        const body = extractBody(ch.xhtml);
        let rewritten = await rewriteImages(parsed, ch.path, body, blobUrlsRef.current);
        if (highlightRef.current) rewritten = highlightHtml(rewritten, highlightRef.current);
        idxRef.current = idx;
        setChapterHtml(rewritten);
        setCurrentIdx(idx);
        requestAnimationFrame(() => {
          const c = containerRef.current;
          if (!c) return;
          const ratio = resumeRatioRef.current;
          resumeRatioRef.current = 0;
          c.scrollTop = ratio > 0 ? ratio * (c.scrollHeight - c.clientHeight) : 0;
          updateProgress();
          persistPos();
        });
      } finally {
        setBusy(false);
      }
    },
    [updateProgress, persistPos],
  );

  const goTo = useCallback(
    (idx: number) => {
      if (epub) {
        resumeRatioRef.current = 0;
        void loadChapter(epub, idx);
      }
    },
    [epub, loadChapter],
  );

  /* 키보드 ←/→ 챕터 이동 */
  useEffect(() => {
    if (!epub) return;
    const onKey = (e: KeyboardEvent) => {
      if (searchOpen || settingsOpen) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft' && currentIdx > 0) {
        e.preventDefault();
        goTo(currentIdx - 1);
      } else if (e.key === 'ArrowRight' && currentIdx < chapters.length - 1) {
        e.preventDefault();
        goTo(currentIdx + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [epub, currentIdx, chapters.length, searchOpen, settingsOpen, goTo]);

  /* 스와이프 (모바일) */
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: ReactTouchEvent) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: ReactTouchEvent) {
    const s = touchRef.current;
    touchRef.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && currentIdx < chapters.length - 1) goTo(currentIdx + 1);
      else if (dx > 0 && currentIdx > 0) goTo(currentIdx - 1);
    }
  }

  async function runSearch() {
    const q = searchQuery.trim();
    if (!q || !epub) return;
    setSearching(true);
    setSearched(true);
    setSearchResults([]);
    try {
      const ql = q.toLowerCase();
      const hits: SearchHit[] = [];
      for (let i = 0; i < epub.spine.length; i++) {
        const ch = await readChapter(epub, epub.spine[i]);
        if (!ch) continue;
        const text = htmlToPlainText(extractBody(ch.xhtml));
        const tl = text.toLowerCase();
        const at = tl.indexOf(ql);
        if (at < 0) continue;
        let count = 0;
        let p = at;
        while (p >= 0) {
          count++;
          p = tl.indexOf(ql, p + ql.length);
        }
        hits.push({ idx: i, title: chapterTitleAt(i), snippet: makeSnippet(text, at, q.length), count });
      }
      setSearchResults(hits);
    } finally {
      setSearching(false);
    }
  }

  function openHit(idx: number) {
    const term = searchQuery.trim();
    highlightRef.current = term;
    setHighlightTerm(term);
    resumeRatioRef.current = 0;
    if (epub) void loadChapter(epub, idx);
    setSearchOpen(false);
  }

  function clearHighlight() {
    highlightRef.current = '';
    setHighlightTerm('');
    if (epub) void loadChapter(epub, currentIdx);
  }

  function toggleFullscreen() {
    const next = !fullscreen;
    setFullscreen(next);
    if (next) {
      readerRef.current?.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  const themeStyle = THEME_STYLES[settings.theme];
  const pct = Math.round(progress * 100);

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
            <Button variant="outline" size="icon" aria-label="글자 작게" onClick={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 1) })}>
              <TypeIcon className="h-3.5 w-3.5" /> -
            </Button>
            <Button variant="outline" size="icon" aria-label="글자 크게" onClick={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}>
              <TypeIcon className="h-3.5 w-3.5" /> +
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateSettings({ theme: settings.theme === 'light' ? 'sepia' : settings.theme === 'sepia' ? 'dark' : 'light' })}
              aria-label="테마 전환"
              title="테마 전환 (밝게/세피아/어둡게)"
            >
              {settings.theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSettingsOpen((v) => !v); setSearchOpen(false); }}
              aria-label="읽기 설정"
              title="글꼴·줄간격·읽기 폭"
              aria-pressed={settingsOpen}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSearchOpen((v) => !v); setSettingsOpen(false); }}
              aria-label="책 내 검색"
              title="책 내 검색"
              aria-pressed={searchOpen}
            >
              <SearchIcon className="h-3.5 w-3.5" />
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

          {/* 설정 패널 */}
          {settingsOpen && (
            <div className="rounded-xl border bg-card p-3 space-y-3 text-sm">
              <Row label="글꼴">
                <Seg active={settings.fontFamily === 'sans'} onClick={() => updateSettings({ fontFamily: 'sans' })}>고딕</Seg>
                <Seg active={settings.fontFamily === 'serif'} onClick={() => updateSettings({ fontFamily: 'serif' })}>명조</Seg>
              </Row>
              <Row label="줄간격">
                {[1.5, 1.7, 2.0].map((lh) => (
                  <Seg key={lh} active={settings.lineHeight === lh} onClick={() => updateSettings({ lineHeight: lh })}>
                    {lh.toFixed(1)}
                  </Seg>
                ))}
              </Row>
              <Row label="읽기 폭">
                {(['narrow', 'normal', 'wide'] as ReadWidth[]).map((w) => (
                  <Seg key={w} active={settings.readWidth === w} onClick={() => updateSettings({ readWidth: w })}>
                    {w === 'narrow' ? '좁게' : w === 'normal' ? '보통' : '넓게'}
                  </Seg>
                ))}
              </Row>
            </div>
          )}

          {/* 검색 패널 */}
          {searchOpen && (
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <form
                onSubmit={(e) => { e.preventDefault(); void runSearch(); }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="책 전체에서 검색…"
                    aria-label="책 내 검색어"
                    className="h-9 w-full rounded-md border bg-background pl-8 pr-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Button type="submit" size="sm" disabled={searching || !searchQuery.trim()}>
                  {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '검색'}
                </Button>
              </form>
              {searched && !searching && (
                <p className="text-[11px] text-muted-foreground">
                  {searchResults.length > 0
                    ? `${searchResults.reduce((s, h) => s + h.count, 0)}건 · ${searchResults.length}개 챕터`
                    : '검색 결과가 없습니다.'}
                </p>
              )}
              {searchResults.length > 0 && (
                <ul className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((h) => (
                    <li key={h.idx}>
                      <button
                        onClick={() => openHit(h.idx)}
                        className="block w-full text-left rounded-md px-2 py-1.5 hover:bg-muted"
                      >
                        <span className="text-xs font-medium">
                          {h.title} <span className="text-muted-foreground">({h.count})</span>
                        </span>
                        <span className="block text-[11px] text-muted-foreground line-clamp-2">{h.snippet}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {resumed && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
              <span>이전에 읽던 위치에서 이어봅니다.</span>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => { setResumed(false); resumeRatioRef.current = 0; goTo(0); }}>
                처음부터
              </button>
            </div>
          )}

          {highlightTerm && (
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-amber-500/10 px-3 py-1.5 text-xs">
              <span>“{highlightTerm}” 강조 표시 중</span>
              <button className="text-muted-foreground hover:text-foreground" onClick={clearHighlight}>강조 해제</button>
            </div>
          )}

          {/* 진행률 바 */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>

          <div
            className={`grid gap-3 ${tocOpen ? 'md:grid-cols-[260px_1fr]' : 'grid-cols-1'} ${fullscreen ? 'min-h-0 flex-1' : ''}`}
          >
            {/* TOC — 실제 목차(중첩) */}
            {tocOpen && (
              <aside className={`rounded-xl border bg-card p-2 overflow-y-auto ${fullscreen ? 'max-h-full' : 'max-h-[70vh]'}`}>
                <ul className="space-y-0.5 text-xs">
                  {(toc.length > 0
                    ? toc
                    : chapters.map((_, i) => ({ title: chapterTitleAt(i), idref: chapters[i].idref, depth: 0 }))
                  ).map((entry, i) => {
                    const targetIdx = entry.idref ? chapters.findIndex((c) => c.idref === entry.idref) : -1;
                    const active = targetIdx === currentIdx;
                    return (
                      <li key={i}>
                        <button
                          disabled={targetIdx < 0}
                          onClick={() => targetIdx >= 0 && goTo(targetIdx)}
                          style={{ paddingLeft: `${0.5 + entry.depth * 0.75}rem` }}
                          className={`block w-full text-left px-2 py-1.5 rounded ${
                            active ? 'bg-primary/10 font-medium' : targetIdx < 0 ? 'opacity-50 cursor-default' : 'hover:bg-muted'
                          }`}
                        >
                          {entry.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            )}

            {/* 본문 */}
            <div
              ref={containerRef}
              onScroll={onScroll}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className={`rounded-xl border overflow-y-auto p-6 leading-relaxed ${fullscreen ? 'h-full min-h-0' : 'h-[70vh]'}`}
              style={{
                background: themeStyle.bg,
                color: themeStyle.fg,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                fontFamily: FONT_MAP[settings.fontFamily],
              }}
            >
              {busy ? (
                <p className="text-sm text-center opacity-60 mt-12">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> 챕터 불러오는 중…
                </p>
              ) : (
                <div
                  className="epub-content mx-auto w-full"
                  style={{ maxWidth: WIDTH_MAP[settings.readWidth] }}
                  dangerouslySetInnerHTML={{ __html: chapterHtml }}
                />
              )}
            </div>
          </div>

          {/* 네비 */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" disabled={currentIdx <= 0 || busy} onClick={() => goTo(currentIdx - 1)}>
              <ChevronLeft className="h-4 w-4" />
              이전 챕터
            </Button>
            <p className="text-xs text-muted-foreground tabular-nums">
              {currentIdx + 1} / {chapters.length} · {pct}%
            </p>
            <Button variant="outline" size="sm" disabled={currentIdx >= chapters.length - 1 || busy} onClick={() => goTo(currentIdx + 1)}>
              다음 챕터
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!fullscreen && (
            <p className="text-[10px] text-muted-foreground text-center">
              ← → 키 또는 좌우 스와이프로 챕터 이동 ·{' '}
              <button className="underline hover:text-foreground" onClick={() => { setEpub(null); setFile(null); }}>
                다른 EPUB 열기
              </button>
            </p>
          )}
        </div>
      )}

      <style>{`
        .epub-content img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
        .epub-content h1, .epub-content h2, .epub-content h3 { line-height: 1.3; margin-top: 1.5em; }
        .epub-content p { margin: 0.8em 0; }
        .epub-content mark.epub-hl { background: #fde047; color: #1a1a1a; border-radius: 2px; padding: 0 1px; }
      `}</style>
    </main>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-7 min-w-[2.75rem] rounded-md border px-2 text-xs transition-colors ${
        active ? 'border-primary bg-primary/10 text-foreground font-medium' : 'border-border bg-background hover:bg-muted'
      }`}
    >
      {children}
    </button>
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
