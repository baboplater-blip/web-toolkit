'use client';

import { deflate, inflate } from 'pako';

/**
 * 오프라인 전송 큐 (Outbox) — IndexedDB 기반.
 *
 * 저장 시 `content` 가 COMPRESS_THRESHOLD 이상이면 gzip 해 `contentGz` 에 넣고
 * `content` 는 빈 문자열로 둔다. 읽을 때 자동으로 복원.
 */

const DB_NAME = 'acp-outbox-v1';
const STORE = 'items';
const MAX_ATTEMPTS = 5;
const MAX_QUEUE = 50;
/** 영구 실패 상태로 이 기간이 지나면 자동 삭제 (7일). */
const FAILED_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** 이 바이트 이상이면 압축 — 짧은 메시지는 오버헤드가 커 비효율. */
const COMPRESS_THRESHOLD = 1024;

export interface OutboxItem {
  id: string;
  userId: string;
  agentId: string;
  /** null 이면 flush 시 새 대화를 생성 (오프라인 상태에서 첫 메시지를 보내는 경우). */
  conversationId: string | null;
  harnessId: string | null;
  content: string;
  /** 내부 저장용 — 사용자에겐 항상 `content` 로 펼쳐서 제공한다. */
  contentGz?: Uint8Array | null;
  queuedAt: string;
  attempts: number;
  failed?: boolean;
  lastError?: string;
}

function expand(item: OutboxItem): OutboxItem {
  if (!item.contentGz) return item;
  const bytes =
    item.contentGz instanceof Uint8Array
      ? item.contentGz
      : new Uint8Array(item.contentGz as ArrayBufferLike);
  try {
    const content = inflate(bytes, { to: 'string' });
    return { ...item, content, contentGz: null };
  } catch {
    // 해독 실패 시 원본 content 유지 (빈 값이더라도 상황을 드러냄)
    return item;
  }
}

function packForStorage(item: OutboxItem): OutboxItem {
  if (item.content.length < COMPRESS_THRESHOLD) return item;
  try {
    const bytes = deflate(item.content);
    return { ...item, content: '', contentGz: bytes };
  } catch {
    return item;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('queuedAt', 'queuedAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('open failed'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      Promise.resolve(fn(store))
        .then((val) => {
          tx.oncomplete = () => resolve(val);
          tx.onerror = () => reject(tx.error);
        })
        .catch(reject);
    });
  } finally {
    db.close();
  }
}

function randomId(): string {
  // 브라우저 crypto.randomUUID — Safari 15.4+ 지원. 폴백 간단 구현.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return 'ob-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/** 큐에 새 아이템 추가. 크기 초과 시 가장 오래된 비-failed 아이템을 삭제 후 append. */
export async function enqueue(
  input: Omit<OutboxItem, 'id' | 'queuedAt' | 'attempts' | 'contentGz'>,
): Promise<OutboxItem> {
  const item: OutboxItem = packForStorage({
    ...input,
    id: randomId(),
    queuedAt: new Date().toISOString(),
    attempts: 0,
  });
  await withStore('readwrite', async (store) => {
    const all = await new Promise<OutboxItem[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result ?? []) as OutboxItem[]);
      req.onerror = () => reject(req.error);
    });
    if (all.length >= MAX_QUEUE) {
      const sorted = all
        .filter((x) => !x.failed)
        .slice()
        .sort(
          (a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime(),
        );
      const over = all.length - MAX_QUEUE + 1;
      for (let i = 0; i < over && i < sorted.length; i++) {
        store.delete(sorted[i].id);
      }
    }
    store.put(item);
  });
  return expand(item);
}

/** 사용자 소유 아이템 전체 목록. queuedAt 오름차순. `content` 는 자동 복원. */
export async function listOutbox(userId: string): Promise<OutboxItem[]> {
  try {
    const all = await withStore<OutboxItem[]>('readonly', async (store) => {
      return await new Promise<OutboxItem[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result ?? []) as OutboxItem[]);
        req.onerror = () => reject(req.error);
      });
    });
    return all
      .filter((x) => x.userId === userId)
      .map(expand)
      .sort(
        (a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime(),
      );
  } catch {
    return [];
  }
}

/** 개별 아이템 갱신 (attempts 증가 또는 failed 표시 등). */
export async function updateOutboxItem(item: OutboxItem): Promise<void> {
  try {
    await withStore('readwrite', (store) => {
      store.put(item);
    });
  } catch {}
}

/** 아이템 제거 — flush 성공 또는 사용자가 수동 버림. */
export async function removeOutboxItem(id: string): Promise<void> {
  try {
    await withStore('readwrite', (store) => {
      store.delete(id);
    });
  } catch {}
}

/** 전체 삭제 — 로그아웃/계정 전환 시. */
export async function clearOutbox(): Promise<void> {
  try {
    await withStore('readwrite', (store) => {
      store.clear();
    });
  } catch {}
}

/**
 * 영구 실패 상태로 FAILED_TTL_MS 넘게 남은 아이템 자동 삭제.
 * queuedAt 기준 오래된 순서로 제거. 반환값: 삭제된 개수.
 */
export async function purgeExpiredFailed(): Promise<number> {
  try {
    const cutoff = Date.now() - FAILED_TTL_MS;
    return await withStore('readwrite', async (store) => {
      const all = await new Promise<OutboxItem[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result ?? []) as OutboxItem[]);
        req.onerror = () => reject(req.error);
      });
      let count = 0;
      for (const item of all) {
        if (item.failed && new Date(item.queuedAt).getTime() < cutoff) {
          store.delete(item.id);
          count++;
        }
      }
      return count;
    });
  } catch {
    return 0;
  }
}

export const OUTBOX_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const OUTBOX_FAILED_TTL_DAYS = Math.floor(FAILED_TTL_MS / (24 * 60 * 60 * 1000));
