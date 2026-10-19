import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (name) => fs.readFileSync(path.join(ROOT, name), "utf8");
const checks = [];
function check(label, ok, detail = "") {
  if (!ok) throw new Error(`FAIL ${label}${detail ? " — " + detail : ""}`);
  checks.push(label);
}

const html = read("index.html");
const css = read("styles.css");
const js = read("main.js");

check("theme:dark-default", /data-theme="dark"/.test(html) && /:root,\s*\[data-theme="dark"\]/.test(css));
check("theme:light-skin", /\[data-theme="light"\]/.test(css));
check("theme:controls", html.includes('data-set-theme="dark"') && html.includes('data-set-theme="light"'));
check("theme:persistence", /localStorage\.setItem\(THEME_KEY/.test(js));
check("theme:prefers-motion", /prefers-reduced-motion/.test(js) && /prefers-reduced-motion/.test(css));
check("responsive:tablet-desktop", /@media \(min-width: 900px\)/.test(css));
check("responsive:mobile", /@media \(max-width: 640px\)/.test(css));
check("responsive:small", /@media \(max-width: 420px\)/.test(css));
check("responsive:overflow", /overflow-x:\s*hidden/.test(css));
check("navigation:one-explorer", html.includes('class="cover-links"') && !html.includes("hero-rail"));
check("interaction:agent-optional", html.includes('<details class="agent-block"') && html.includes('<summary class="agent-summary"'));
check("responsive:iframe", /\.agent-stage iframe/.test(css));
check("surface:hero", /\.hero-frame/.test(css));
check("surface:cards", /\.feat/.test(css) && /\.cover-node/.test(css) && /\.lab-more-card/.test(css));
check("surface:agent", /\.agent-block/.test(css));
check("interaction:focus", /:focus-visible/.test(css));
check("interaction:drawer", /\.drawer-panel/.test(css));
console.log("SYSTEMS LAB — VISUAL REGRESSION CONTRACT");
for (const label of checks) console.log("PASS", label);
console.log("RESULT");
console.log("PASS:", checks.length);
console.log("FAIL: 0");
