import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SceneTransition } from "@/components/SceneTransition";
import type { Screen, UIType } from "@/data/screens";

afterEach(() => {
  cleanup();
});

function makeScreen(show: string): Screen {
  return {
    id: `test-${show.toLowerCase().replace(/\s+/g, "-")}`,
    show,
    showEmoji: "\uD83C\uDFAC",
    audio: "/vo/test.mp3",
    bg: "/sets/test.webp",
    captions: ["Test caption"],
    ui: "none" as UIType,
  };
}

describe("SceneTransition", () => {
  it("fires channel static on show-segment change (VIS-01)", () => {
    const { container } = render(
      <SceneTransition screen={makeScreen("Commercial Break")} previousShow="Family Feud">
        <div data-testid="child" />
      </SceneTransition>
    );
    const staticOverlay = container.querySelector('[style*="tv-static"]');
    expect(staticOverlay).not.toBeNull();
  });

  it("does NOT fire static on within-show transition: Family Feud (VIS-02)", () => {
    const { container } = render(
      <SceneTransition screen={makeScreen("Family Feud")} previousShow="Family Feud">
        <div data-testid="child" />
      </SceneTransition>
    );
    const staticOverlay = container.querySelector('[style*="tv-static"]');
    expect(staticOverlay).toBeNull();
  });

  it("does NOT fire static on within-show transition: Commercial Break (VIS-02)", () => {
    const { container } = render(
      <SceneTransition screen={makeScreen("Commercial Break")} previousShow="Commercial Break">
        <div data-testid="child" />
      </SceneTransition>
    );
    const staticOverlay = container.querySelector('[style*="tv-static"]');
    expect(staticOverlay).toBeNull();
  });

  it("does NOT fire static on within-show transition: The Bachelor (VIS-02)", () => {
    const { container } = render(
      <SceneTransition screen={makeScreen("The Bachelor")} previousShow="The Bachelor">
        <div data-testid="child" />
      </SceneTransition>
    );
    const staticOverlay = container.querySelector('[style*="tv-static"]');
    expect(staticOverlay).toBeNull();
  });

  it("does NOT fire static on first screen (no previousShow)", () => {
    const { container } = render(
      <SceneTransition screen={makeScreen("Cold Open")}>
        <div data-testid="child" />
      </SceneTransition>
    );
    const staticOverlay = container.querySelector('[style*="tv-static"]');
    expect(staticOverlay).toBeNull();
  });

  it("fires dissolve (not static) for Control Room to Credits", () => {
    const { container } = render(
      <SceneTransition screen={makeScreen("Credits")} previousShow="Control Room">
        <div data-testid="child" />
      </SceneTransition>
    );
    // Should NOT have static overlay
    const staticOverlay = container.querySelector('[style*="tv-static"]');
    expect(staticOverlay).toBeNull();
    // Should have dissolve overlay (bg-black div)
    const dissolveOverlay = container.querySelector(".bg-black");
    expect(dissolveOverlay).not.toBeNull();
  });

  it("always renders children regardless of transition type", () => {
    const { getByTestId } = render(
      <SceneTransition screen={makeScreen("Family Feud")} previousShow="Commercial Break">
        <div data-testid="child">Content</div>
      </SceneTransition>
    );
    expect(getByTestId("child")).toBeDefined();
  });
});
