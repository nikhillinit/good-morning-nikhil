#!/usr/bin/env node
/**
 * Export survey screens as a PDF for class submission.
 * Usage: node scripts/export-survey-pdf.mjs [--url=<base-url>]
 */

import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const BASE_URL = process.argv.find(a => a.startsWith("--url="))?.split("=")[1]
  || "https://good-morning-nikhil.vercel.app";

const SCREENS = [
  "intro-tv",
  "intro-instructions",
  "gmn-feud-kickoff",
  "feud-top3",
  "feud-strongest",
  "feud-trademark",
  "commercial-break",
  "commercial-why",
  "bachelor-roses",
  "bachelor-eliminate",
  "bachelor-limo",
  "shark-invest",
  "shark-reason",
  "survivor",
  "maury",
  "producer-notes",
  "credits",
  "post-credits",
];

const SCREENSHOT_DIR = join(process.cwd(), ".tmp", "survey-export");
const OUTPUT_PDF = join(process.cwd(), "good-morning-nikhil-survey.pdf");

async function main() {
  console.log(`Exporting survey from: ${BASE_URL}`);

  // Ensure temp dir exists
  if (!existsSync(SCREENSHOT_DIR)) {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // Retina quality
  });
  const page = await context.newPage();

  // Bypass media consent gate
  await context.addCookies([{
    name: "media-consent",
    value: "true",
    domain: new URL(BASE_URL).hostname,
    path: "/",
  }]);

  const screenshots = [];

  for (let i = 0; i < SCREENS.length; i++) {
    const screenId = SCREENS[i];
    const url = `${BASE_URL}?screen=${screenId}&export=true`;
    console.log(`[${i + 1}/${SCREENS.length}] Capturing: ${screenId}`);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      // Wait for UI to be visible (screens have reveal delays)
      await page.waitForTimeout(2000);

      // Hide any skip buttons or navigation for clean export
      await page.evaluate(() => {
        document.querySelectorAll('[data-export-hide]').forEach(el => {
          el.style.display = 'none';
        });
      });

      const screenshotPath = join(SCREENSHOT_DIR, `${i.toString().padStart(2, "0")}-${screenId}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      screenshots.push(screenshotPath);
    } catch (err) {
      console.warn(`  Failed to capture ${screenId}: ${err.message}`);
    }
  }

  await browser.close();

  // Compile into PDF
  console.log("\nCompiling PDF...");
  const pdfDoc = await PDFDocument.create();

  for (const screenshotPath of screenshots) {
    const imgBytes = await import("fs").then(fs => fs.readFileSync(screenshotPath));
    const img = await pdfDoc.embedPng(imgBytes);

    // Landscape orientation, scale to fit
    const pageWidth = 1920;
    const pageHeight = 1080;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    page.drawImage(img, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  writeFileSync(OUTPUT_PDF, pdfBytes);

  console.log(`\nExported ${screenshots.length} screens to: ${OUTPUT_PDF}`);
}

main().catch(err => {
  console.error("Export failed:", err);
  process.exit(1);
});
