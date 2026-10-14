import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const token = String(process.env.GOOGLE_SITE_VERIFICATION || '').trim();
if (!/^[a-zA-Z0-9_-]{10,200}$/.test(token)) {
  console.error('Set GOOGLE_SITE_VERIFICATION in .env to the token supplied by Google Search Console.');
  process.exit(1);
}

const root = path.resolve();
const files = (await fs.readdir(root)).filter((name) => name.endsWith('.html') && !['admin.html', '404.html'].includes(name));
for (const fileName of files) {
  const filePath = path.join(root, fileName);
  let html = await fs.readFile(filePath, 'utf8');
  const tag = `<meta name="google-site-verification" content="${token}" />`;
  if (/<meta name="google-site-verification"[^>]*>/i.test(html)) html = html.replace(/<meta name="google-site-verification"[^>]*>/i, tag);
  else html = html.replace('</head>', `  ${tag}\n</head>`);
  await fs.writeFile(filePath, html, 'utf8');
}
console.log(`Search verification added to ${files.length} public pages.`);
