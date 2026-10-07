import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
rmSync('dist', { recursive:true, force:true }); mkdirSync('dist');
for (const file of ['index.html','404.html','main.js','boot.js','i18n.js','styles.css','favicon.svg','robots.txt','sitemap.xml']) cpSync(file, `dist/${file}`);
mkdirSync('dist/bodytone-chatbot/frontend', { recursive:true });
for (const file of ['index.html','demo.js','demo.css']) cpSync(`bodytone-chatbot/frontend/${file}`, `dist/bodytone-chatbot/frontend/${file}`);
writeFileSync('dist/.nojekyll','');
console.log('Built public assets only: dist/');
