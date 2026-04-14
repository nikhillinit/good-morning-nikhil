import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const imagePath = 'public/sets/limo-interior.webp';
const prompt = 'wide shot interior, slow continuous tracking, left third features host speaking, right two-thirds empty dark leather seating, TV game show production, saturated studio lighting, 16:9 broadcast, shallow depth of field, cinematic color grade';

console.log('Reading image...');
const imageBuffer = readFileSync(imagePath);
const base64Image = `data:image/webp;base64,${imageBuffer.toString('base64')}`;

const payload = JSON.stringify({
  image: base64Image,
  prompt: prompt
});

// Save payload to file for infsh to use
writeFileSync('.payload.json', payload);

console.log('Calling infsh app run falai/wan-2-5-i2v...');
try {
  const result = execSync('infsh app run falai/wan-2-5-i2v --input .payload.json --json', { encoding: 'utf8' });
  console.log('Result:', result);
  
  const parsed = JSON.parse(result);
  console.log('Video URL:', parsed.video);
} catch (e) {
  console.error('Failed!', e.message);
  if (e.stdout) console.log('STDOUT:', e.stdout);
  if (e.stderr) console.log('STDERR:', e.stderr);
}
