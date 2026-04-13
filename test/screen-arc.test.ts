import { describe, expect, it } from "vitest";
import { screens } from "@/data/screens";
import { getScreenPrompt } from "@/lib/screen-prompts";

describe("screen arc", () => {
  it("replaces the sponsor questions with a single commercial-break bumper", () => {
    const ids = screens.map((screen) => screen.id);

    expect(ids).toContain("commercial-break");
    expect(ids).not.toContain("sponsor-brand");
    expect(ids).not.toContain("sponsor-why");

    const commercialBreak = screens.find((screen) => screen.id === "commercial-break");
    expect(commercialBreak?.ui).toBe("continue-button");
    expect(getScreenPrompt("commercial-break")).toBeNull();
    expect(commercialBreak?.audio).toBe("/vo/04a-sponsor.mp3");
    expect(commercialBreak?.bg).toBe("/sets/sponsor-pedestal.webp");
  });

  it("places the commercial break after the bachelor sequence", () => {
    const ids = screens.map((screen) => screen.id);

    expect(ids.indexOf("bachelor-limo")).toBeLessThan(ids.indexOf("commercial-break"));
    expect(ids.indexOf("commercial-break")).toBeLessThan(ids.indexOf("shark-invest"));
  });

  it("moves maury before survivor in the back-half arc", () => {
    const ids = screens.map((screen) => screen.id);

    expect(ids.indexOf("maury")).toBeLessThan(ids.indexOf("survivor"));
  });
});
