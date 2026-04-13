/**
 * IndexedDB offline queue for failed voice uploads.
 *
 * When uploadVoiceResponse throws (network offline, Supabase down, etc.),
 * the blob is stashed here. On next app load or network recovery,
 * flushVoiceQueue retries each entry and patches the answer row on success.
 *
 * All functions return safe defaults when IndexedDB is unavailable (SSR, old browsers).
 */

const DB_NAME = "gmn-voice-queue";
const DB_VERSION = 1;
const STORE_NAME = "pending-uploads";

export interface VoiceQueueEntry {
  key: string;
  sessionId: string;
  screenId: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

// Module-level cache — one open DB per page load.
let dbCache: IDBDatabase | null = null;

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function getDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbAvailable()) return Promise.resolve(null);
  if (dbCache) return Promise.resolve(dbCache);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      dbCache = (event.target as IDBOpenDBRequest).result;
      // If the DB is closed externally (e.g., deleteDatabase in tests), reset cache.
      dbCache.onclose = () => {
        dbCache = null;
      };
      resolve(dbCache);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Stash a failed upload in IndexedDB.
 * Key = `${sessionId}/${screenId}` — re-enqueueing overwrites (upsert).
 */
export async function enqueueFailedUpload(
  sessionId: string,
  screenId: string,
  blob: Blob,
  mimeType: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const entry: VoiceQueueEntry = {
    key: `${sessionId}/${screenId}`,
    sessionId,
    screenId,
    blob,
    mimeType,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Returns the number of queued entries.
 */
export async function getQueueSize(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Close the cached DB connection and reset module state.
 * Only exported for unit tests — do not call in production code.
 */
export function _resetDbForTesting(): void {
  if (dbCache) {
    dbCache.close();
    dbCache = null;
  }
}

/**
 * Flush all queued entries.
 *
 * For each entry:
 *  - Calls uploadVoiceResponse (imported dynamically to avoid circular deps).
 *  - On success: deletes the entry, calls onUploaded if provided.
 *  - On failure: keeps the entry, increments failed counter.
 *
 * Returns { flushed, failed } counts.
 */
export async function flushVoiceQueue(
  onUploaded?: (
    sessionId: string,
    screenId: string,
    publicUrl: string,
  ) => Promise<void>,
): Promise<{ flushed: number; failed: number }> {
  const db = await getDb();
  if (!db) return { flushed: 0, failed: 0 };

  // Read all entries first (readonly transaction).
  const entries: VoiceQueueEntry[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as VoiceQueueEntry[]);
    req.onerror = () => reject(req.error);
  });

  if (entries.length === 0) return { flushed: 0, failed: 0 };

  // Dynamic import avoids circular dependency: storage.ts never imports voice-queue.ts.
  const { uploadVoiceResponse } = await import("@/lib/supabase/storage");

  let flushed = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const publicUrl = await uploadVoiceResponse(
        entry.sessionId,
        entry.screenId,
        entry.blob,
      );

      // Delete the entry on success.
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(entry.key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      if (onUploaded) {
        await onUploaded(entry.sessionId, entry.screenId, publicUrl);
      }

      flushed++;
    } catch {
      // Keep the entry — it will be retried on next flush.
      failed++;
    }
  }

  return { flushed, failed };
}
