import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("Systems Lab has a distinct deployable 1200x630 PNG social card", () => {
  const html=readFileSync("index.html","utf8");
  const build=readFileSync("tools/build.mjs","utf8");
  const png=readFileSync("og-cover.png");
  assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16),1200);
  assert.equal(png.readUInt32BE(20),630);
  assert.ok(html.includes("https://gracianb.github.io/systems-lab/og-cover.png?v=1"), "Social image URL must be portfolio-specific");
  assert.match(html,/summary_large_image/);
  assert.ok(build.includes("'og-cover.png'"), "explicit dist copy required");
});
