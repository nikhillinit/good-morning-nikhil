import { execSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PREVIEW = process.argv[2];
const MAP = {
  screen_0: 'cold-open',
  screen_1: 'welcome',
  screen_2: 'relationship',
  screen_3__3a: 'feud-top3',
  screen_3b: 'feud-strongest',
  screen_3c: 'feud-trademark',
  screen_4__4a: 'sponsor-brand',
  screen_4b: 'sponsor-why',
  screen_5__5a: 'bachelor-roses',
  screen_5b: 'bachelor-eliminate',
  screen_5c: 'bachelor-limo',
  screen_6__6a: 'shark-invest',
  screen_6b_6c: 'shark-reason',
  screen_7: 'survivor',
  screen_8__8a___8b: 'maury',
  screen_9: 'producer-notes',
  screen_10: 'credits',
};

const results = {};

for (const [folder, screenId] of Object.entries(MAP)) {
  const dir = join(PREVIEW, folder);
  if (!existsSync(dir)) continue;

  const lineDirs = readdirSync(dir).filter(d => d.includes('_line_')).sort();
  let cumulative = 0;
  const lines = [];

  for (const lineDir of lineDirs) {
    const fullDir = join(dir, lineDir);
    const wavs = readdirSync(fullDir).filter(f => f.endsWith('.wav'));
    if (wavs.length === 0) continue;

    const wavPath = join(fullDir, wavs[0]).replace(/\\/g, '/');
    const cmd = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${wavPath}"`;
    const durStr = execSync(cmd).toString().trim();
    const dur = parseFloat(durStr);

    lines.push({ name: lineDir, start: cumulative, end: cumulative + dur, dur });
    cumulative += dur;
  }

  const lastLineStart = lines.length > 0 ? lines[lines.length - 1].start : 0;

  results[screenId] = { lines, total: cumulative, uiRevealAt: Math.round(lastLineStart * 10) / 10 };

  console.log(`=== ${screenId} (total: ${cumulative.toFixed(1)}s, uiRevealAt: ${lastLineStart.toFixed(1)}s) ===`);
  for (const l of lines) {
    console.log(`  ${l.start.toFixed(1)}s - ${l.end.toFixed(1)}s  ${l.name} (${l.dur.toFixed(1)}s)`);
  }
}

writeFileSync('.tmp/vo-timing.json', JSON.stringify(results, null, 2));
console.log('\nTiming written to .tmp/vo-timing.json');
