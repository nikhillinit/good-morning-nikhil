const fs = require('fs');
let code = fs.readFileSync('src/data/screens.ts', 'utf8');

const act1 = ['intro-tv', 'intro-instructions', 'gmn-feud-kickoff'];
const act2 = ['feud-top3', 'feud-strongest', 'feud-trademark'];
const commercial = ['commercial-break', 'commercial-why'];

act1.forEach(id => {
  const regex = new RegExp('(id:\\s*"' + id + '",)');
  code = code.replace(regex, `$1\n    bgMusic: "/music/8100a50de29c7f76046522d39513-orig.wav",`);
});

commercial.forEach(id => {
  const regex = new RegExp('(id:\\s*"' + id + '",)');
  code = code.replace(regex, `$1\n    bgMusic: "/music/Standard_Operating_Failure.mp3",`);
});

fs.writeFileSync('src/data/screens.ts', code);
console.log('patched');
