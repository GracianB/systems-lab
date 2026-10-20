import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync, statSync } from 'node:fs';
rmSync('dist', { recursive:true, force:true }); mkdirSync('dist');
for (const file of ['index.html','404.html','main.js','boot.js','cover-canvas.js','i18n.js','styles.css','experience-navigator.css','experience-navigator.js','favicon.svg','og-cover.svg','og-cover.png','robots.txt','sitemap.xml']) cpSync(file, `dist/${file}`);
mkdirSync('dist/assets', { recursive:true });
cpSync('assets/cover-wand.svg', 'dist/assets/cover-wand.svg');
cpSync('assets/projects', 'dist/assets/projects', { recursive:true });
mkdirSync('dist/assets/aigoritmo', { recursive:true });
for (const file of ['llama-poster.jpg','qwen-poster.jpg','arcana-poster.jpg','arcano-poster.jpg']) cpSync(`assets/aigoritmo/${file}`, `dist/assets/aigoritmo/${file}`);
mkdirSync('dist/bodytone-chatbot/frontend', { recursive:true });
for (const file of ['index.html','demo.js','demo.css']) cpSync(`bodytone-chatbot/frontend/${file}`, `dist/bodytone-chatbot/frontend/${file}`);
writeFileSync('dist/.nojekyll','');
// Fail the build, rather than publishing a page with missing first-party assets.
const html = readFileSync('dist/index.html','utf8');
const refs = [...html.matchAll(/<(?:a|link|script|img|iframe)\b[^>]*?\s(?:href|src|data-src)="([^"]+)"/g)].map(m=>m[1]);
for (const value of refs) {
  if (value.startsWith('#') || /^(?:https?:|mailto:|tel:|data:)/i.test(value)) continue;
  const url = new URL(value,'https://systems-lab.example/');
  let path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!path || path.endsWith('/')) path += 'index.html';
  const target = 'dist/' + path;
  if (!existsSync(target) || !statSync(target).isFile()) throw new Error('Missing published asset: ' + value);
}
console.log('Built and verified public assets only: dist/ (' + refs.length + ' references checked)');
