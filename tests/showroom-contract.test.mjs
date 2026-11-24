import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const i18n=readFileSync(new URL("../i18n.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const readme=readFileSync(new URL("../README.md",import.meta.url),"utf8");

test("The hero is clear and product states live in the cards",()=>{
  assert.doesNotMatch(html,/class="lab-proof-legend"/);
  assert.doesNotMatch(css,/\\.lab-proof-legend/);
  assert.equal((html.match(/<article class="product-tile/g)||[]).length,7);
  for(const label of ["data-product-status=\"public\"","data-product-status=\"protected\"","data-product-status=\"private\""]) assert.ok(html.includes(label),label);
  assert.match(html,/assets\\/projects\\/ohana-v802\\.svg/);
  assert.doesNotMatch(html,/gurusup/i);
  assert.doesNotMatch(readme,/gurusup/i);
});
test("The GitHub README is a visitor showroom with honest boundaries",()=>{
  for(const value of ["PROJECT OHANA","VØRTICE","AIGORITMO","CUSTOMER OPERATIONS","Professional Deck","Yoga Instructor"])
    assert.ok(readme.includes(value),value);
  assert.match(readme.replace(/<[^>]+>/g,""),/not an online chat/);
  assert.match(readme,/fictional data/);
  assert.doesNotMatch(readme,/npm run check|Version V2|CHANGELOG.md|Tools directory/);
});
