import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = process.cwd();
const BUDGETS = {
  "index.html": 24000,
  "styles.css": 42000,
  "main.js": 18000,
  "i18n.js": 13000,
  "boot.js": 1000,
  "cover-canvas.js": 6000,
  "bodytone-chatbot/frontend/index.html": 3000,
  "bodytone-chatbot/frontend/demo.js": 10000,
  "bodytone-chatbot/frontend/demo.css": 10000
};

let total = 0;
let compressed = 0;
let failures = 0;
console.log("SYSTEMS LAB — PERFORMANCE BUDGET");
for (const [name, budget] of Object.entries(BUDGETS)) {
  const bytes = fs.statSync(path.join(ROOT, name)).size;
  total += bytes;
  compressed += gzipSync(fs.readFileSync(path.join(ROOT, name))).length;
  const ok = bytes <= budget;
  console.log((ok ? "PASS " : "FAIL ") + name + " — " + bytes + " / " + budget + " bytes");
  if (!ok) failures++;
}
const aggregateBudget = 118000;
console.log((total <= aggregateBudget ? "PASS " : "FAIL ") + "first-party surface — " + total + " / " + aggregateBudget + " bytes");
if (total > aggregateBudget) failures++;
console.log("RESULT");
console.log("FAIL:", failures);
if (failures) process.exit(1);

console.log("Gzip surface:", compressed, "/ 35000 bytes");
if (compressed > 35000) process.exit(1);
let imageBytes = 0;
for (const name of ['llama','qwen','arcana','arcano']) {
  const bytes = fs.statSync(path.join(ROOT, `assets/aigoritmo/${name}-poster.jpg`)).size;
  imageBytes += bytes;
  if (bytes > 60000) { console.error('FAIL poster:', name, bytes); process.exit(1); }
}
console.log('Lazy Aigoritmo posters:', imageBytes, '/ 220000 bytes');
if (imageBytes > 220000) process.exit(1);
let projectBytes = 0;
for (const name of ['ohana.webp','vortex-cover.svg']) {
  const bytes = fs.statSync(path.join(ROOT, `assets/projects/${name}`)).size;
  projectBytes += bytes;
  if (bytes > 75000) { console.error('FAIL project preview:', name, bytes); process.exit(1); }
}
console.log('Lazy project previews:', projectBytes, '/ 150000 bytes');
if (projectBytes > 150000) process.exit(1);
