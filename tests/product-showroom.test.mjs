import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";

const html=readFileSync("index.html","utf8");
const js=readFileSync("product-showroom.js","utf8");
const css=readFileSync("product-showroom.css","utf8");
const locale=readFileSync("i18n.js","utf8");

test("product showroom ships eight distinct product cards",()=>{
  assert.equal((html.match(/<article class="product-tile/g)||[]).length,8);
  for(const id of ["products","juegos","vortex-live","aigoritmo","cs"]) assert.ok(html.includes('id="'+id+'"'),id);
  for(const status of ["protected","public","demo","prototype","case","private"]) assert.ok(html.includes('data-product-status="'+status+'"'),status);
});

test("no private source URLs or false public paid service",()=>{
  assert.ok(!/href=["']https:\/\/github.com\/GracianB\/(?:cutter-studio|aigoritmo)["']/i.test(html));
  assert.ok(html.includes('href="https://aigoritmo-universe-lab-gracianbs-projects.vercel.app/"'));
  assert.ok(html.includes("API de pago desactivada"));
  assert.ok(html.includes("DEMO · DATOS FICTICIOS"));
});

test("search enhancement compiles and static content remains present",()=>{
  assert.doesNotThrow(()=>new Script(js));
  assert.ok(js.includes('card.hidden=!match'));
  assert.ok(js.includes('aria-pressed'));
  assert.ok(js.includes('replace(/[\\u0300-\\u036f]/g'));
  assert.ok(html.includes('data-product-search'));
  assert.ok(css.includes("@media(max-width:620px)"));
  assert.ok(css.includes("prefers-reduced-motion:reduce"));
});

test("product copy is translated in both locales",()=>{
  const keys=[...html.matchAll(/data-i18n="(products[A-Za-z0-9]+)"/g)].map(m=>m[1]);
  assert.ok(keys.length>=35,keys.length+" translated fields");
  for(const key of new Set(keys)){
    const occurrences=(locale.match(new RegExp("\\b"+key+":","g"))||[]).length;
    assert.equal(occurrences,2,key+" must exist in ES and EN");
  }
});
