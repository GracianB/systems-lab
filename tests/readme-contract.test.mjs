import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const doc=fs.readFileSync('README.md','utf8');
test('README is a concise front page with real entry points and accurate product status',()=>{
  assert.ok(doc.length<7000,'Readme became a changelog');
  for(const pathName of ['assets/readme-cover.svg','assets/projects/ohana.webp','assets/projects/vortex-cover-light.svg','assets/aigoritmo/arcana-poster.jpg','assets/aigoritmo/qwen-poster.jpg','docs/ARCHITECTURE.md','docs/QUALITY_AND_BOUNDARIES.md','docs/RELEASES.md']){
    assert.ok(fs.existsSync(path.join(root,pathName)), 'Missing README asset/link: '+pathName);
  }
  assert.match(doc,/privada y local/);
  assert.match(doc,/datos ficticios/);
  assert.doesNotMatch(doc,/127\.0\.0\.1:8001|https:\/\/github\.com\/GracianB\/aigoritmo/);
  assert.match(doc,/github\.io\/systems-lab/);
});
