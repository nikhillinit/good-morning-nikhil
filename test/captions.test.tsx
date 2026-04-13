import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Captions } from "@/components/Captions";

afterEach(() => {
  cleanup();
});

describe("Captions", () => {
  it("renders a lower-third with speaker chip and caption text", () => {
    render(
      <Captions
        visible
        caption={{
          id: 1,
          startMs: 0,
          endMs: 1000,
          speaker: "steve",
          text: "Welcome to the show.",
          variant: "hero",
        }}
      />,
    );

    expect(screen.getByText(/steve:/i)).toBeInTheDocument();
    expect(screen.getByText("Welcome to the show.")).toBeInTheDocument();
    expect(document.querySelector(".caption-shell")).not.toBeNull();
  });

  it("renders nothing when hidden or caption is null", () => {
    const { container, rerender } = render(
      <Captions visible={false} caption={null} />,
    );

    expect(container.firstChild).toBeNull();

    rerender(
      <Captions
        visible={false}
        caption={{
          id: 2,
          startMs: 0,
          endMs: 1000,
          speaker: "jeff",
          text: "Not visible.",
          variant: "normal",
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
