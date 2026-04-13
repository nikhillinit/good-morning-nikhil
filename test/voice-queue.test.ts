// fake-indexeddb must be imported before voice-queue to polyfill IDB in jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock uploadVoiceResponse at the top level (hoisted by vitest)
vi.mock("@/lib/supabase/storage", () => ({
  uploadVoiceResponse: vi.fn(),
}));

import { uploadVoiceResponse } from "@/lib/supabase/storage";
import {
  _resetDbForTesting,
  enqueueFailedUpload,
  flushVoiceQueue,
  getQueueSize,
} from "@/lib/voice-queue";

const mockUpload = uploadVoiceResponse as ReturnType<typeof vi.fn>;

// Helper to delete the IDB database between tests so state is fresh.
// Must be called AFTER closing the cached connection via _resetDbForTesting.
async function deleteVoiceQueueDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase("gmn-voice-queue");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      // Should not happen after _resetDbForTesting, but resolve anyway
      resolve();
    };
  });
}

function makeBlob(content = "audio-data"): Blob {
  return new Blob([content], { type: "audio/webm" });
}

describe("voice-queue", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Close and evict the cached DB, then wipe the store so each test is isolated
    _resetDbForTesting();
    await deleteVoiceQueueDb();
  });

  it("enqueueFailedUpload stores an entry and getQueueSize returns 1", async () => {
    await enqueueFailedUpload("sess-1", "screen-a", makeBlob(), "audio/webm");
    const size = await getQueueSize();
    expect(size).toBe(1);
  });

  it("enqueuing same sessionId+screenId twice results in only 1 entry (upsert)", async () => {
    await enqueueFailedUpload("sess-1", "screen-a", makeBlob("v1"), "audio/webm");
    await enqueueFailedUpload("sess-1", "screen-a", makeBlob("v2"), "audio/webm");
    const size = await getQueueSize();
    expect(size).toBe(1);
  });

  it("flushVoiceQueue with successful upload removes entry and calls onUploaded", async () => {
    mockUpload.mockResolvedValueOnce("https://example.com/audio.webm");

    await enqueueFailedUpload("sess-2", "screen-b", makeBlob(), "audio/webm");

    const onUploaded = vi.fn().mockResolvedValue(undefined);
    const result = await flushVoiceQueue(onUploaded);

    expect(result).toEqual({ flushed: 1, failed: 0 });
    expect(await getQueueSize()).toBe(0);
    expect(onUploaded).toHaveBeenCalledWith(
      "sess-2",
      "screen-b",
      "https://example.com/audio.webm",
    );
  });

  it("flushVoiceQueue with failed upload keeps entry and returns failed:1", async () => {
    mockUpload.mockRejectedValueOnce(new Error("Network error"));

    await enqueueFailedUpload("sess-3", "screen-c", makeBlob(), "audio/webm");

    const result = await flushVoiceQueue();

    expect(result).toEqual({ flushed: 0, failed: 1 });
    expect(await getQueueSize()).toBe(1);
  });

  it("flushVoiceQueue with mixed success and failure returns correct counts", async () => {
    mockUpload
      .mockResolvedValueOnce("https://example.com/success.webm")
      .mockRejectedValueOnce(new Error("Offline"));

    await enqueueFailedUpload("sess-4", "screen-d", makeBlob(), "audio/webm");
    await enqueueFailedUpload("sess-4", "screen-e", makeBlob(), "audio/webm");

    const result = await flushVoiceQueue();

    expect(result.flushed + result.failed).toBe(2);
    expect(result.flushed).toBe(1);
    expect(result.failed).toBe(1);
    expect(await getQueueSize()).toBe(1);
  });

  it("returns safe defaults when indexedDB is undefined", async () => {
    // Close cached connection first so the guard hits the typeof check
    _resetDbForTesting();

    const originalIdb = globalThis.indexedDB;
    // @ts-expect-error — intentionally removing global for test
    delete globalThis.indexedDB;

    try {
      await expect(
        enqueueFailedUpload("s", "sc", makeBlob(), "audio/webm"),
      ).resolves.toBeUndefined();
      await expect(getQueueSize()).resolves.toBe(0);
      await expect(flushVoiceQueue()).resolves.toEqual({ flushed: 0, failed: 0 });
    } finally {
      globalThis.indexedDB = originalIdb;
    }
  });
});
