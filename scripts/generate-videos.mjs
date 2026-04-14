import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

const MODEL = "falai/wan-2-5-i2v";
const OUTPUT_DIR = "./public/videos";
const SETS_DIR = "./public/sets";
const SIZE_BUDGET_MB = 1.5;
const STYLE_SUFFIX = "TV game show production, saturated studio lighting, 16:9 broadcast, shallow depth of field, cinematic color grade";

// Screen definitions: { id, image, prompt }
const SCREENS = [
  { id: "intro-tv", image: "intro-retro-tv.webp", prompt: "A tight shot of a glowing, retro CRT TV set in a dark room. The screen displays a colorful, 16-bit video game start menu with the title 'Good Morning Nikhil'." },
  { id: "gmn-feud-kickoff", image: "feud-board.webp", prompt: "Quick flash of a sleek 'Good Morning Nikhil' broadcast title card, whipping immediately onto a vibrant, dark blue and yellow Family Feud set. Steve stands at the podium, looking exasperated. Jeff stands behind his podium." },
  { id: "feud-top3", image: "feud-board.webp", prompt: "The lighting violently shifts to the dark blues and yellows of a classic Family Feud set. The iconic board lights up behind them." },
  { id: "commercial-break", image: "sponsor-pedestal.webp", prompt: "Cheesy 'Sponsored By' bumper graphic. A velvet-draped product pedestal is center stage, surrounded by low-hanging fog machine smoke. There is absolutely nothing on the pedestal." },
  { id: "bachelor-roses", image: "bachelor-mansion.webp", prompt: "Sudden channel change static. We are now in a candlelit mansion. Steve is holding a silver platter with three roses. Jeff remains behind his podium the entire time. He is under the impression he is still playing family feud." },
  { id: "bachelor-limo", image: "limo-interior.webp", prompt: "Interior of a dark, cramped limousine. Streetlights sweep across Steve's exhausted face." },
  { id: "shark-invest", image: "shark-warehouse.webp", prompt: "Wide shot of an intimidating, dark warehouse set. One dramatic spotlight hits Steve. Jeff is leaning into the spotlight, frantically mashing a disconnected Feud buzzer." },
  { id: "survivor", image: "tribal-council.webp", prompt: "A dramatic, slow-motion POV shot where the camera emerges through dense, dark green jungle palm fronds and bushes, pushing forward to reveal Steve sitting quietly in a dimly lit bamboo hut, illuminated by flickering torchlight. Very calm, slightly grainy night-vision aesthetic." },
  { id: "maury", image: "maury-studio.webp", prompt: "Harsh, bright daytime TV lighting. Cheap beige set chairs. Steve sits in one, utterly defeated. Jeff is proudly standing behind a portable chunk of the Family Feud podium he has somehow dragged onto the set. The emotional weight here is real, not a joke." },
  { id: "producer-notes", image: "control-room.webp", prompt: "A jarring shift to a behind-the-scenes control room view. Monitors frame the shot, a red 'REC' light blinks. A digital clipboard graphic anchors the screen. Steve is strictly business." },
  { id: "credits", image: "credits-bg.webp", prompt: "Golden text starts scrolling. Behind the text, chaotic, blurred B-roll plays of Jeff wandering onto other game show sets while Steve yells silently in the background." },
  { id: "post-credits", image: "post-credits-stinger.webp", prompt: "Pitch black screen. A single beat of silence. Suddenly, a solitary Family Feud podium light turns on, illuminating Jeff's face in the dark." }
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

  if (!existsSync(imagePath)) {
    log(`ERROR: Image not found: ${imagePath}`);
    return false;
  }

  const fullPrompt = `${screen.prompt}, ${STYLE_SUFFIX}`;
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
    // Pass execution directly to infsh available in environment
    const resultStr = execSync(`infsh app run ${MODEL} --input ${payloadFile} --json`, { encoding: 'utf8' });
    
    // Find the first { and the last } in the result string safely
    const firstBrace = resultStr.indexOf('{');
    const lastBrace = resultStr.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Could not parse JSON payload from response.");
    
    let jsonStr = resultStr.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonStr);
    const videoUrl = parsed.video || parsed.output?.video;
    
    if (!videoUrl) throw new Error("No video URL found in output.");

    log(`  Downloading raw video -> ${tempRaw}`);
    await downloadFile(videoUrl, tempRaw);

    log(`  Compressing with ffmpeg...`);
    const ffmpegCmd = `ffmpeg -y -i "${tempRaw}" -vcodec libx264 -crf 23 -vf scale=1280:720 -movflags +faststart -an "${outputFile}"`;
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
