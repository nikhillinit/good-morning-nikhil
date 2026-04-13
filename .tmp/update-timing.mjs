import { readFileSync, writeFileSync } from 'node:fs';

let code = readFileSync('src/data/screens.ts', 'utf8');

const replacements = [
  ["feud-trademark", 5.2],
  ["sponsor-brand", 4.1],
  ["sponsor-why", 0.9],
  ["bachelor-roses", 8.0],
  ["bachelor-eliminate", 2.4],
  ["bachelor-limo", 8.2],
  ["shark-invest", 16.4],
  ["shark-reason", 1.0],
  ["survivor", 7.7],
  ["maury", 12.2],
  ["producer-notes", 3.5],
  ["credits", 4.6],
];

let count = 0;
for (const [id, newVal] of replacements) {
  const re = new RegExp(`(id:\\s*"${id}"[\\s\\S]*?uiRevealAt:\\s*)[\\d.]+`);
  const match = code.match(re);
  if (match) {
    const oldFull = match[0];
    const prefix = match[1];
    code = code.replace(oldFull, prefix + newVal);
    console.log(`${id} -> ${newVal}`);
    count++;
  } else {
    console.log(`MISS: ${id}`);
  }
}

writeFileSync('src/data/screens.ts', code);
console.log(`${count} values updated`);
