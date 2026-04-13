import { readFileSync, writeFileSync } from 'node:fs';

const timing = JSON.parse(readFileSync('.tmp/vo-timing.json', 'utf8'));
let code = readFileSync('src/lib/captions/data.ts', 'utf8');

// Map screen ids in timing to SRT variable names in data.ts
const screenToVar = {
  'cold-open': 'SRT_COLD_OPEN',
  'welcome': 'SRT_WELCOME',
  'relationship': 'SRT_RELATIONSHIP',
  'feud-top3': 'SRT_FEUD_TOP3',
  'feud-strongest': 'SRT_FEUD_STRONGEST',
  'feud-trademark': 'SRT_FEUD_TRADEMARK',
  'sponsor-brand': 'SRT_SPONSOR_BRAND',
  'sponsor-why': 'SRT_SPONSOR_WHY',
  'bachelor-roses': 'SRT_BACHELOR_ROSES',
  'bachelor-eliminate': 'SRT_BACHELOR_ELIMINATE',
  'bachelor-limo': 'SRT_BACHELOR_LIMO',
  'shark-invest': 'SRT_SHARK_INVEST',
  'shark-reason': 'SRT_SHARK_REASON',
  'survivor': 'SRT_SURVIVOR',
  'maury': 'SRT_MAURY',
  'producer-notes': 'SRT_PRODUCER_NOTES',
  'credits': 'SRT_CREDITS',
};

function toSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Load render_summary for speaker info
const summary = JSON.parse(readFileSync(
  'C:/Users/nikhi/Downloads/Ope1-20260413T124726Z-3-001/Ope1/outputs/good_morning_nikhil_preview/render_summary.json',
  'utf8'
));

// Build cue lookup by cue_id
const cueMap = {};
for (const cue of summary.rendered_cues) {
  cueMap[cue.cue_id] = cue;
}

let updateCount = 0;

for (const [screenId, data] of Object.entries(timing)) {
  const varName = screenToVar[screenId];
  if (!varName) { console.log(`SKIP: no var for ${screenId}`); continue; }

  // Build new SRT content
  const srtLines = [];
  data.lines.forEach((line, i) => {
    // Find the cue in render_summary to get speaker + text
    // The line.name format is like "screen_0_line_01"
    const cueId = line.name;
    const cue = cueMap[cueId];

    let speaker = '';
    let text = '';
    if (cue) {
      speaker = cue.speaker;
      text = cue.text.replace(/\\!/g, '!');
    } else {
      // Fallback: extract from existing SRT
      speaker = 'UNKNOWN';
      text = line.name;
    }

    // Build speaker prefix for SRT line
    const prefix = speaker ? `${speaker}: ` : '';

    srtLines.push(`${i + 1}`);
    srtLines.push(`${toSrtTime(line.start)} --> ${toSrtTime(line.end)}`);
    srtLines.push(`${prefix}${text}`);
    srtLines.push('');
  });

  // Remove trailing empty line
  if (srtLines[srtLines.length - 1] === '') srtLines.pop();

  const newSrt = srtLines.join('\n');

  // Replace the SRT content in code
  // Pattern: const VAR = `...`;
  const re = new RegExp(`(const ${varName} = \`)([\\s\\S]*?)(\`;)`);
  const match = code.match(re);
  if (match) {
    code = code.replace(re, `$1${newSrt}$3`);
    console.log(`${screenId} (${varName}): ${data.lines.length} cues updated`);
    updateCount++;
  } else {
    console.log(`MISS: ${varName} not found in code`);
  }
}

writeFileSync('src/lib/captions/data.ts', code);
console.log(`\n${updateCount} SRT blocks updated`);
