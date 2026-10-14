import fs from 'fs/promises';
import path from 'path';
import { db } from '../lib/database.js';

const root = path.resolve();
const migrations = [
  ['blog-post-1.html', '10-things-to-taste-in-colombo.html'],
  ['blog-post-2.html', 'a-slow-12-day-sri-lanka-loop.html'],
  ['blog-post-3.html', 'how-to-do-yala-responsibly.html'],
  ['blog-post-4.html', 'booking-the-kandy-ella-train.html'],
  ['blog-post-5.html', '24-hours-in-galle-fort.html'],
  ['blog-post-6.html', 'being-a-respectful-guest-in-tea-country.html'],
];

for (const [oldName, newName] of migrations) {
  const oldPath = path.join(root, oldName);
  const newPath = path.join(root, newName);
  try {
    await fs.access(newPath);
  } catch {
    await fs.rename(oldPath, newPath);
  }
  let html = await fs.readFile(newPath, 'utf8');
  html = html.replaceAll(oldName, newName);
  await fs.writeFile(newPath, html, 'utf8');
}

const updatePost = db.prepare('UPDATE blog_posts SET url = ? WHERE url = ?');
db.transaction(() => {
  migrations.forEach(([oldName, newName]) => updatePost.run(newName, oldName));
})();

for (const fileName of ['sitemap.xml', 'scripts/browser-check.js', 'scripts/clean-content.js']) {
  const filePath = path.join(root, fileName);
  let content = await fs.readFile(filePath, 'utf8');
  migrations.forEach(([oldName, newName]) => { content = content.replaceAll(oldName, newName); });
  await fs.writeFile(filePath, content, 'utf8');
}

console.log(`Migrated ${migrations.length} blog article URLs to title-based slugs.`);
