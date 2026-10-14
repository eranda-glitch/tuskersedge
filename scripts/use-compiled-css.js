import fs from 'fs/promises';
import path from 'path';

const rootDir = path.resolve();
const files = (await fs.readdir(rootDir)).filter((name) => name.endsWith('.html'));
const configuredCdn = /\s*<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["']><\/script>\s*<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?<\/script>/gi;
const plainCdn = /\s*<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["']><\/script>/gi;

for (const fileName of files) {
  const filePath = path.join(rootDir, fileName);
  let html = await fs.readFile(filePath, 'utf8');
  html = html.replace(configuredCdn, '\n    <link rel="stylesheet" href="css/site.css" />');
  html = html.replace(plainCdn, '\n    <link rel="stylesheet" href="css/site.css" />');
  await fs.writeFile(filePath, html, 'utf8');
}

console.log(`Switched ${files.length} pages to compiled CSS.`);
