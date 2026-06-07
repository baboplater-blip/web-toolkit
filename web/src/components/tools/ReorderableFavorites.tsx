'use client';

import { useEffect, useRef, useState } from 'react';
import { GripVertical, Star } from 'lucide-react';
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

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((tool) => {
        const Icon = tool.icon;
        const dragging = draggingId === tool.id;
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
  );
}
