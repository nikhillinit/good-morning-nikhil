import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const shotListPath = 'Ope1_temp/Ope1/outputs/good_morning_nikhil_shot_list.json';
const previewPath = 'Ope1_temp/Ope1/outputs/good_morning_nikhil_preview';

const fileMap = {
  "SCREEN 0": "00-cold-open.mp3",
  "SCREEN 1": "01-welcome.mp3",
  "SCREEN 2": "02-relationship.mp3",
  "SCREEN 3 (3A)": "03a-feud-top3.mp3",
  "SCREEN 3B": "03b-feud-strongest.mp3",
  "SCREEN 3C": "03c-feud-trademark.mp3",
  "SCREEN 4 (4A)": "04a-sponsor.mp3",
  "SCREEN 4B": "04b-sponsor-why.mp3",
  "SCREEN 5 (5A)": "05a-bachelor-roses.mp3",
  "SCREEN 5B": "05b-bachelor-eliminate.mp3",
  "SCREEN 5C": "05c-bachelor-limo.mp3",
  "SCREEN 6 (6A)": "06a-shark.mp3",
  "SCREEN 6B/6C": "06b-shark-reason.mp3",
  "SCREEN 7": "07-survivor.mp3",
  "SCREEN 8 (8A & 8B)": "08-maury.mp3",
  "SCREEN 9": "09-producer.mp3",
  "SCREEN 10": "10-credits.mp3",
  "POST-CREDIT STINGER": "11-post-credits.mp3"
};

const shotList = JSON.parse(fs.readFileSync(shotListPath, 'utf8'));

for (const screen of shotList.screens) {
  const mp3Name = fileMap[screen.screen_id];
  if (!mp3Name) {
    console.warn(`No mapping for ${screen.screen_id}`);
    continue;
  }

  const lines = screen.audio_lines.sort((a, b) => a.order - b.order);
  let concatList = '';

  // To map SCREEN 8 (8A & 8B) to a directory name like 'screen_8_8a_8b' or just 'screen_8' 
  // We should just read the directory from the cue_id
  
  for (const line of lines) {
    // cue_id looks like: screen_0_line_01 or screen_8_8a_8b_line_01
    // Let's find the parent folder by listing previewPath folders
    const allDirs = fs.readdirSync(previewPath, { withFileTypes: true }).filter(d => d.isDirectory());
    let foundWav = null;
    
    for (const d of allDirs) {
      const lineDir = path.join(previewPath, d.name, line.cue_id);
      if (fs.existsSync(lineDir)) {
        const wavPath = path.join(lineDir, 'neutral_variant_01.wav');
        if (fs.existsSync(wavPath)) {
          foundWav = wavPath;
          break;
        }
      }
    }

    if (foundWav) {
      // Create relative path for FFmpeg, escaping backslashes
      concatList += `file '${foundWav.replace(/\\/g, '/')}'\n`;
    } else {
      console.warn(`Missing WAV for cue: ${line.cue_id}`);
    }
  }

  if (concatList) {
    const listFile = `concat_${mp3Name}.txt`;
    fs.writeFileSync(listFile, concatList);
    const outPath = `public/vo/${mp3Name}`;
    const DSP = "highpass=f=80,acompressor=threshold=-20dB:ratio=4:attack=5:release=50,treble=g=3:f=3000,loudnorm=I=-16:TP=-1.5:LRA=11";
    console.log(`Building ${outPath}...`);
    try {
      execSync(`ffmpeg -y -f concat -safe 0 -i ${listFile} -af "${DSP}" -codec:a libmp3lame -q:a 2 ${outPath}`, { stdio: 'ignore' });
    } catch (e) {
      console.error(`Failed to build ${outPath}`);
    }
    fs.unlinkSync(listFile);
  } else {
    console.warn(`No audio found for ${mp3Name}`);
  }
}
console.log('Stitching complete!');
