import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const main = readFileSync(join(root, "index.html"), "utf8");
const notFound = readFileSync(join(root, "404.html"), "utf8");

test("public navigation hashes reference real sections and have unique ids", () => {
  const ids = [...main.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, "Duplicate HTML ids can break deep-linking");
  for (const m of main.matchAll(/<a\b[^>]*\shref="#([^"]+)"/g)) {
    assert.ok(ids.includes(m[1]), `Broken in-page link #${m[1]}`);
  }
});

test("first-party script, CSS, image and iframe sources exist in the published tree", () => {
  const refs = [...main.matchAll(/<(?:a|link|script|img|iframe)\b[^>]*?\s(?:href|src|data-src)="([^"]+)"/g)].map(m => m[1]);
  for (const value of refs) {
    if (value.startsWith("#") || /^(?:https?:|data:|mailto:|tel:)/i.test(value)) continue;
    const url = new URL(value, "https://systems-lab.test/");
    let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!relative || relative.endsWith("/")) relative += "index.html";
    const target = join(root, relative);
    assert.ok(existsSync(target) && statSync(target).isFile(), `Missing first-party resource: ${value}`);
  }
});

test("404 supports nested paths without third-party fonts or relative home links", () => {
  assert.match(notFound, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(notFound, /href="https:\/\/gracianb\.github\.io\/systems-lab\/"/);
  assert.doesNotMatch(notFound, /fonts\.googleapis|fonts\.gstatic|<script|<link rel="stylesheet"/i);
  assert.match(notFound, /prefers-color-scheme: light/);
  assert.match(notFound, /lang="en"/);
});
