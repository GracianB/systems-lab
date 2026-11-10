import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const i18n=readFileSync(new URL("../i18n.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const readme=readFileSync(new URL("../README.md",import.meta.url),"utf8");

test("Lab door availability is explicit and bilingual",()=>{
  assert.match(html,/class="lab-proof-legend"/);
  assert.equal((html.match(/class="lab-legend-marker /g)||[]).length,3);
  for(const key of ["labProofLegendAria","labLegendPlayable","labLegendShowcase","labLegendCase"]){
    assert.equal((i18n.match(new RegExp("\\b"+key+":","g"))||[]).length,2,key);
  }
  assert.match(css,/prefers-reduced-motion/);
});
test("The GitHub README is a visitor showroom with honest boundaries",()=>{
  for(const value of ["PROJECT OHANA","VØRTICE","AIGORITMO","CUSTOMER OPERATIONS","Professional Deck","Yoga Instructor"])
    assert.ok(readme.includes(value),value);
  assert.match(readme.replace(/<[^>]+>/g,""),/not an online chat/);
  assert.match(readme,/fictional data/);
  assert.doesNotMatch(readme,/npm run check|Version V2|CHANGELOG.md|Tools directory/);
});
