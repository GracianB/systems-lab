import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BUDGETS = {
  "index.html": 18000,
  "styles.css": 42000,
  "main.js": 18000,
  "i18n.js": 9000,
  "boot.js": 1000,
  "bodytone-chatbot/frontend/demo.js": 10000,
  "bodytone-chatbot/frontend/demo.css": 10000
};

let total = 0;
let failures = 0;
console.log("SYSTEMS LAB — PERFORMANCE BUDGET");
for (const [name, budget] of Object.entries(BUDGETS)) {
  const bytes = fs.statSync(path.join(ROOT, name)).size;
  total += bytes;
  const ok = bytes <= budget;
  console.log((ok ? "PASS " : "FAIL ") + name + " — " + bytes + " / " + budget + " bytes");
  if (!ok) failures++;
}
const aggregateBudget = 108000;
console.log((total <= aggregateBudget ? "PASS " : "FAIL ") + "first-party surface — " + total + " / " + aggregateBudget + " bytes");
if (total > aggregateBudget) failures++;
console.log("RESULT");
console.log("FAIL:", failures);
if (failures) process.exit(1);
