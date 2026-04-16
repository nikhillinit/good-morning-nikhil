import fs from "fs";
import { execSync } from "child_process";
import path from "path";

const sourceDir = "C:\\Users\\nikhi\\.gemini\\antigravity\\brain\\fe55d5fe-df7d-41de-b296-614443cfc3e6";
const destDir = "public/sets";

const files = [
  { src: "crowd_pan_1776320702674.png", dest: "crowd-pan.webp" },
  { src: "feud_board_1776320715114.png", dest: "feud-board.webp" },
  { src: "sponsor_pedestal_1776320729698.png", dest: "sponsor-pedestal.webp" },
  { src: "bachelor_mansion_1776320743249.png", dest: "bachelor-mansion.webp" },
  { src: "limo_interior_1776320755099.png", dest: "limo-interior.webp" },
  { src: "shark_warehouse_1776320771907.png", dest: "shark-warehouse.webp" },
  { src: "tribal_council_1776320784890.png", dest: "tribal-council.webp" },
  { src: "maury_studio_1776320799742.png", dest: "maury-studio.webp" },
  { src: "control_room_1776320811943.png", dest: "control-room.webp" },
  { src: "credits_bg_1776320826826.png", dest: "credits-bg.webp" }
];

for (const file of files) {
  const srcPath = path.join(sourceDir, file.src);
  const destPath = path.join(destDir, file.dest);
  
  if (fs.existsSync(srcPath)) {
    try {
      execSync(`npx -y sharp-cli@^2.1.0 -i "${srcPath}" -o "${destPath}" --format webp`);
      console.log(`Converted ${file.src} to ${file.dest}`);
    } catch (e) {
      console.error(`Error converting ${file.src}:`, e.message);
      fs.copyFileSync(srcPath, path.join(destDir, file.dest.replace('.webp', '.png')));
    }
  } else {
    console.warn(`Source file not found: ${srcPath}`);
  }
}
