import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearStoredSessionId: vi.fn(),
  createClient: vi.fn(),
  getStoredSessionId: vi.fn(),
  storeSessionId: vi.fn(),
}));

vi.mock("@/lib/session-storage", () => ({
  clearStoredSessionId: mocks.clearStoredSessionId,
  getStoredSessionId: mocks.getStoredSessionId,
  storeSessionId: mocks.storeSessionId,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: mocks.createClient,
}));

describe("session env safeguards", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("does not touch Supabase when resume is attempted without env configuration", async () => {
    mocks.getStoredSessionId.mockReturnValue("session-1");

    const { getOrResumeSession } = await import("@/lib/session");

    await expect(getOrResumeSession()).resolves.toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
