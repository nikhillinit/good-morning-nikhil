const fs = require('fs');
let code = fs.readFileSync('src/data/screens.ts', 'utf8');

const bachelor = ['bachelor-roses', 'bachelor-eliminate', 'bachelor-limo'];

bachelor.forEach(id => {
  const regex = new RegExp(`(id:\\s*"${id}",)`);
  // Check if bgMusic is already there
  if (!code.match(new RegExp(`id:\\s*"${id}",\\s*bgMusic:`))) {
    code = code.replace(regex, `$1\n    bgMusic: "/music/the_bachelor_theme.mp3",`);
  }
});

fs.writeFileSync('src/data/screens.ts', code);
console.log('bachelor patched');
