import { describe, expect, it } from "vitest";
import { screens } from "@/data/screens";
import { getScreenPrompt } from "@/lib/screen-prompts";

describe("screen arc", () => {
  it("keeps the merged commercial-break question in the current flow", () => {
    const ids = screens.map((screen) => screen.id);

    expect(ids).toContain("commercial-break");
    expect(ids).not.toContain("sponsor-brand");
    expect(ids).not.toContain("sponsor-why");

    const commercialBreak = screens.find((screen) => screen.id === "commercial-break");
    expect(commercialBreak?.ui).toBe("short-text");
    expect(getScreenPrompt("commercial-break")).toContain("company");
    expect(commercialBreak?.audio).toBe("/vo/04a-sponsor.mp3");
    expect(commercialBreak?.bg).toBe("/sets/sponsor-pedestal.webp");
  });

  it("places the commercial break after the bachelor sequence", () => {
    const ids = screens.map((screen) => screen.id);

    expect(ids.indexOf("commercial-break")).toBeLessThan(ids.indexOf("bachelor-roses"));
    expect(ids.indexOf("commercial-why")).toBeLessThan(ids.indexOf("bachelor-roses"));
  });

  it("keeps survivor before maury in the back-half arc", () => {
    const ids = screens.map((screen) => screen.id);

    expect(ids.indexOf("survivor")).toBeLessThan(ids.indexOf("maury"));
  });

  it("starts with the CRT intro and ends with a post-credits submit screen", () => {
    const ids = screens.map((screen) => screen.id);

    expect(ids[0]).toBe("intro-tv");
    expect(ids[1]).toBe("intro-instructions");
    expect(ids.at(-1)).toBe("post-credits");
  });
});
