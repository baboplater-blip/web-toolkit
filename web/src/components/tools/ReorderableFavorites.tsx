'use client';

import { useEffect, useRef, useState } from 'react';
import { GripVertical, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { CATEGORY_LABELS, type ToolMeta } from '@/lib/tools/registry';
import { cn } from '@/lib/utils';

interface Props {
  /** 저장된 순서대로의 즐겨찾기 도구 */
  tools: ToolMeta[];
  /** 새 순서(id 배열)를 커밋 */
  onReorder: (ids: string[]) => void;
  /** 즐겨찾기 해제 */
  onRemove: (id: string) => void;
}

/**
 * 즐겨찾기 전용 재정렬 그리드. 드래그 핸들(⋮⋮)로 카드를 끌어 순서를 바꾼다.
 *
 * 카드 본체는 도구로 이동하는 링크(`<a draggable={false}>`)라 클릭 내비게이션은
 * 그대로 동작하고, 드래그는 `<li draggable>` 레벨에서만 일어난다. 순서는
 * 드래그 중 로컬 상태로 미리 반영하고, drop/dragEnd 시 onReorder 로 영구 저장.
 */
export function ReorderableFavorites({ tools, onReorder, onRemove }: Props) {
  const [items, setItems] = useState<ToolMeta[]>(tools);
  const dragId = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // 키보드 재정렬 결과를 스크린리더에 알리는 안내문.
  const [announcement, setAnnouncement] = useState('');

  // 외부(다른 탭·해제 등)에서 즐겨찾기가 바뀌면 동기화 — 단, 드래그 중엔 무시
  useEffect(() => {
    if (dragId.current) return;
    setItems(tools);
  }, [tools]);

  const handleDragStart = (id: string) => {
    dragId.current = id;
    setDraggingId(id);
  };

  const handleDragEnterItem = (overId: string) => {
    const from = dragId.current;
    if (!from || from === overId) return;
    setItems((prev) => {
      const fromIdx = prev.findIndex((t) => t.id === from);
      const overIdx = prev.findIndex((t) => t.id === overId);
      if (fromIdx === -1 || overIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
  };

  const finishDrag = () => {
    if (dragId.current) {
      onReorder(items.map((t) => t.id));
    }
    dragId.current = null;
    setDraggingId(null);
  };

  /**
   * 키보드 재정렬 — 한 칸 위/아래로 이동하고 즉시 영구 저장.
   * 드래그와 동일한 splice 로직을 공유하되, 포인터 없이 버튼으로 호출된다.
   * 이동 후 같은 항목의 버튼에 포커스를 유지해 연속 이동이 가능하게 한다.
   */
  const move = (id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const fromIdx = prev.findIndex((t) => t.id === id);
      if (fromIdx === -1) return prev;
      const toIdx = fromIdx + direction;
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      onReorder(next.map((t) => t.id));
      setAnnouncement(
        `${moved.title} 항목을 ${toIdx + 1}번째 위치로 이동했습니다.`,
      );
      return next;
    });
  };

  return (
    <>
      {/* 키보드 재정렬 결과를 읽어 주는 스크린리더 전용 라이브 영역 */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((tool, index) => {
          const Icon = tool.icon;
          const dragging = draggingId === tool.id;
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          return (
            <li
              key={tool.id}
              draggable
              onDragStart={() => handleDragStart(tool.id)}
              onDragEnter={() => handleDragEnterItem(tool.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                finishDrag();
              }}
              onDragEnd={finishDrag}
              className={cn(
                'group relative rounded-xl border bg-card transition-all',
                dragging
                  ? 'border-primary opacity-60 ring-2 ring-primary/30'
                  : 'hover:border-primary hover:shadow-md',
              )}
            >
              <a
                href={tool.href}
                draggable={false}
                className="flex h-full flex-col gap-2 p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className="-mr-1 -mt-1 flex h-6 w-6 cursor-grab items-center justify-center rounded text-muted-foreground/50 group-hover:text-muted-foreground active:cursor-grabbing"
                    aria-hidden="true"
                    title="드래그하여 순서 변경"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="text-sm font-semibold leading-tight">{tool.title}</h3>
                <p className="line-clamp-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
                <span className="mt-auto text-[11px] text-muted-foreground">
                  {CATEGORY_LABELS[tool.category]}
                </span>
              </a>
              {/* 키보드 접근용 위/아래 이동 — 드래그를 못 쓰는 사용자를 위한 경로 */}
              <div className="absolute bottom-2 left-2 flex gap-0.5">
                <button
                  type="button"
                  onClick={() => move(tool.id, -1)}
                  disabled={isFirst}
                  aria-label={`${tool.title} 위로 이동`}
                  title="위로 이동"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(tool.id, 1)}
                  disabled={isLast}
                  aria-label={`${tool.title} 아래로 이동`}
                  title="아래로 이동"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(tool.id)}
                aria-label="즐겨찾기 해제"
                title="즐겨찾기 해제"
                className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md text-amber-500 transition-colors hover:bg-amber-500/10"
              >
                <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
