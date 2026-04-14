import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
  const m = require('./orchestrate-vo.js');
  console.log('OK', Object.keys(m));
} catch(e) {
  console.error('LOAD ERROR:', e.message);
}
