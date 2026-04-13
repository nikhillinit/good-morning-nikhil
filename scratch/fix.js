const fs = require('fs');
let data = fs.readFileSync('src/data/screens.ts', 'utf8');

let inSurvivor = false;
data = data.split('\n').map(line => {
  if (line.includes('id: "survivor"')) {
    inSurvivor = true;
  }
  if (line.includes('id: "producer-notes"')) {
    inSurvivor = false;
  }
  if (line.includes('maxSeconds:')) {
    return inSurvivor ? line : null;
  }
  return line;
}).filter(l => l !== null).join('\n');

fs.writeFileSync('src/data/screens.ts', data);
