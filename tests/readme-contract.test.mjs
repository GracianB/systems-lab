import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const doc=fs.readFileSync('README.md','utf8');
test('README is a concise front page with real entry points and accurate product status',()=>{
  assert.ok(doc.length<7000,'Readme became a changelog');
  for(const pathName of ['assets/readme-cover.svg','assets/projects/ohana.webp','assets/projects/vortex-readme-dark.svg','assets/projects/customer-ops.svg','assets/aigoritmo/arcana-poster.jpg','assets/aigoritmo/qwen-poster.jpg','docs/ARCHITECTURE.md','docs/QUALITY_AND_BOUNDARIES.md','docs/RELEASES.md','docs/GITHUB_CONFIGURATION.md']){
    assert.ok(fs.existsSync(path.join(root,pathName)), 'Missing README asset/link: '+pathName);
  }
  assert.match(doc,/privada y local/);
  assert.match(doc,/datos ficticios/);
  assert.doesNotMatch(doc,/127\.0\.0\.1:8001|https:\/\/github\.com\/GracianB\/aigoritmo/);
  assert.match(doc,/github\.io\/systems-lab/);
});


test('README gallery renders valid HTML and references existing artwork',()=>{
  const tables=[...doc.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map(match=>match[0]);
  assert.equal(tables.length,2,'Expected two project gallery tables');
  for(const table of tables){
    assert.doesNotMatch(table,/^\s*#{1,6}\s/m,'Markdown headings will not render inside HTML tables');
    assert.match(table,/<h3>\s*<a\b/i,'Use HTML heading links inside table cells');
    assert.match(table,/<p>\s*<strong>/i,'Use HTML descriptions inside table cells');
  }
  const images=[...doc.matchAll(/<img\b[^>]*>/gi)].map(match=>match[0]);
  assert.ok(images.length>=5,'Expected hero and all four project previews');
  for(const tag of images){
    const src=tag.match(/\bsrc="([^"]+)"/i)?.[1];
    const alt=tag.match(/\balt="([^"]+)"/i)?.[1];
    assert.ok(alt && alt.trim().length>=12,'Missing descriptive image alt: '+tag);
    if(src && src.startsWith('./')){
      assert.ok(fs.existsSync(path.join(root,src.slice(2))),'Missing local image: '+src);
    }
  }
});

test('README uses dark showcase art for Vórtice and Customer Ops',()=>{
  assert.match(doc,/assets\/projects\/vortex-readme-dark\.svg/);
  assert.match(doc,/assets\/projects\/customer-ops\.svg/);
  assert.doesNotMatch(doc,/vortex-cover-light\.svg/,'The README must use the dark Vórtice edition');
  for(const name of ['vortex-readme-dark.svg','customer-ops.svg']){
    const art=fs.readFileSync(path.join(root,'assets/projects',name),'utf8');
    assert.match(art,/<svg\b/);
    assert.match(art,/<title\b[^>]*>/);
    assert.match(art,/<desc\b[^>]*>/);
    assert.match(art,/#0[0-9a-f]{5}/i,'Dark ink should be present in both covers');
    assert.doesNotMatch(art,/<script\b|<foreignObject\b|<image\b/i,'README SVGs must be standalone, script-free vectors');
  }
});
