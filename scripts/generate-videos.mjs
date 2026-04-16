import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

const MODEL = "falai/wan-2-5-i2v";
const OUTPUT_DIR = "./public/videos";
const SETS_DIR = "./public/sets";
const SIZE_BUDGET_MB = 1.5;

const STYLE_HEADER = "2D hand-drawn animation, premium storyboard animatic style, dark charcoal ink on textured parchment paper, stark graphic shadows, slight line boil, strict monochromatic black and white, cinematic 1080p.";
const CAST_DESCRIPTOR = "Steve is a middle-aged Black man with a thick iconic mustache wearing a tailored vintage suit. Jeff is a tall, eccentric older white man with thick dark glasses wearing a dark blazer.";

const GLOBAL_PROMPT_WITH_CAST = `${STYLE_HEADER} ${CAST_DESCRIPTOR}`;

// Screen definitions: { id, image, prompt, needsCast }
const SCREENS = [
  { id: "gmn-feud-kickoff", image: "feud-kickoff.webp", needsCast: true, prompt: "Close-up first-person POV of Steve standing at a wooden game show podium. Steve points aggressively at the camera lens while Jeff (in the deep background) leans back smoothly adjusting his glasses. The game buzzer on the podium is drawn in bright red spot-color." },
  { id: "feud-top3", image: "feud-top3.webp", needsCast: true, prompt: "Close-up first-person POV of Steve standing at a wooden game show podium. Fast dramatic camera push-in as Steve emphatically presses a game buzzer drawn in bright red spot-color, staring impatiently at the lens." },
  { id: "commercial-break", image: "commercial-break.webp", needsCast: true, prompt: "Medium two-shot first-person POV, Steve and Jeff stand behind a gallery pedestal holding a mysterious object revealed slowly amidst a shroud of mist reflecting a bright red spot-color. Locked-off camera, Jeff gestures elegantly and fluidly toward the camera lens with an open palm." },
  { id: "bachelor-roses", image: "bachelor-roses.webp", needsCast: true, prompt: "Claustrophobic first-person POV from the middle back seat of a dark limousine. Steve sits holding a single long-stemmed rose drawn in bright red spot-color. Locked-off camera with slight car vibration. Steve extends the red rose directly toward the lens with a deadpan, intensely serious stare." },
  { id: "bachelor-limo", image: "bachelor-limo.webp", needsCast: true, prompt: "Tight first-person POV from the middle back seat of a dark limousine. Steve and Jeff sit evenly on either side looking inward at the camera. Locked-off camera with slight car vibration, animated streaks of white streetlights sweep smoothly across their faces as they maintain eye contact." },
  { id: "shark-invest", image: "shark-invest.webp", needsCast: true, prompt: "Wide low-angle first-person POV in a massive shadowy industrial warehouse. An empty wooden chair sits in the center, Steve stands in the foreground looming over the camera. Slow dolly push-in toward the empty chair, Steve crosses his arms judgmentally while staring down at the lens." },
  { id: "survivor", image: "survivor.webp", needsCast: true, prompt: "Extreme close-up first-person POV of Steve's face framed tightly. Heavy dark shadows with flickering firelight illumination. Handheld shaky camera movement, the firelight shadows dance across Steve's face as he whispers intensely directly into the lens." },
  { id: "maury", image: "maury.webp", needsCast: true, prompt: "First-person POV on a brightly lit daytime talk show stage. Steve looks exhausted holding out a manila envelope directly toward the camera lens. Slow dolly forward, Steve refuses to look at the envelope or the lens, turning his head away in defeat while keeping his arm extended." },
  { id: "producer-notes", image: "producer-notes.webp", needsCast: true, prompt: "First-person POV sitting at a dark broadcast control panel, a wall of monitors in the background. The center monitor displays Steve's face staring into a security camera, featuring a glowing red REC dot spot-color. Static camera, subtle flickering glow from the monitor screens illuminating the dark room." },
  { id: "credits", image: "credits.webp", needsCast: false, prompt: "Wide static shot of an empty dark television studio stage with no characters. The charcoal ink lines of the stage slowly dissolve and fade out, leaving behind only the blank textured off-white parchment paper background." }
];

function log(msg) {
  console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ${msg}`);
}

async function downloadFile(url, dest) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(dest, buffer);
}

async function generateVideo(screen) {
  const imagePath = join(SETS_DIR, screen.image);
  const outputFile = join(OUTPUT_DIR, `${screen.id}.mp4`);
  const tempRaw = join(OUTPUT_DIR, `.${screen.id}_raw.mp4`);
  const payloadFile = join(OUTPUT_DIR, `.payload_${screen.id}.json`);
  const parchmentFile = join(SETS_DIR, 'parchment.webp');

  if (!existsSync(imagePath)) {
    log(`ERROR: Image not found: ${imagePath}`);
    return false;
  }

  const act1Style = screen.needsCast ? GLOBAL_PROMPT_WITH_CAST : STYLE_HEADER;
  const fullPrompt = `${screen.prompt} ${act1Style}`;
  log(`Generating: ${screen.id}`);
  log(`  Image: ${screen.image}`);
  log(`  Prompt: ${fullPrompt}`);

  try {
    const imgBuffer = readFileSync(imagePath);
    const base64Image = `data:image/webp;base64,${imgBuffer.toString('base64')}`;
    
    writeFileSync(payloadFile, JSON.stringify({
      image: base64Image,
      prompt: fullPrompt
    }));

    log(`  Running infsh app run...`);
    const resultStr = execSync(`infsh app run ${MODEL} --input ${payloadFile} --json`, { encoding: 'utf8' });
    
    const firstBrace = resultStr.indexOf('{');
    const lastBrace = resultStr.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Could not parse JSON payload from response.");
    
    let jsonStr = resultStr.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonStr);
    const videoUrl = parsed.video || parsed.output?.video;
    
    if (!videoUrl) throw new Error("No video URL found in output.");

    log(`  Downloading raw video -> ${tempRaw}`);
    await downloadFile(videoUrl, tempRaw);

    log(`  Applying 12fps posterize + multiply parchment filter (ffmpeg)...`);
    // Scale 1920:1080 and drop internal frames to 12fps, but keep output 24fps. Blend multiply parchment overlay at 20%
    const filter = `[0:v]scale=1920:1080,fps=12[vid];[1:v]scale=1920:1080,format=rgba,colorchannelmixer=aa=0.2[tex];[vid][tex]blend=all_mode='multiply':all_opacity=1[outv]`;
    const ffmpegCmd = `ffmpeg -y -i "${tempRaw}" -loop 1 -i "${parchmentFile}" -filter_complex "${filter}" -map "[outv]" -c:v libx264 -crf 23 -r 24 -movflags +faststart -t 5 -an "${outputFile}"`;
    execSync(ffmpegCmd, { stdio: 'ignore' });

    // Clean up
    unlinkSync(tempRaw);
    if (existsSync(payloadFile)) unlinkSync(payloadFile);

    const sizeMb = (statSync(outputFile).size / 1024 / 1024).toFixed(2);
    log(`DONE: ${screen.id} -> ${outputFile} (${sizeMb} MB)`);
    if (sizeMb > SIZE_BUDGET_MB) {
      log(`WARNING: File size ${sizeMb}MB exceeds budget of ${SIZE_BUDGET_MB}MB`);
    }

    return true;
  } catch (err) {
    log(`ERROR rendering ${screen.id}: ${err.message}`);
    return false;
  }
}

async function main() {
  const targetId = process.argv[2];

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const screensToGenerate = targetId 
    ? SCREENS.filter(s => s.id === targetId) 
    : SCREENS;

  if (targetId && screensToGenerate.length === 0) {
    log(`ERROR: Unknown screen ID: ${targetId}`);
    return;
  }

  log(`Starting batch... generating ${screensToGenerate.length} video(s).`);

  let failed = 0;
  for (const screen of screensToGenerate) {
    const outputFile = join(OUTPUT_DIR, `${screen.id}.mp4`);
    if (existsSync(outputFile)) {
      log(`SKIPPING: ${outputFile} already exists.`);
      continue;
    }
    const success = await generateVideo(screen);
    if (!success) failed++;
  }

  log(`=========================================`);
  log(`Batch complete: ${screensToGenerate.length - failed}/${screensToGenerate.length} succeeded`);
}

main().catch(console.error);
