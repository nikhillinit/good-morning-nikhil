import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewScreen } from "@/components/ReviewScreen";

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
});
