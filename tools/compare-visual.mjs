import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const base = process.env.VISUAL_BASE_URL;
const head = process.env.VISUAL_HEAD_URL;
assert.ok(base && head, "Set VISUAL_BASE_URL and VISUAL_HEAD_URL to two local build servers.");
await mkdir("visual-results", { recursive: true });
const browser = await chromium.launch({ headless: true });
const outcomes = [];
let failure;
try {
  for (const width of [390, 1440]) {
    for (const lang of ["es", "en"]) {
      for (const theme of ["dark", "light"]) {
        const id = [width, lang, theme].join("-");
        const context = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 900 },
          deviceScaleFactor: 1, reducedMotion: "reduce"
        });
        const pages = [await context.newPage(), await context.newPage()];
        const urls = [base, head].map(root => root + "/?lang=" + lang + "&theme=" + theme);
        const images = [];
        const measurements = [];
        for (let k = 0; k < pages.length; k++) {
          const page = pages[k];
          const response = await page.goto(urls[k], { waitUntil: "load", timeout: 20_000 });
          assert.equal(response?.status(), 200, id + " page failed: " + urls[k]);
          await page.evaluate(() => document.fonts?.ready);
          const metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
            fullHeight: document.documentElement.scrollHeight,
            heroHeight: Math.round(document.querySelector(".hero")?.getBoundingClientRect().height || 0),
            explorerCount: document.querySelectorAll(".cover-node").length
          }));
          assert.ok(metrics.fullHeight > 100, id + " blank document");
          if (k === 1) {
            assert.ok(metrics.scrollWidth <= width + 1, id + " introduced horizontal overflow");
            assert.equal(metrics.explorerCount, 4, id + " explorer destinations");
          }
          measurements.push(metrics);
          const file = id + (k === 0 ? "-before.png" : "-after.png");
          const png = await page.screenshot({ path: "visual-results/" + file, fullPage: true, animations: "disabled" });
          images.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
        }
        outcomes.push({ id, width, lang, theme, before: images[0], after: images[1],
          pixelFilesDifferent: images[0].sha256 !== images[1].sha256,
          measurements: { before: measurements[0], after: measurements[1] } });
        await context.close();
      }
    }
  }
} catch (error) {
  failure = error;
} finally {
  await browser.close();
}
await writeFile("visual-results/measurements.json", JSON.stringify(outcomes, null, 2));
const cards = outcomes.map(o => '<section class="pair"><h2>' + o.id +
  ' <small>Hero: ' + o.measurements.before.heroHeight + ' → ' + o.measurements.after.heroHeight +
  ' px · full page: ' + o.measurements.before.fullHeight + ' → ' + o.measurements.after.fullHeight +
  ' px</small></h2><div class="pair-grid"><figure><figcaption>Main before</figcaption><img src="' + o.before.file +
  '" alt="Before ' + o.id + '"></figure><figure><figcaption>PR after</figcaption><img src="' + o.after.file +
  '" alt="After ' + o.id + '"></figure></div></section>').join("\n");
const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
 '<title>Systems Lab P30 before / after visual review</title><style>body{margin:0;background:#101720;color:#f0f4fa;font:15px/1.5 system-ui;padding:25px}h1{font-size:26px}p{max-width:75ch}h2{margin-top:38px;font-size:18px}small{font-size:12px;color:#b9c4ce}.pair-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}figure{margin:0}figcaption{padding:8px;background:#202b36}img{display:block;width:100%;height:auto;border:1px solid #43505e}@media(max-width:760px){.pair-grid{grid-template-columns:1fr}}</style>' +
 '<h1>Systems Lab · PR design comparison</h1><p>Actual browser captures at fixed viewports, ES/EN and both themes. Images may have different heights because the design intentionally removes sections. Compare side-by-side before approving the PR. Hash differences alone are not pixel-diff percentages.</p>' + cards + '</html>';
await writeFile("visual-results/index.html", html);
console.log("Visual comparison screenshots:", outcomes.length * 2, "for", outcomes.length, "scenarios");
if (failure) throw failure;
