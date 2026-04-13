import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewScreen } from "@/components/ReviewScreen";

afterEach(() => {
  cleanup();
});

describe("ReviewScreen", () => {
  it("counts answered versus skipped screens using the canonical reviewable total", () => {
    render(
      <ReviewScreen
        responses={{
          relationship: { relationship: "Manager", anonymous: true },
          "feud-top3": ["Curious", "Sharp"],
        }}
        screenLabels={{
          relationship: "Meet Our Audience",
          "feud-top3": "Family Feud",
        }}
        reviewableScreenCount={5}
        anonymous
        onSubmit={vi.fn()}
        onBack={vi.fn()}
        onToggleAnonymous={vi.fn()}
      />,
    );

    expect(screen.getByText("2 answers recorded · 3 skipped")).toBeInTheDocument();
  });

  it("renders audio playback controls for recorded voice answers", () => {
    const { container } = render(
      <ReviewScreen
        responses={{
          survivor: {
            mode: "audio",
            mediaUrl: "https://example.com/voice-responses/session-1/survivor.webm",
          },
        }}
        screenLabels={{
          survivor: "Survivor",
        }}
        reviewableScreenCount={1}
        anonymous
        onSubmit={vi.fn()}
        onBack={vi.fn()}
        onToggleAnonymous={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /review your answers/i }));

    expect(screen.getByText("Survivor")).toBeInTheDocument();
    expect(container.querySelector("audio")).not.toBeNull();
  });
});
