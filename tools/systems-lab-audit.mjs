import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");
const failures = [];
const passes = [];

const required = [
  "index.html",
  "main.js",
  "i18n.js",
  "styles.css",
  "README.md",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
  "package.json",
  ".gitignore",
  ".editorconfig",
  "SECURITY.md",
  "boot.js",
  "vendor/dompurify/purify.min.js",
  "vendor/dompurify/LICENSE"
];

function file(name) {
  return path.join(ROOT, name);
}

function exists(name) {
  return fs.existsSync(file(name));
}

function read(name) {
  return fs.readFileSync(file(name), "utf8");
}

function check(label, condition, detail = "") {
  if (condition) {
    passes.push(label);
    console.log("PASS " + label + (detail ? " — " + detail : ""));
  } else {
    failures.push(label);
    console.log("FAIL " + label + (detail ? " — " + detail : ""));
  }
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

console.log("SYSTEMS LAB — STRICT QUALITY GATE");
console.log("ROOT:", ROOT);
console.log("");

for (const name of required) {
  check("required:" + name, exists(name));
}

const html = read("index.html");
const main = read("main.js");
const i18n = read("i18n.js");
const css = read("styles.css");
const sitemap = read("sitemap.xml");
const robots = read("robots.txt");
const pkgText = read("package.json");
const workflow = read(".github/workflows/quality.yml");

let pkg = {};
try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push("package-json");
  console.log("FAIL package-json — invalid JSON");
}

check("html:doctype", /^<!doctype html>/i.test(html));
check("html:lang", /<html[^>]+lang="(?:es|en)"/i.test(html));
check("html:viewport", /name="viewport"/i.test(html));
check("html:description", /name="description"/i.test(html));
check("html:canonical", html.includes('rel="canonical" href="https://gracianb.github.io/systems-lab/"'));
check("html:og-type", /property="og:type"[^>]+content="website"/i.test(html));
check("html:twitter-card", /name="twitter:card"/i.test(html));
check("html:csp", /Content-Security-Policy/i.test(html) && /script-src 'self'/i.test(html) && /style-src-attr 'unsafe-inline'/i.test(html));
check("html:prepaint-boot", /<script src="\.\/boot\.js\?v=lab-v4"><\/script>/i.test(html));
check("html:json-ld", /<script type="application\/ld\+json">/i.test(html));
check("html:referrer", /name="referrer"[^>]+strict-origin-when-cross-origin/i.test(html));
check("html:skip-link", /href="#main"/i.test(html));
check("html:main-landmark", /<main[^>]+id="main"/i.test(html));
check("html:menu-controls", /aria-controls="drawer"/i.test(html));
check("html:drawer-dialog", /id="drawer"[^>]*role="dialog"/i.test(html) && /aria-modal="true"/i.test(html) && /aria-hidden="true"/i.test(html));
check("html:iframe-title", /<iframe\b[^>]*title="[^"]+"[^>]*>/i.test(html));
check("html:inline-handlers", count(html, /son[a-z]+s*=/gi) === 0);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
check("html:unique-ids", duplicates.length === 0, duplicates.join(", ") || "none");

const targetBlankTags = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)].map((m) => m[0]);
const unsafeBlank = targetBlankTags.filter((tag) => !/rel="[^"]*noopener[^"]*"/i.test(tag));
check("html:external-links", unsafeBlank.length === 0, unsafeBlank.length ? unsafeBlank.join("\n") : "noopener present");

check("html:no-javascript-hrefs", !/href\s*=\s*["']javascript:/i.test(html));
check("html:intro-single-owner", !/setTimeout\(function \(\) \{ document\.documentElement\.classList\.add\("intro-done"\)/.test(html));

const i18nKeyMatches = [...i18n.matchAll(/^\s{4}([A-Za-z0-9_]+):/gm)].map((m) => m[1]);
const i18nKeys = [...new Set(i18nKeyMatches)];
const htmlKeys = [...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map((m) => m[1]);
const missingKeys = [...new Set(htmlKeys.filter((key) => !i18nKeys.includes(key)))];
check("i18n:key-coverage", missingKeys.length === 0, missingKeys.join(", ") || "complete");
const programmaticKeys = new Set(["htmlLang", "title"]);
const unusedKeys = i18nKeys.filter((key) => !htmlKeys.includes(key) && !programmaticKeys.has(key));
check("i18n:no-retired-keys", unusedKeys.length === 0, unusedKeys.join(", ") || "clean");

const syntax = spawnSync(process.execPath, ["--check", file("main.js")], { encoding: "utf8" });
check("js:syntax", syntax.status === 0, (syntax.stderr || "").trim() || "node --check");

check("js:no-eval", count(main, /\beval\s*\(/g) === 0);
check("js:no-new-function", count(main, /\bnew Function\b/g) === 0);
check("js:no-document-write", count(main, /document\.write/g) === 0);
check("js:menu-state", count(main, /let menuOpen = false;/g) === 1 && count(main, /setMenu\(!menuOpen\)/g) === 1);
check("js:active-location", /aria-current\", \"location\"/.test(main));
check("js:menu-escape", count(main, /e\.key === "Escape"/g) === 1);
check("js:menu-focus-return", /menuReturnFocus/.test(main) && /target\?\.focus\(\)/.test(main));
check("js:menu-focus-trap", /e\.key === "Tab"/.test(main) && /focusable = \[\.\.\.drawer\.querySelectorAll/.test(main));
check("js:canvas-visibility", /document\.addEventListener\("visibilitychange"/.test(main) && /!running \|\| document\.hidden/.test(main));
check("js:canvas-cancel", /cancelAnimationFrame \|\| clearTimeout/.test(main));
check("js:no-exposed-integrations", !/LAB_(?:GAS|ZENDESK)|script\.google\.com\/macros/i.test(main));
check("js:no-retired-demo-selectors", !/q-name|out-find|q-seg|out-mail|q-machine|q-kind|out-mant|data-run=/i.test(main));

const important = count(css, /!important/g);
const cssBytes = fs.statSync(file("styles.css")).size;
const CSS_BUDGET_BYTES = 42_000;
check("css:no-important", important === 0, String(important));
check("css:budget", cssBytes <= CSS_BUDGET_BYTES, cssBytes + " / " + CSS_BUDGET_BYTES + " bytes");
check("css:focus-visible", /:focus-visible/.test(css));
check("css:reduced-motion", /prefers-reduced-motion:\s*reduce/.test(css));
check("css:hidden-contract", /\.drawer\[hidden\]\s*\{\s*display:\s*none;/.test(css));


check("seo:robots-sitemap", robots.includes("Sitemap: https://gracianb.github.io/systems-lab/sitemap.xml"));
check("seo:sitemap-canonical", sitemap.includes("<loc>https://gracianb.github.io/systems-lab/</loc>"));
check("seo:sitemap-lastmod", /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap));

check("pkg:name", pkg.name === "systems-lab");
check("pkg:version", pkg.version === "4.0.0");
check("pkg:check-script", pkg.scripts?.check === "npm run audit:strict");
check("pkg:node-engine", typeof pkg.engines?.node === "string" && pkg.engines.node.includes("20"));
check("ci:read-only", /permissions:\s*\n\s+contents:\s*read/.test(workflow));
check("ci:no-feature-push-duplication", !/push:\s*\n(?:.|\n)*branches:\s*\n(?:.|\n)*feat\//.test(workflow));
check("ci:node-24", /node-version:\s*24/.test(workflow));
check("ci:runs-check", /run:\s*npm run check/.test(workflow));

const sourceExtensions = new Set([".html", ".htm", ".js", ".mjs", ".cjs", ".css", ".json", ".jsonc", ".md", ".txt", ".xml", ".yml", ".yaml", ".svg", ".sh", ".ps1", ".py"]);

function walkTextFiles(dir, relative = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const rel = path.join(relative, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walkTextFiles(full, rel));
    else if (sourceExtensions.has(path.extname(entry.name).toLowerCase())) result.push(rel);
  }
  return result;
}

const sourceFiles = walkTextFiles(ROOT);
const sourceText = new Map();
for (const name of sourceFiles) {
  try { sourceText.set(name, fs.readFileSync(path.join(ROOT, name), "utf8")); }
  catch { /* Ignore unreadable edge cases. */ }
}

const codeText = [...sourceText.entries()].filter(([name]) => !name.startsWith("vendor/"));
const agentHtml = sourceText.get("bodytone-chatbot/frontend/index.html") ?? "";
const demoJs = sourceText.get("bodytone-chatbot/frontend/demo.js") ?? "";
const agentDemoCss = sourceText.get("bodytone-chatbot/frontend/demo.css") ?? "";
check("agent:exists", Boolean(agentHtml && demoJs && agentDemoCss));
check("agent:no-cdn-sanitizer", !/cdnjs\.cloudflare\.com\/ajax\/libs\/dompurify/i.test(agentHtml));
check("agent:local-sanitizer", agentHtml.includes("../../vendor/dompurify/purify.min.js"));
check("agent:noindex", /name="robots"\s+content="noindex, nofollow"/i.test(agentHtml));
check("agent:referrer", /name="referrer"\s+content="strict-origin-when-cross-origin"/i.test(agentHtml));
check("agent:demo-file-limits", /MAX_FILES\s*=\s*5/.test(demoJs) && /MAX_FILE_BYTES\s*=\s*10 \* 1024 \* 1024/.test(demoJs));
check("agent:local-api", /u\.origin === location\.origin/.test(demoJs));
check("agent:reduced-motion", /prefers-reduced-motion:\s*reduce/.test(agentDemoCss));
check("security:no-eval-tree", codeText.every(([name, text]) => !/\beval\s*\(/.test(text)));
check("security:no-new-function-tree", codeText.every(([name, text]) => !/\bnew Function\b/.test(text)));
check("security:no-document-write-tree", codeText.every(([name, text]) => !/document\.write/.test(text)));

const dynamicInnerHtml = [...codeText]
  .filter(([name]) => /\.(?:js|mjs|cjs)$/i.test(name))
  .flatMap(([name, text]) => text.split("\n").map((line, index) => ({ name, index: index + 1, line })))
  .filter(({ line }) => /innerHTML\s*=/.test(line) && (/\+/.test(line) || /\$\{/.test(line)));
check("security:no-dynamic-innerhtml", dynamicInnerHtml.length === 0, dynamicInnerHtml.map((hit) => hit.name + ":" + hit.index).join(", ") || "clean");

const jsFiles = sourceFiles.filter((name) => !name.startsWith("vendor/") && /\.(?:js|mjs|cjs)$/i.test(name));
const syntaxFailures = jsFiles.filter((name) => spawnSync(process.execPath, ["--check", path.join(ROOT, name)], { encoding: "utf8" }).status !== 0);
check("js:syntax-tree", syntaxFailures.length === 0, syntaxFailures.join(", ") || jsFiles.length + " files");
const forbiddenPatterns = [
  ["google-apps-script-id", /AKfycb[A-Za-z0-9_-]+/],
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["github-token", /(?:ghp_|github_pat_)[A-Za-z0-9_]+/],
  ["openai-style-key", /(?:sk|rk)-[A-Za-z0-9_-]{20,}/]
];
for (const [label, pattern] of forbiddenPatterns) {
  const hits = sourceFiles.filter((name) => pattern.test(read(name)));
  check("security:no-" + label, hits.length === 0, hits.join(", ") || "clean");
}

console.log("");
console.log("RESULT");
console.log("PASS:", passes.length);
console.log("FAIL:", failures.length);

if (STRICT && failures.length) {
  process.exit(1);
}
