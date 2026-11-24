import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const doc = fs.readFileSync("README.md", "utf8");
const cells = [...doc.matchAll(/<td\b[^>]*>[\s\S]*?<\/td>/gi)].map(m => m[0]);
const tables = [...doc.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map(m => m[0]);

test("README is an English-first product showroom, not a long changelog", () => {
  assert.ok(doc.length >= 10500 && doc.length < 15000, "README should be substantive but scannable");
  assert.match(doc, /<h1 align="center">SYSTEMS LAB<\/h1>/);
  assert.match(doc, /GitHub Pages|public showroom|product showroom/i);
  assert.match(doc, /fictional demonstration data/i);
  assert.match(doc, /<details>[\s\S]*?For developers[\s\S]*?<\/details>/i);
  assert.match(doc, /En español/);
  assert.doesNotMatch(doc, /gurusup|127\.0\.0\.1:8001|github\.com\/GracianB\/aigoritmo/i);
  for (const product of ["AIGORITMO", "PROJECT OHANA", "VØRTICE", "CUSTOMER HEALTH INTELLIGENCE", "REVOPS STUDIO", "BODYTONE SUPPORT OS", "CUTTER STUDIO"]) {
    assert.ok(doc.includes(product), "Missing product: " + product);
  }
});

test("GitHub-safe HTML tables have no literal Markdown syntax", () => {
  assert.equal(tables.length, 4, "1 featured AI gallery + 3 paired product galleries");
  assert.equal(cells.length, 8, "2 AI visuals + 6 project cards");
  for (const cell of cells) {
    assert.doesNotMatch(cell, /\*\*[^*]+\*\*/, "Markdown strong markers render literally inside HTML tables");
    assert.doesNotMatch(cell, /\[[^\]]+\]\((?:https?:|\.\/)/, "Markdown links render literally inside HTML tables");
    assert.doesNotMatch(cell, /^#{1,6}\s/m, "Markdown headings inside HTML tables render literally");
    assert.match(cell, /<img\b[^>]*>/i);
  }
  assert.equal((doc.match(/<td\b/g)||[]).length, (doc.match(/<\/td>/g)||[]).length, "Table cells must be balanced");
  assert.equal((doc.match(/<tr\b/g)||[]).length, (doc.match(/<\/tr>/g)||[]).length, "Table rows must be balanced");
  assert.equal((doc.match(/<table\b/g)||[]).length, (doc.match(/<\/table>/g)||[]).length, "Tables must be balanced");
  assert.doesNotMatch(doc, /<div align="center">/i, "GitHub does not reliably render Markdown inside HTML divs");
});

test("AIGORITMO is featured with two matched 16:9 landscape images, not a dangling Qwen thumbnail", () => {
  const featured = tables[0];
  assert.match(featured, /assets\/aigoritmo\/arcana-poster\.jpg/);
  assert.match(featured, /assets\/aigoritmo\/arcano-poster\.jpg/);
  assert.doesNotMatch(featured, /qwen-poster\.jpg|llama-poster\.jpg/);
  assert.doesNotMatch(doc, /width="30%"/);
  assert.equal((featured.match(/width="50%"/g)||[]).length, 2);
  assert.equal((featured.match(/width="100%"/g)||[]).length, 2);
  assert.match(doc, /LLAMA[\s\S]*?QWEN[\s\S]*?ARCANA[\s\S]*?ARCANO/);
  assert.match(doc, /24 guided character\/scenario\/language examples/);
  assert.match(doc, /authored scripts/);
  assert.match(doc, /off by default/);
  assert.match(doc, /aigoritmo-universe-lab-gracianbs-projects\.vercel\.app/);
});

test("All README artwork is present with accessible alt text and no untrusted remote assets", () => {
  const expected = [
    "assets/readme-cover.svg",
    "assets/aigoritmo/arcana-poster.jpg",
    "assets/aigoritmo/arcano-poster.jpg",
    "assets/projects/ohana-v802.svg",
    "assets/projects/vortex-readme-dark.svg",
    "assets/projects/customer-health/healthcare-overview.jpg",
    "assets/projects/revops-studio-visual.svg",
    "assets/projects/bodytone-support-visual.svg",
    "assets/projects/cutter-studio-visual.svg"
  ];
  for (const file of expected) {
    assert.ok(fs.existsSync(path.join(root, file)), "Missing README artwork: " + file);
    assert.ok(doc.includes('./' + file), "README does not reference artwork: " + file);
  }
  const images = [...doc.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  assert.equal(images.length, expected.length);
  for (const image of images) {
    const alt = image.match(/\balt="([^"]+)"/i)?.[1];
    const src = image.match(/\bsrc="([^"]+)"/i)?.[1];
    assert.ok(alt && alt.length >= 20, "Missing meaningful alternative text");
    assert.ok(src?.startsWith("./assets/"), "Use local and verified artwork rather than third-party hotlinks");
    assert.ok(image.includes('width="100%"'), "Avoid uneven small images");
  }
});

test("Claims are grounded in documented projects and access is never overstated", () => {
  assert.match(doc, /12 characters, five forms each/);
  assert.match(doc, /seven motion systems, eleven visual presets/);
  assert.match(doc, /rules-based/);
  assert.match(doc, /All customer data and monetary figures are fictitious/);
  assert.match(doc, /sample data/);
  assert.match(doc, /not a public online editor/);
  assert.match(doc, /Private\/local|PRIVATE DEVELOPMENT\/ CREATE|PRIVATE DEVELOPMENT \/ CREATE/i);
  assert.doesNotMatch(doc, /<script\b|<iframe\b|<foreignObject\b/i);
});

test("The project previews are local script-free SVGs with full descriptions", () => {
  for (const file of [
    "assets/readme-cover.svg",
    "assets/projects/ohana-v802.svg",
    "assets/projects/vortex-readme-dark.svg",
    "assets/projects/revops-studio-visual.svg",
    "assets/projects/bodytone-support-visual.svg",
    "assets/projects/cutter-studio-visual.svg"
  ]) {
    const art = fs.readFileSync(file, "utf8");
    assert.match(art, /<svg\b/);
    assert.match(art, /<title(?:\s|>)/);
    assert.match(art, /<desc(?:\s|>)/);
    assert.doesNotMatch(art, /<script\b|<foreignObject\b|<image\b/i);
  }
});
