import fs from 'fs';
const s = fs.readFileSync(new URL('../src/assets/JobShare_Business_Contact_JA_V2_1 (1).html', import.meta.url), 'utf8');
const body = s.slice(s.indexOf('<body'), s.indexOf('</body>'));
const texts = [];
body.replace(/>([^<]{2,400})</g, (_, t) => {
  const x = t.trim().replace(/\s+/g, ' ');
  if (x && !x.includes('svg') && x.length < 180 && !x.startsWith('function')) texts.push(x);
});
console.log(JSON.stringify([...new Set(texts)], null, 2));
