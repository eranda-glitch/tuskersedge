import fs from 'fs/promises';
import path from 'path';
import iconv from 'iconv-lite';
import { db } from '../lib/database.js';

const rootDir = path.resolve();
const backupDir = path.join(rootDir, 'backups', `encoding-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await fs.mkdir(backupDir, { recursive: true });

function corruptionScore(value) {
  return (String(value).match(/Ã|Â|â|ï¿½|ðŸ/g) || []).length;
}

function repair(value) {
  let result = String(value ?? '');
  for (let pass = 0; pass < 3 && corruptionScore(result) > 0; pass += 1) {
    const candidate = iconv.decode(iconv.encode(result, 'win1252'), 'utf8');
    if (corruptionScore(candidate) >= corruptionScore(result)) break;
    result = candidate;
  }
  return result
    .replace(/\uFFFD/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/-\?/g, '-')
    .replace(/·/g, ' - ')
    .replace(/©/g, '&copy;')
    .replace(/•/g, '&bull;')
    .replace(/\s+-\s+/g, ' - ');
}

const htmlFiles = (await fs.readdir(rootDir)).filter((name) => name.endsWith('.html'));
for (const name of htmlFiles) {
  const source = path.join(rootDir, name);
  const original = await fs.readFile(source, 'utf8');
  const normalized = repair(original);
  if (normalized !== original) {
    await fs.copyFile(source, path.join(backupDir, name));
    await fs.writeFile(source, normalized, 'utf8');
  }
}

const tableColumns = {
  tours: ['title', 'duration', 'type', 'description', 'price', 'image'],
  gallery_images: ['label', 'category', 'src'],
  blog_posts: ['title', 'category', 'url', 'image', 'read_time', 'excerpt', 'content_html'],
  district_guides: ['district_name', 'intro', 'climate', 'best_time', 'highlights', 'places', 'image', 'content_html'],
  social_videos: ['title', 'url', 'video_id'],
};

db.transaction(() => {
  for (const [table, columns] of Object.entries(tableColumns)) {
    const rows = db.prepare(`SELECT rowid, ${columns.join(', ')} FROM ${table}`).all();
    const assignments = columns.map((column) => `${column} = @${column}`).join(', ');
    const update = db.prepare(`UPDATE ${table} SET ${assignments} WHERE rowid = @rowid`);
    for (const row of rows) {
      const normalized = { rowid: row.rowid };
      columns.forEach((column) => { normalized[column] = repair(row[column]); });
      update.run(normalized);
    }
  }
})();

db.close();
console.log(`Encoding normalized. Original HTML backups: ${backupDir}`);
