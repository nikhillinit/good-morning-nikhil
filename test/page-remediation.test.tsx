import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockScreens, mocks } = vi.hoisted(() => ({
  mockScreens: [
    {
      id: "intro",
      show: "Intro",
      showEmoji: "",
      audio: "",
      bg: "",
      captions: [],
      ui: "start-button" as const,
    },
    {
      id: "q1",
      show: "Question 1",
      showEmoji: "",
      audio: "",
      bg: "",
      captions: [],
      ui: "short-text" as const,
      uiConfig: {
        placeholder: "Type here",
      },
    },
    {
      id: "credits",
      show: "Credits",
      showEmoji: "",
      audio: "",
      bg: "",
      captions: [],
      ui: "submit-button" as const,
    },
  ],
  mocks: {
    session: {
      id: "session-1",
      created_at: "",
      updated_at: "",
      submitted_at: null,
      completion_status: "started",
      last_completed_screen_key: null,
      anonymous: true,
      relationship_type: null,
      relationship_other: null,
      display_name: null,
      mode_variant: "full",
      captions_enabled: true,
      script_version: "1.0",
      prompt_catalog_version: "1.0",
      asset_pack_version: "",
      flow_version: "1.0",
      started_from_resume: false,
    },
    createNewSession: vi.fn(),
    getScreenProgress: vi.fn(),
    getAnswers: vi.fn(),
    trackScreenEntry: vi.fn(),
    completeScreenProgress: vi.fn(),
    updateSession: vi.fn(),
    submitSession: vi.fn(),
    persistScreenResponse: vi.fn(),
  },
}));

vi.mock("@/data/screens", () => ({
  screens: mockScreens,
}));

vi.mock("@/hooks/useSession", () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSession: () => ({
    session: mocks.session,
    loading: false,
    error: null,
    createNewSession: mocks.createNewSession,
    updateSession: vi.fn(),
  }),
}));

vi.mock("@/lib/answers", () => ({
  getAnswers: mocks.getAnswers,
}));

vi.mock("@/lib/screen-progress", () => ({
  getScreenProgress: mocks.getScreenProgress,
  trackScreenEntry: mocks.trackScreenEntry,
  completeScreenProgress: mocks.completeScreenProgress,
}));

vi.mock("@/lib/session", () => ({
  updateSession: mocks.updateSession,
  submitSession: mocks.submitSession,
}));

vi.mock("@/lib/screen-response-persistence", () => ({
  persistScreenResponse: mocks.persistScreenResponse,
}));

vi.mock("@/components/ScreenPlayer", () => ({
  ScreenPlayer: ({
    screen,
    initialValue,
    onComplete,
    onBack,
  }: {
    screen: (typeof mockScreens)[number];
    initialValue?: unknown;
    onComplete: (value: unknown) => void;
    onBack?: () => void;
  }) => (
    <div>
      <div data-testid="screen-id">{screen.id}</div>
      <div data-testid="initial-value">
        {typeof initialValue === "string"
          ? initialValue
          : JSON.stringify(initialValue ?? null)}
      </div>
      <button
        onClick={() => onComplete(screen.ui === "start-button" ? true : "typed value")}
      >
        complete
      </button>
      {onBack ? <button onClick={onBack}>back</button> : null}
    </div>
  ),
}));

vi.mock("@/hooks/useMediaConsent", () => ({
  useMediaConsent: () => ({ hasConsented: true, grantConsent: vi.fn() }),
}));

vi.mock("@/components/ReviewScreen", () => ({
  ReviewScreen: ({
    responses,
    reviewableScreenCount,
  }: {
    responses: Record<string, unknown>;
    reviewableScreenCount: number;
  }) => (
    <div>
      review
      <div data-testid="review-count">{reviewableScreenCount}</div>
      <div data-testid="review-responses">{JSON.stringify(responses)}</div>
    </div>
  ),
}));

describe("page remediation flow", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mocks.createNewSession.mockResolvedValue(mocks.session);
    mocks.trackScreenEntry.mockResolvedValue(undefined);
    mocks.completeScreenProgress.mockResolvedValue(undefined);
    mocks.updateSession.mockResolvedValue(undefined);
    mocks.submitSession.mockResolvedValue(undefined);
    mocks.persistScreenResponse.mockResolvedValue({
      answers: [],
      sessionPatch: {},
      reviewValue: "typed value",
    });
  });

  it("keeps the user on the current screen and offers retry when persistence fails", async () => {
    const { default: Home } = await import("@/app/page");

    mocks.getScreenProgress.mockResolvedValue([]);
    mocks.getAnswers.mockResolvedValue([]);
    mocks.persistScreenResponse
      .mockResolvedValueOnce({
        answers: [],
        sessionPatch: {},
        reviewValue: undefined,
      })
      .mockRejectedValueOnce(new Error("save failed"))
      .mockResolvedValueOnce({
        answers: [],
        sessionPatch: {},
        reviewValue: "typed value",
      });

    render(<Home />);

    expect(await screen.findByTestId("screen-id")).toHaveTextContent("intro");

    fireEvent.click(screen.getByRole("button", { name: "complete" }));
    await waitFor(() => {
      expect(screen.getByTestId("screen-id")).toHaveTextContent("q1");
    });

    fireEvent.click(screen.getByRole("button", { name: "complete" }));

    expect(await screen.findByText("Couldn’t save your answer. Retry to keep going.")).toBeInTheDocument();
    expect(screen.getByTestId("screen-id")).toHaveTextContent("q1");

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByTestId("screen-id")).toHaveTextContent("credits");
    });
    expect(mocks.persistScreenResponse).toHaveBeenCalledTimes(3);
  });
});
