import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.join(process.cwd(), 'src/data/screens.ts'), 'utf-8');

const audioMatches = content.matchAll(/audio:\s*["']([^"']+)["']/g);
const bgMatches = content.matchAll(/bg:\s*["']([^"']+)["']/g);
const videoMatches = content.matchAll(/video:\s*["']([^"']+)["']/g);

const missing = [];
const checked = new Set();

function checkFile(assetPath) {
  if (assetPath === '' || assetPath === 'crt' || checked.has(assetPath)) return;
  checked.add(assetPath);
  
  const fullPath = path.join(process.cwd(), 'public', assetPath);
  if (!fs.existsSync(fullPath)) {
    missing.push(assetPath);
  }
}

for (const match of audioMatches) {
  checkFile(match[1]);
}

for (const match of bgMatches) {
  checkFile(match[1]);
}

for (const match of videoMatches) {
  checkFile(match[1]);
}

if (missing.length === 0) {
  console.log('✅ All referenced assets in screens.ts exist in /public!');
} else {
  console.log('❌ Missing assets attached in screens.ts:');
  missing.forEach(m => console.log('  - ' + m));
}
