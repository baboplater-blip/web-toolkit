'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getFavorites,
  getRecent,
  toggleFavorite as toggleFavoriteRaw,
  USAGE_EVENTS,
  type RecentEntry,
} from '@/lib/tools/usage';

/**
 * 즐겨찾기 ID 집합을 구독한다. 같은 탭 내 변경은 CustomEvent, 다른 탭은 storage 이벤트.
 */
export function useFavorites(): {
  favorites: Set<string>;
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
} {
  const [favs, setFavs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setFavs(new Set(getFavorites()));

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setFavs(new Set(detail));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('favorites')) {
        setFavs(new Set(getFavorites()));
      }
    };

    window.addEventListener(USAGE_EVENTS.FAVORITES, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(USAGE_EVENTS.FAVORITES, onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    toggleFavoriteRaw(id);
  }, []);

  const isFavorite = useCallback((id: string) => favs.has(id), [favs]);

  return { favorites: favs, toggle, isFavorite };
}

/**
 * 최근 사용 도구 ID 목록을 구독한다. 가장 최근이 배열 첫 항목.
 */
export function useRecent(): RecentEntry[] {
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  useEffect(() => {
    setRecent(getRecent());

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<RecentEntry[]>).detail;
      if (Array.isArray(detail)) setRecent(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('recent')) {
        setRecent(getRecent());
      }
    };

    window.addEventListener(USAGE_EVENTS.RECENT, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(USAGE_EVENTS.RECENT, onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return recent;
}
