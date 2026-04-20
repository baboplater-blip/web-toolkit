'use client';

import { deflate, inflate } from 'pako';
import type { Conversation, Message } from '@/lib/supabase/types';

/**
 * 오프라인 열람용 대화 스냅샷을 IndexedDB 에 저장.
 *
 * 왜 IDB 인가:
 *   - localStorage 는 5MB 제약 + 동기 API. 대화 하나가 수백 KB 될 수 있어 부족.
 *   - 별도 패키지 없이 브라우저 표준으로 가능.
 *
 * 격리:
 *   - 키는 conversationId 단일. 다중 사용자 격리를 위해 value 에 user_id 기록.
 *   - 로드 시 현재 auth user 와 불일치하면 무시 (다른 계정으로 로그인한 흔적).
 *   - 로그아웃 시 clearAllOfflineSnapshots() 호출로 전부 삭제.
 *
 * 용량 제한:
 *   - 대화당 최근 200 메시지만 저장 (상수 MAX_MESSAGES_PER_SNAPSHOT).
 *   - 전체 대화 수는 LRU 로 MAX_SNAPSHOTS 개까지.
 */

const DB_NAME = 'acp-offline-v1';
const DB_VERSION = 2;
const STORE = 'conversation-snapshots';
const LIST_STORE = 'conversation-lists';
const MAX_MESSAGES_PER_SNAPSHOT = 200;
const MAX_SNAPSHOTS = 30;

export interface ConversationSnapshot {
  conversationId: string;
  userId: string;
  conversation: Conversation;
  messages: Message[];
  savedAt: string;
}

/**
 * IDB 에 실제로 저장되는 모양. `messages` 대신 gzip 된 Uint8Array(messagesGz).
 * 구버전 레코드와의 호환을 위해 `messages` 도 선택적으로 남겨둔다 (새 저장 시엔 null).
 */
interface StoredSnapshot {
  conversationId: string;
  userId: string;
  conversation: Conversation;
  messages?: Message[] | null;
  messagesGz?: Uint8Array | null;
  savedAt: string;
  /** 스토리지 포맷 버전. 2 이상이면 messagesGz 사용. */
  v?: number;
}

function compressMessages(messages: Message[]): Uint8Array {
  const json = JSON.stringify(messages);
  return deflate(json);
}

function decompressMessages(bytes: Uint8Array): Message[] {
  const json = inflate(bytes, { to: 'string' });
  return JSON.parse(json) as Message[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'conversationId' });
        store.createIndex('savedAt', 'savedAt');
      }
      if (!db.objectStoreNames.contains(LIST_STORE)) {
        // 에이전트별 대화 목록을 저장. keyPath = agentId.
        db.createObjectStore(LIST_STORE, { keyPath: 'agentId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('open failed'));
  });
}

async function withListStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(LIST_STORE, mode);
      const store = tx.objectStore(LIST_STORE);
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

/**
 * 대화 스냅샷 저장. 기존 항목은 덮어쓴다.
 * 전체 스냅샷 수가 MAX_SNAPSHOTS 를 넘으면 가장 오래된 것들을 LRU 로 삭제.
 */
export async function saveSnapshot(input: {
  conversation: Conversation;
  messages: Message[];
  userId: string;
}): Promise<void> {
  const trimmed =
    input.messages.length > MAX_MESSAGES_PER_SNAPSHOT
      ? input.messages.slice(-MAX_MESSAGES_PER_SNAPSHOT)
      : input.messages;

  const record: StoredSnapshot = {
    conversationId: input.conversation.id,
    userId: input.userId,
    conversation: input.conversation,
    messagesGz: compressMessages(trimmed),
    savedAt: new Date().toISOString(),
    v: 2,
  };

  try {
    await withStore('readwrite', async (store) => {
      await new Promise<void>((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // LRU 정리 — savedAt 만 필요하니 얕게 읽어 정렬.
      const all = await new Promise<StoredSnapshot[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result ?? []) as StoredSnapshot[]);
        req.onerror = () => reject(req.error);
      });
      if (all.length > MAX_SNAPSHOTS) {
        const sorted = all
          .slice()
          .sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
        const toDelete = sorted.slice(0, all.length - MAX_SNAPSHOTS);
        for (const victim of toDelete) {
          store.delete(victim.conversationId);
        }
      }
    });
  } catch (e) {
    console.warn('[offline-cache] saveSnapshot 실패:', e);
  }
}

/** 특정 대화의 스냅샷 읽기. 없거나 다른 user 의 기록이면 null. */
export async function loadSnapshot(
  conversationId: string,
  currentUserId: string,
): Promise<ConversationSnapshot | null> {
  try {
    const record = await withStore<StoredSnapshot | undefined>('readonly', async (store) => {
      return await new Promise((resolve, reject) => {
        const req = store.get(conversationId);
        req.onsuccess = () => resolve(req.result as StoredSnapshot | undefined);
        req.onerror = () => reject(req.error);
      });
    });
    if (!record) return null;
    if (record.userId !== currentUserId) return null;

    let messages: Message[];
    if (record.messagesGz) {
      const bytes =
        record.messagesGz instanceof Uint8Array
          ? record.messagesGz
          : new Uint8Array(record.messagesGz as ArrayBufferLike);
      messages = decompressMessages(bytes);
    } else if (record.messages) {
      messages = record.messages;
    } else {
      return null;
    }

    return {
      conversationId: record.conversationId,
      userId: record.userId,
      conversation: record.conversation,
      messages,
      savedAt: record.savedAt,
    };
  } catch (e) {
    console.warn('[offline-cache] loadSnapshot 실패:', e);
    return null;
  }
}

/** 전체 삭제 — 로그아웃·계정 전환 시 호출. */
export async function clearAllOfflineSnapshots(): Promise<void> {
  try {
    await withStore('readwrite', (store) => {
      store.clear();
    });
    await withListStore('readwrite', (store) => {
      store.clear();
    });
  } catch (e) {
    console.warn('[offline-cache] clear 실패:', e);
  }
}

export interface ConversationListSnapshot {
  agentId: string;
  userId: string;
  conversations: Conversation[];
  savedAt: string;
}

/** 에이전트별 대화 목록을 통째로 저장. list 는 archived=false 활성 목록 기준. */
export async function saveConversationList(input: {
  agentId: string;
  userId: string;
  conversations: Conversation[];
}): Promise<void> {
  const record: ConversationListSnapshot = {
    agentId: input.agentId,
    userId: input.userId,
    conversations: input.conversations.slice(0, 200),
    savedAt: new Date().toISOString(),
  };
  try {
    await withListStore('readwrite', (store) => {
      store.put(record);
    });
  } catch (e) {
    console.warn('[offline-cache] saveConversationList 실패:', e);
  }
}

/** 저장된 대화 목록 읽기. 다른 사용자 기록이면 null. */
export async function loadConversationList(
  agentId: string,
  currentUserId: string,
): Promise<ConversationListSnapshot | null> {
  try {
    const record = await withListStore<ConversationListSnapshot | undefined>(
      'readonly',
      async (store) => {
        return await new Promise((resolve, reject) => {
          const req = store.get(agentId);
          req.onsuccess = () => resolve(req.result as ConversationListSnapshot | undefined);
          req.onerror = () => reject(req.error);
        });
      },
    );
    if (!record) return null;
    if (record.userId !== currentUserId) return null;
    return record;
  } catch (e) {
    console.warn('[offline-cache] loadConversationList 실패:', e);
    return null;
  }
}
