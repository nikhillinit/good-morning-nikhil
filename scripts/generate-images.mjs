import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const MODEL = "alibaba/wan-2-7-image";
const SETS_DIR = "./public/sets";

const STYLE_HEADER = "2D hand-drawn animation, premium storyboard animatic style, dark charcoal ink on off-white textured parchment paper, stark graphic shadows, slight line boil, monochromatic storyboard.";
const CAST_DESCRIPTOR = "Steve is a middle-aged Black man wearing a vintage suit. Jeff is a tall older white man with thick glasses.";

const GLOBAL_PROMPT = `${STYLE_HEADER} ${CAST_DESCRIPTOR}`;

const IMAGES = [
  { id: "feud-kickoff", prompt: "Close-up POV of a wooden show podium. A hand hovers over a bright red 2D game buzzer. " + GLOBAL_PROMPT },
  { id: "feud-top3", prompt: "Close-up POV of a wooden podium. A hand violently slams down on a bright red 2D game buzzer. High contrast, comic book action burst. " + GLOBAL_PROMPT },
  { id: "commercial-break", prompt: "Medium two-shot POV, Steve and Jeff stand behind a pedestal holding an object covered by a draped fabric drawn in rich red velvet spot-color. Jeff gestures elegantly with an open palm. " + GLOBAL_PROMPT },
  { id: "bachelor-roses", prompt: "Claustrophobic middle back seat of a limo POV. Steve sits holding a single long-stemmed red rose, the only red spot-color. Steve extends the rose directly toward the lens with an intensely serious stare. " + GLOBAL_PROMPT },
  { id: "bachelor-limo", prompt: "Claustrophobic middle back seat of a dark limousine POV. Steve and Jeff sit closely on either side looking inward at the lens. Glowing white streaks of headlights across their faces. " + GLOBAL_PROMPT },
  { id: "shark-invest", prompt: "Wide low-angle POV in a shadowy industrial warehouse. An empty wooden chair sits in the center. Steve stands looming in the foreground. " + GLOBAL_PROMPT },
  { id: "survivor", prompt: "Extreme close-up POV of Steve's face framed tightly. Heavy dark shadows with flickering firelight illumination. Steve is whispering intensely directly into the lens. " + GLOBAL_PROMPT },
  { id: "maury", prompt: "First-person POV, brightly lit stage. Steve looks exhausted holding out a manila envelope directly toward the lens. " + GLOBAL_PROMPT },
  { id: "producer-notes", prompt: "First-person POV sitting at a dark control panel with monitors. Center monitor shows Steve's face staring into a security camera, featuring a glowing red REC dot. " + GLOBAL_PROMPT },
  { id: "credits", prompt: "Wide static shot of an empty television studio stage. No characters. Just the ink drawing of the stage with high contrast. " + STYLE_HEADER },
  { id: "parchment", prompt: "High resolution blank grunge parchment, ancient textured watercolor paper, warm off-white color, slightly rough surface, detailed grain. Empty background texture. monochromatic." }
];

function log(msg) {
  console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ${msg}`);
}

async function downloadFile(url, dest) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(dest, buffer);
}

async function generateImage(imgDef) {
  const outputFile = join(SETS_DIR, `${imgDef.id}.webp`);
  if (existsSync(outputFile)) {
    log(`SKIPPING: ${outputFile} already exists.`);
    return true;
  }

  log(`Generating Image: ${imgDef.id}`);
  try {
    const payloadFile = join(SETS_DIR, `.payload_${imgDef.id}.json`);
    writeFileSync(payloadFile, JSON.stringify({ prompt: imgDef.prompt }));
    
    const resultStr = execSync(`infsh app run ${MODEL} --input "${payloadFile}" --json`, { encoding: 'utf8' });
    
    // Parse json
    const firstBrace = resultStr.indexOf('{');
    const lastBrace = resultStr.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Could not parse JSON payload from response.");
    
    const parsed = JSON.parse(resultStr.substring(firstBrace, lastBrace + 1));
    const imageUrl = parsed.image || parsed.output?.image || parsed.images?.[0]?.url || parsed.output?.images?.[0]?.url;
    
    if (!imageUrl) throw new Error("No image URL found in output => " + JSON.stringify(parsed));

    log(`  Downloading image -> ${outputFile}`);
    await downloadFile(imageUrl, outputFile);
    
    // Clean up temp file
    if (existsSync(payloadFile)) {
      // Clean up async but we can just use fs.unlinkSync
      import('fs').then(fs => fs.unlinkSync(payloadFile)).catch(() => {});
    }
    
    return true;
  } catch (err) {
    log(`ERROR generating ${imgDef.id}: ${err.message}`);
    return false;
  }
}

async function main() {
  if (!existsSync(SETS_DIR)) mkdirSync(SETS_DIR, { recursive: true });

  log(`Starting batch... generating ${IMAGES.length} image(s).`);
  for (const img of IMAGES) {
    await generateImage(img);
  }
  log(`Done!`);
}

main().catch(console.error);
