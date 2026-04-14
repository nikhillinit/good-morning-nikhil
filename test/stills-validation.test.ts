import { describe, it, expect } from "vitest";
import { screens } from "@/data/screens";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, basename, resolve } from "node:path";

const SETS_DIR = resolve(process.cwd(), "public/sets");
const fileBackedBgFiles = [...new Set(screens.map((s) => s.bg).filter((bg) => bg !== "crt"))];
const referencedStillFiles = fileBackedBgFiles.map((bg) => basename(bg));

describe("stills validation", () => {
  it("every screen bg path resolves to an existing file", () => {
    for (const bg of fileBackedBgFiles) {
      const filePath = join(SETS_DIR, basename(bg));
      expect(existsSync(filePath), `Missing: ${bg}`).toBe(true);
    }
  });

  it("all referenced stills are WebP format", () => {
    const files = referencedStillFiles;
    for (const f of files) {
      expect(f.endsWith(".webp"), `Not WebP: ${f}`).toBe(true);
    }
  });

  it("all referenced stills are 2752x1536", () => {
    const files = referencedStillFiles;
    for (const f of files) {
      const buf = readFileSync(join(SETS_DIR, f));
      const riff = buf.toString("ascii", 0, 4);
      const webp = buf.toString("ascii", 8, 12);
      expect(riff).toBe("RIFF");
      expect(webp).toBe("WEBP");

      const chunk = buf.toString("ascii", 12, 16);
      let w = 0,
        h = 0;
      if (chunk === "VP8X") {
        w = (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1;
        h = (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1;
      } else if (chunk === "VP8 ") {
        w = buf.readUInt16LE(26) & 0x3fff;
        h = buf.readUInt16LE(28) & 0x3fff;
      } else if (chunk === "VP8L") {
        const bits = buf.readUInt32LE(21);
        w = (bits & 0x3fff) + 1;
        h = ((bits >> 14) & 0x3fff) + 1;
      }
      expect(w, `${f} width`).toBe(2752);
      expect(h, `${f} height`).toBe(1536);
    }
  });

  it("no referenced still exceeds 800 KB", () => {
    const files = referencedStillFiles;
    for (const f of files) {
      const stat = statSync(join(SETS_DIR, f));
      expect(
        stat.size,
        `${f} too large: ${Math.round(stat.size / 1024)} KB`,
      ).toBeLessThanOrEqual(800 * 1024);
    }
  });

  it("every referenced still has a unique file hash (no duplicates)", () => {
    const files = referencedStillFiles;
    const hashes = new Map<string, string>();
    for (const f of files) {
      const buf = readFileSync(join(SETS_DIR, f));
      const hash = createHash("md5").update(buf).digest("hex");
      const existing = hashes.get(hash);
      expect(existing, `${f} is a duplicate of ${existing}`).toBeUndefined();
      hashes.set(hash, f);
    }
  });

  it("tracks every unique file-backed still used by the current flow", () => {
    expect(referencedStillFiles.length).toBe(fileBackedBgFiles.length);
    expect(referencedStillFiles.length).toBeGreaterThan(0);
  });
});
