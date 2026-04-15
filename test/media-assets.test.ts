import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { screens } from "@/data/screens";

const VIDEO_DIR = resolve(process.cwd(), "public/videos");
const VO_DIR = resolve(process.cwd(), "public/vo");
const EXEMPT_VO_FILES = new Set(["The_Heavy_Threshold.mp3"]);

function stripQuery(path: string): string {
  return path.split("?")[0];
}

function assetName(path: string): string {
  return basename(stripQuery(path));
}

describe("media asset manifest", () => {
  it("every referenced voice clip exists", () => {
    const audioPaths = screens
      .map((screen) => screen.audio)
      .filter((audio): audio is string => typeof audio === "string" && audio.length > 0);

    for (const audio of audioPaths) {
      expect(existsSync(resolve(VO_DIR, assetName(audio))), `Missing voice clip: ${audio}`).toBe(
        true,
      );
    }
  });

  it("every referenced video clip exists", () => {
    const videoPaths = screens
      .map((screen) => screen.video)
      .filter((video): video is string => typeof video === "string" && video.length > 0);

    for (const video of videoPaths) {
      expect(existsSync(resolve(VIDEO_DIR, assetName(video))), `Missing video clip: ${video}`).toBe(
        true,
      );
    }
  });

  it("every checked-in video clip is referenced by a screen", () => {
    const referencedVideos = new Set(
      screens
        .map((screen) => screen.video)
        .filter((video): video is string => typeof video === "string" && video.length > 0)
        .map(assetName),
    );

    const actualVideos = readdirSync(VIDEO_DIR).filter((file) => file.endsWith(".mp4"));

    for (const file of actualVideos) {
      expect(referencedVideos.has(file), `Unreferenced video clip: ${file}`).toBe(true);
    }
  });

  it("every checked-in voice clip is referenced or explicitly exempt", () => {
    const referencedAudio = new Set(
      screens
        .map((screen) => screen.audio)
        .filter((audio): audio is string => typeof audio === "string" && audio.length > 0)
        .map(assetName),
    );

    const actualAudio = readdirSync(VO_DIR).filter((file) => file.endsWith(".mp3"));

    for (const file of actualAudio) {
      expect(
        referencedAudio.has(file) || EXEMPT_VO_FILES.has(file),
        `Unreferenced voice clip: ${file}`,
      ).toBe(true);
    }
  });

  it("no screen declares videoBehavior without a video file", () => {
    const invalidScreens = screens.filter(
      (screen) => screen.videoBehavior !== undefined && !screen.video,
    );

    expect(invalidScreens).toEqual([]);
  });
});
