const fs = require('fs');
let text = fs.readFileSync('src/data/screens.ts', 'utf8');

// Map Backgrounds to the new generated seeds (but leave the 'video: ...' attributes fully intact!)
text = text.replace(/id:\s*"gmn-feud-kickoff"[\s\S]*?bg:\s*"\/sets\/feud-board.webp"/, (m) => m.replace('feud-board.webp', 'feud-kickoff.webp'));
text = text.replace(/id:\s*"feud-top3"[\s\S]*?bg:\s*"\/sets\/feud-board.webp"/, (m) => m.replace('feud-board.webp', 'feud-top3.webp'));
text = text.replace(/id:\s*"feud-strongest"[\s\S]*?bg:\s*"\/sets\/feud-board.webp"/, (m) => m.replace('feud-board.webp', 'feud-top3.webp'));
text = text.replace(/id:\s*"feud-trademark"[\s\S]*?bg:\s*"\/sets\/feud-board.webp"/, (m) => m.replace('feud-board.webp', 'feud-top3.webp'));

text = text.replace(/bg:\s*"\/sets\/sponsor-pedestal.webp"/g, 'bg: "/sets/commercial-break.webp"');

text = text.replace(/id:\s*"bachelor-roses"[\s\S]*?bg:\s*"\/sets\/bachelor-mansion.webp"/, (m) => m.replace('bachelor-mansion.webp', 'bachelor-roses.webp'));
text = text.replace(/id:\s*"bachelor-eliminate"[\s\S]*?bg:\s*"\/sets\/bachelor-mansion.webp"/, (m) => m.replace('bachelor-mansion.webp', 'bachelor-roses.webp'));

text = text.replace(/bg:\s*"\/sets\/shark-warehouse.webp"/g, 'bg: "/sets/shark-invest.webp"');
text = text.replace(/bg:\s*"\/sets\/tribal-council.webp"/g, 'bg: "/sets/survivor.webp"');
text = text.replace(/bg:\s*"\/sets\/maury-studio.webp"/g, 'bg: "/sets/maury.webp"');
text = text.replace(/bg:\s*"\/sets\/control-room.webp"/g, 'bg: "/sets/producer-notes.webp"');
text = text.replace(/bg:\s*"\/sets\/credits-bg.webp"/g, 'bg: "/sets/credits.webp"');

fs.writeFileSync('src/data/screens.ts', text, 'utf8');
