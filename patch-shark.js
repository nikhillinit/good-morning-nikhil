const fs = require('fs');
let code = fs.readFileSync('src/data/screens.ts', 'utf8');

const shark = ['shark-invest', 'shark-reason'];

shark.forEach(id => {
  const regex = new RegExp(`(id:\\s*"${id}",)`);
  if (!code.match(new RegExp(`id:\\s*"${id}",\\s*bgMusic:`))) {
    code = code.replace(regex, `$1\n    bgMusic: "/music/The_Unspoken_Hour.mp3",`);
  }
});

fs.writeFileSync('src/data/screens.ts', code);
console.log('shark patched');
