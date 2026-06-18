'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

/**
 * 전역 단축키 치트시트 — 어느 페이지에서나 `?` 키로 토글된다.
 *
 * tools 페이지에는 페이지-로컬 `?` 도움말이 따로 있으나, 이 오버레이는
 * 전역이라는 점이 차별점이다(두 곳이 동시에 떠도 UX 문제 없음).
 *
 * 입력 필드·contentEditable 에 포커스돼 있거나, 다른 모달(role="dialog")이
 * 이미 열려 있을 때는 동작하지 않아 충돌을 피한다.
 */

type ShortcutRow = {
  keys: string[];
  /** 키 사이 구분자. 'plus' = "+", 'slash' = "/", 'range' = "~" */
  joiner?: 'plus' | 'slash' | 'range';
  label: string;
};

const SHORTCUTS: ShortcutRow[] = [
  { keys: ['Ctrl', 'K'], joiner: 'plus', label: '어디서나 검색 팔레트 열기' },
  { keys: ['/'], label: '검색 박스로 포커스 (허브)' },
  { keys: ['Alt', '←', '→'], joiner: 'slash', label: '이전 · 다음 도구' },
  { keys: ['1', '9'], joiner: 'range', label: '카테고리 직접 선택' },
  { keys: ['g'], label: '다음 카테고리로 점프' },
  { keys: ['Esc'], label: '검색 비우기 / 모달 닫기' },
  { keys: ['?'], label: '이 도움말 토글' },
];

/** 입력 컨텍스트(텍스트 입력·편집기)인지 판정 — 단축키 가로채기 방지. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

function joinerSymbol(joiner: ShortcutRow['joiner']): string {
  if (joiner === 'plus') return '+';
  if (joiner === 'slash') return '/';
  if (joiner === 'range') return '~';
  return '';
}

export function ShortcutsOverlay({ defaultOpen = false }: { defaultOpen?: boolean } = {}) {
  // defaultOpen: 지연 로드 런처가 첫 '?' 트리거 직후 마운트하며 즉시 열기 위해 사용.
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== '?') return;
      // 수정자 조합(Ctrl+? 등)·입력 포커스는 무시.
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      // 이미 다른 모달이 열려 있으면(이 오버레이 제외) 가로채지 않는다.
      const otherDialogOpen =
        !open &&
        document.querySelector(
          '[data-slot="dialog-content"], [role="dialog"]',
        ) !== null;
      if (otherDialogOpen) return;

      event.preventDefault();
      setOpen((prev) => !prev);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md" aria-label="키보드 단축키">
        <DialogTitle>키보드 단축키</DialogTitle>
        <DialogDescription className="sr-only">
          어디서나 사용할 수 있는 키보드 단축키 목록입니다.
        </DialogDescription>

        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-1">
                {row.keys.map((key, index) => (
                  <span key={key} className="flex items-center gap-1">
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {joinerSymbol(row.joiner)}
                      </span>
                    )}
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                      {key}
                    </kbd>
                  </span>
                ))}
              </span>
              <span className="text-right text-muted-foreground">
                {row.label}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
