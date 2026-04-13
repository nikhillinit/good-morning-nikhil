# Still Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 5 duplicate Feud-stage stills with distinct per-show backgrounds using style-anchored full-scene generation, then validate and commit.

**Architecture:** External AI generation produces 6 new/cleaned WebP assets. A validation script and existing ambient-map tests confirm all 11 stills meet spec requirements. No runtime code changes — only asset swaps.

**Tech Stack:** AI image generation tool (external), Node.js scripts for validation, vitest for test suite, WebP at 85% quality / 2752x1536.

**Spec:** `docs/superpowers/specs/2026-04-13-still-standardization-design.md`

---

### Task 1: Add Asset Validation Script

Write a Node.js script that verifies every still in `public/sets/` meets the spec: correct dimensions, file size, format, and that every `bg` path in `screens.ts` resolves to an existing file.

**Files:**
- Create: `scripts/validate-stills.mjs`
- Create: `test/stills-validation.test.ts`

- [ ] **Step 1: Write the failing test**

In `test/stills-validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { screens } from "@/data/screens";
import fs from "node:fs";
import path from "node:path";

const SETS_DIR = path.resolve(__dirname, "../public/sets");

describe("stills validation", () => {
  const bgFiles = [...new Set(screens.map((s) => s.bg))];

  it("every screen bg path resolves to an existing file", () => {
    for (const bg of bgFiles) {
      const filePath = path.join(SETS_DIR, path.basename(bg));
      expect(fs.existsSync(filePath), `Missing: ${bg}`).toBe(true);
    }
  });

  it("all stills are WebP format", () => {
    const files = fs.readdirSync(SETS_DIR);
    for (const f of files) {
      expect(f.endsWith(".webp"), `Not WebP: ${f}`).toBe(true);
    }
  });

  it("all stills are 2752x1536", () => {
    const files = fs.readdirSync(SETS_DIR);
    for (const f of files) {
      const buf = fs.readFileSync(path.join(SETS_DIR, f));
      // WebP with VP8X chunk: width at bytes 24-26 (LE) +1, height at 27-29 (LE) +1
      const riff = buf.toString("ascii", 0, 4);
      const webp = buf.toString("ascii", 8, 12);
      expect(riff).toBe("RIFF");
      expect(webp).toBe("WEBP");

      const chunk = buf.toString("ascii", 12, 16);
      let w = 0, h = 0;
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

  it("no still exceeds 800 KB", () => {
    const files = fs.readdirSync(SETS_DIR);
    for (const f of files) {
      const stat = fs.statSync(path.join(SETS_DIR, f));
      expect(stat.size, `${f} too large: ${Math.round(stat.size / 1024)} KB`).toBeLessThanOrEqual(800 * 1024);
    }
  });

  it("every still has a unique file hash (no duplicates)", () => {
    const crypto = require("node:crypto");
    const files = fs.readdirSync(SETS_DIR);
    const hashes = new Map<string, string>();
    for (const f of files) {
      const buf = fs.readFileSync(path.join(SETS_DIR, f));
      const hash = crypto.createHash("md5").update(buf).digest("hex");
      const existing = hashes.get(hash);
      expect(existing, `${f} is a duplicate of ${existing}`).toBeUndefined();
      hashes.set(hash, f);
    }
  });

  it("exactly 11 stills exist", () => {
    const files = fs.readdirSync(SETS_DIR).filter((f) => f.endsWith(".webp"));
    expect(files.length).toBe(11);
  });
});
```

- [ ] **Step 2: Run test to verify current state**

Run: `npx vitest run test/stills-validation.test.ts`

Expected: The "unique file hash" test FAILS — multiple stills are currently duplicates. All other tests should pass (current files are already 2752x1536 WebP under 800 KB).

- [ ] **Step 3: Commit the validation test**

```bash
git add test/stills-validation.test.ts
git commit -m "test: add still validation suite — dimensions, format, size, uniqueness"
```

---

### Task 2: Generate New Stills (External — Manual)

This task is performed outside the codebase using an AI image generation tool. The plan documents exact prompts and acceptance criteria.

**Files:**
- Replace: `public/sets/morning-desk.webp`
- Replace: `public/sets/control-room.webp`
- Replace: `public/sets/limo-interior.webp`
- Replace: `public/sets/cold-open-glitch.webp`

- [ ] **Step 1: Generate `morning-desk.webp` — Welcome / Relationship**

Prompt direction:
```
Morning talk show news desk set, coffee mug on desk, studio monitors in background,
warm morning light, ink sketch on aged parchment paper, two men standing at podiums —
bald mustached man in light suit on left, tall man with glasses in dark jacket on right,
finger beside chin, 16:9 aspect ratio
```

Style references: `shark-warehouse.webp` (composition), `bachelor-mansion.webp` (ink style)

Acceptance:
- Steve (left): bald, mustache, light suit, irritated expression
- Jeff (right): glasses, dark jacket, finger-beside-chin
- Background: clearly a morning show set, NOT a game show stage
- No readable text
- Ink-on-parchment style consistent with existing stills

- [ ] **Step 2: Generate `control-room.webp` — Behind the Scenes**

Prompt direction:
```
TV production control room, bank of monitors showing static, mixing board with switches,
dim blue glow from screens, ink sketch on aged parchment paper, two men standing at podiums —
bald mustached man in light suit on left, tall man with glasses in dark jacket on right,
finger beside chin, 16:9 aspect ratio
```

Style references: `shark-warehouse.webp` (composition), `tribal-council.webp` (ink weight)

Acceptance: same character criteria as Step 1. Background: clearly a control room with monitors, NOT a game show stage.

- [ ] **Step 3: Generate `limo-interior.webp` — Bachelor Confessional**

Prompt direction:
```
Limousine backseat interior at night, leather seats, car window showing dark exterior,
intimate close framing, ink sketch on aged parchment paper, two men seated —
bald mustached man in light suit on left, tall man with glasses in dark jacket on right,
finger beside chin, 16:9 aspect ratio
```

Style reference: `bachelor-mansion.webp` (style + character reference)

Acceptance: same character criteria. Background: clearly a car interior, NOT the mansion.

- [ ] **Step 4: Generate `cold-open-glitch.webp` — CRT Static**

Prompt direction:
```
CRT television static, scan lines, warm phosphor glow, noise grain,
retro TV turning on, aged parchment paper texture, 16:9 aspect ratio,
no people, no characters, no text
```

Acceptance: No characters. Reads as a TV powering on with static. Parchment texture present.

- [ ] **Step 5: Export all 4 as WebP at 85% quality, 2752x1536**

If the generation tool outputs PNG or another format, convert:
```bash
# Example using cwebp (install via: npm i -g cwebp-bin)
cwebp -q 85 -resize 2752 1536 input.png -o output.webp
```

- [ ] **Step 6: Drop files into `public/sets/`**

Replace the 4 files. Filenames must match exactly:
- `public/sets/morning-desk.webp`
- `public/sets/control-room.webp`
- `public/sets/limo-interior.webp`
- `public/sets/cold-open-glitch.webp`

---

### Task 3: Cleanup Existing Stills (External — Manual)

This task is performed outside the codebase using an AI inpainting tool.

**Files:**
- Modify: `public/sets/sponsor-pedestal.webp`
- Modify: `public/sets/maury-studio.webp`

- [ ] **Step 1: Cleanup `sponsor-pedestal.webp`**

Inpainting targets:
1. Remove mic artifact (bottom-center area)
2. Adjust set dressing to differentiate from Feud stage — add product pedestal spotlight, remove/change the answer board to a display stand

Acceptance:
- Steve + Jeff still present with correct design
- Visually distinct from `feud-board.webp` — reads as a commercial break, not a game show round
- No readable text

- [ ] **Step 2: Cleanup `maury-studio.webp`**

Inpainting targets:
1. Envelope should be monochrome (currently tan/brown — inpaint to grayscale matching the ink sketch)
2. Reduce overall ink weight — lighter line work than Feud scenes

Acceptance:
- Steve + Jeff still present with correct design
- Envelope is monochrome, not colored
- Lighter ink weight than `feud-board.webp`

- [ ] **Step 3: Export both as WebP at 85% quality, 2752x1536**

Same conversion process as Task 2 Step 5 if needed.

- [ ] **Step 4: Replace files in `public/sets/`**

Filenames unchanged:
- `public/sets/sponsor-pedestal.webp`
- `public/sets/maury-studio.webp`

---

### Task 4: Apply Ink Weight Gradient (External — Manual)

Post-processing step applied to all 6 new/cleaned stills.

**Files:**
- Modify: `public/sets/morning-desk.webp`
- Modify: `public/sets/control-room.webp`
- Modify: `public/sets/limo-interior.webp`
- Modify: `public/sets/sponsor-pedestal.webp`
- Modify: `public/sets/maury-studio.webp`
- Modify: `public/sets/cold-open-glitch.webp`

- [ ] **Step 1: Apply curves adjustment per scene**

Target ink weight order (lightest to darkest):
1. `maury-studio.webp` — lightest ink, talk show softness
2. `sponsor-pedestal.webp` — light-medium
3. `morning-desk.webp` — medium
4. `feud-board.webp` — medium (no change, reference point)
5. `bachelor-mansion.webp` — medium-dark (no change)
6. `cold-open-glitch.webp` — N/A (CRT static, no ink lines)
7. `shark-warehouse.webp` — dark (no change)
8. `tribal-council.webp` — darkest (no change)

Apply a brightness/contrast curves adjustment to the 4 character stills you modified (morning-desk, control-room, sponsor, maury). `limo-interior` should match `bachelor-mansion` weight. `control-room` should sit between morning and feud.

- [ ] **Step 2: Re-export modified files as WebP 85% quality**

Verify file sizes stay under 800 KB each.

---

### Task 5: Run Validation and Commit Assets

After all 6 stills are replaced, verify everything passes and commit.

**Files:**
- Verify: `public/sets/*.webp` (all 11)
- Run: `test/stills-validation.test.ts`
- Run: `test/ambient-map.test.ts`

- [ ] **Step 1: Visual spot-check all 11 stills**

Open each file and verify:
- [ ] `cold-open-glitch.webp` — CRT static, no characters
- [ ] `morning-desk.webp` — Morning show set, Steve + Jeff present
- [ ] `feud-board.webp` — Feud stage (unchanged)
- [ ] `sponsor-pedestal.webp` — Sponsor set, distinct from Feud, no mic artifact
- [ ] `bachelor-mansion.webp` — Mansion interior (unchanged)
- [ ] `limo-interior.webp` — Car interior, distinct from mansion
- [ ] `shark-warehouse.webp` — Warehouse (unchanged)
- [ ] `tribal-council.webp` — Bamboo/torches (unchanged)
- [ ] `maury-studio.webp` — Talk show, monochrome envelope, light ink
- [ ] `control-room.webp` — Control room with monitors
- [ ] `credits-bg.webp` — Empty stage (unchanged)

- [ ] **Step 2: Run stills validation test**

Run: `npx vitest run test/stills-validation.test.ts`

Expected: ALL 6 tests pass — including the "unique file hash" test that was previously failing.

- [ ] **Step 3: Run ambient-map test**

Run: `npx vitest run test/ambient-map.test.ts`

Expected: ALL 4 tests pass — ambient layers still resolve for all 11 backgrounds.

- [ ] **Step 4: Run full test suite**

Run: `npm test`

Expected: 83+ tests pass, 0 failures.

- [ ] **Step 5: Commit all asset changes**

```bash
git add public/sets/morning-desk.webp public/sets/control-room.webp public/sets/limo-interior.webp public/sets/cold-open-glitch.webp public/sets/sponsor-pedestal.webp public/sets/maury-studio.webp
git commit -m "art: replace duplicate stills with distinct per-show backgrounds

- morning-desk: new morning talk show set (Welcome/Relationship screens)
- control-room: new TV production booth (Behind the Scenes screen)
- limo-interior: new car interior (Bachelor confessional screen)
- cold-open-glitch: CRT static texture (TV turning on)
- sponsor-pedestal: cleaned up, differentiated from Feud stage
- maury-studio: monochrome envelope, lighter ink weight

Closes Phase 1: Still Standardization"
```

- [ ] **Step 6: Push to master**

```bash
git push origin master
```

Vercel auto-deploy will trigger. Verify stills load correctly on the deployed site.
