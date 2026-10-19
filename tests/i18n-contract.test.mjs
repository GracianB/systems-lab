import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

test("each locale translates all HTML keys, with no retired keys", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const code = fs.readFileSync("i18n.js", "utf8");
  const box = { window: {} };
  vm.runInNewContext(code, box, { timeout: 1000 });
  const dictionary = box.window.LAB_I18N;
  const used = new Set([...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map(m => m[1]));
  for (const language of ["es", "en"]) {
    const translated = dictionary[language];
    assert.ok(translated, `locale missing: ${language}`);
    for (const key of used) assert.equal(typeof translated[key], "string", `${language} missing ${key}`);
    for (const key of Object.keys(translated)) assert.ok(used.has(key) || ["htmlLang","title"].includes(key), `${language} retired: ${key}`);
  }
});
