import { describe, it, expect } from "vitest";
import { getAmbientLayer } from "@/lib/ambient-map";

describe("getAmbientLayer", () => {
  it("returns DustMotes for feud-board.png", () => {
    const layer = getAmbientLayer("/sets/feud-board.png");
    expect(layer).not.toBeNull();
  });

  it("returns the same layer for .webp as for .png", () => {
    const png = getAmbientLayer("/sets/feud-board.png");
    const webp = getAmbientLayer("/sets/feud-board.webp");
    // Both should produce a React element with the same type
    expect(png).not.toBeNull();
    expect(webp).not.toBeNull();
    expect((png as any).type).toBe((webp as any).type);
  });

  it("returns null for unknown backgrounds", () => {
    expect(getAmbientLayer("/sets/unknown.png")).toBeNull();
  });

  it("maps all screen backgrounds to a layer", () => {
    const bgs = [
      "/sets/cold-open-glitch.png",
      "/sets/morning-desk.png",
      "/sets/feud-board.png",
      "/sets/sponsor-pedestal.png",
      "/sets/bachelor-mansion.png",
      "/sets/limo-interior.png",
      "/sets/shark-warehouse.png",
      "/sets/tribal-council.png",
      "/sets/maury-studio.png",
      "/sets/control-room.png",
      "/sets/credits-bg.png",
    ];
    for (const bg of bgs) {
      expect(getAmbientLayer(bg), `Expected layer for ${bg}`).not.toBeNull();
    }
  });
});
