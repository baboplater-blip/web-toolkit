'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  Search,
  CornerDownLeft,
  ArrowRight,
  ArrowLeftRight,
  Lightbulb,
} from 'lucide-react';
import { TOOLS, CATEGORY_LABELS, type ToolMeta } from '@/lib/tools/registry';
import { searchTools, highlightMatch, type SearchSignals } from '@/lib/tools/search';
import { useRecent, useUsageStats } from '@/lib/hooks/useUsage';
import {
  CONVERT_INDEX,
  USECASE_INDEX,
  type ConvertEntry,
  type UseCaseEntry,
} from '@/lib/search-index.generated';

const MAX_TOOL_SUGGESTIONS = 7;
const MAX_CONVERT_SUGGESTIONS = 3;
const MAX_USECASE_SUGGESTIONS = 3;

/** 키보드 네비·렌더를 한 배열로 다루기 위한 통합 제안 항목. */
type Suggestion =
  | { kind: 'tool'; href: string; tool: ToolMeta }
  | { kind: 'convert'; href: string; entry: ConvertEntry }
  | { kind: 'usecase'; href: string; entry: UseCaseEntry };

/** 공백으로 나눈 토큰이 텍스트에 모두 포함되는지(소문자 부분일치). */
function matchesAllTokens(haystack: string, tokens: string[]): boolean {
  return tokens.every((tok) => haystack.includes(tok));
}

/** 쿼리 매칭 구간 강조 (정규식 미사용 — 입력 안전). */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  return (
    <>
      {highlightMatch(text, query).map((s, i) =>
        s.match ? (
          <mark key={i} className="rounded-[2px] bg-primary/20 text-inherit">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

/** 쿼리에 매칭되는 변환 후보(소수)를 찾는다. */
function matchConverts(query: string, limit: number): ConvertEntry[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const out: ConvertEntry[] = [];
  for (const entry of CONVERT_INDEX) {
    const hay = `${entry.label} ${entry.from} ${entry.to} ${entry.slug}`.toLowerCase();
    if (matchesAllTokens(hay, tokens)) {
      out.push(entry);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** 쿼리에 매칭되는 활용법 후보(소수)를 찾는다. */
function matchUseCases(query: string, limit: number): UseCaseEntry[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const out: UseCaseEntry[] = [];
  for (const entry of USECASE_INDEX) {
    const hay = `${entry.h1} ${entry.description} ${entry.keywords.join(' ')}`.toLowerCase();
    if (matchesAllTokens(hay, tokens)) {
      out.push(entry);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/**
 * 홈 히어로의 즉시 검색 박스 + 자동완성 제안.
 *
 * 타이핑하면 퍼지 검색(filterTools, 한글 초성 포함)으로 상위 후보를 드롭다운에
 * 즉시 노출한다. 이전에는 "도구 둘러보기" 버튼을 눌러 /tools 로 가야만 검색이
 * 가능했다 — cold-start 전환 손실을 없애는 게 목적.
 *
 *   ↑↓  후보 이동   ·   Enter  선택(없으면 전체 검색)   ·   Esc  닫기/비우기
 */
export function HomeSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const usage = useUsageStats();
  const recent = useRecent();
  const signals = useMemo<SearchSignals>(
    () => ({ usage, recentIds: recent.map((r) => r.id) }),
    [usage, recent],
  );

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim();
    if (q.length === 0) return [];

    const tools = searchTools(
      q,
      TOOLS.filter((t) => t.status === 'ready'),
      signals,
    ).slice(0, MAX_TOOL_SUGGESTIONS);

    // 도구로 이미 도달 가능한 변환/활용법 중복을 줄이기 위해, 도구 매칭이
    // 있더라도 변환·활용법은 소수만 보조로 제안한다(도구 우선).
    const converts = matchConverts(q, MAX_CONVERT_SUGGESTIONS);
    const useCases = matchUseCases(q, MAX_USECASE_SUGGESTIONS);

    return [
      ...tools.map((tool): Suggestion => ({ kind: 'tool', href: tool.href, tool })),
      ...converts.map(
        (entry): Suggestion => ({
          kind: 'convert',
          href: `/convert/${entry.slug}`,
          entry,
        }),
      ),
      ...useCases.map(
        (entry): Suggestion => ({
          kind: 'usecase',
          href: `/use/${entry.slug}`,
          entry,
        }),
      ),
    ];
  }, [query, signals]);

  const showPanel = open && query.trim().length > 0;

  /* 외부 클릭 시 패널 닫기 */
  useEffect(() => {
    if (!showPanel) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showPanel]);

  /* 활성 항목 viewport 안으로 */
  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const goToSearch = () => {
    const q = query.trim();
    window.location.assign(q ? `/tools?q=${encodeURIComponent(q)}` : '/tools');
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const sel = active >= 0 ? suggestions[active] : undefined;
      if (sel) window.location.assign(sel.href);
      else goToSearch();
    } else if (e.key === 'Escape') {
      if (query) {
        setQuery('');
        setActive(-1);
      } else {
        inputRef.current?.blur();
      }
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative mx-auto mt-8 max-w-xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="무엇을 하고 싶으세요? 예: PDF 합치기, 배경 제거…"
          aria-label="도구 검색"
          aria-expanded={showPanel}
          aria-controls="home-search-suggest"
          role="combobox"
          aria-autocomplete="list"
          className="h-12 w-full rounded-xl border bg-card/80 py-3.5 pl-12 pr-28 text-sm shadow-sm outline-none backdrop-blur transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={goToSearch}
          className="absolute right-2 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          검색
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {showPanel && (
        <div
          id="home-search-suggest"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-popover text-left shadow-lg"
        >
          {suggestions.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              일치하는 도구가 없습니다. <kbd className="rounded border bg-muted px-1">Enter</kbd> 로 전체 검색
            </div>
          ) : (
            <ul ref={listRef} role="listbox" aria-label="도구 제안" className="max-h-80 overflow-y-auto p-1.5">
              {suggestions.map((s, i) => {
                const sel = i === active;
                // 도구 → 변환·활용법(보조)로 넘어가는 첫 항목 앞에 구분선을 둔다.
                const showDivider =
                  s.kind !== 'tool' &&
                  (i === 0 || suggestions[i - 1].kind === 'tool');

                return (
                  <li key={`${s.kind}-${s.href}`} data-idx={i} role="option" aria-selected={sel}>
                    {showDivider && (
                      <div className="mt-1 mb-0.5 border-t px-2 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        변환 · 활용법
                      </div>
                    )}
                    <a
                      href={s.href}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        sel ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {s.kind === 'tool' ? (
                        <>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <s.tool.icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              <Highlighted text={s.tool.title} query={query} />
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {s.tool.description}
                            </span>
                          </span>
                          <span className="hidden shrink-0 rounded border bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                            {CATEGORY_LABELS[s.tool.category]}
                          </span>
                        </>
                      ) : s.kind === 'convert' ? (
                        <>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              <Highlighted text={s.entry.label} query={query} />
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              파일 변환 가이드
                            </span>
                          </span>
                          <span className="hidden shrink-0 rounded border bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                            변환
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Lightbulb className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              <Highlighted text={s.entry.h1} query={query} />
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {s.entry.description}
                            </span>
                          </span>
                          <span className="hidden shrink-0 rounded border bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                            활용법
                          </span>
                        </>
                      )}
                      {sel && (
                        <CornerDownLeft
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={goToSearch}
            className="flex w-full items-center justify-center gap-1.5 border-t bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            “{query.trim()}” 전체 결과 보기
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
