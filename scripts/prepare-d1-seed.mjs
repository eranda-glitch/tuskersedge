import fs from 'node:fs/promises';

const content = JSON.parse(await fs.readFile(new URL('../data/content.json', import.meta.url), 'utf8'));
const sql = `INSERT INTO app_state (key, value) VALUES ('content', ${JSON.stringify(JSON.stringify(content))})
ON CONFLICT(key) DO UPDATE SET value=excluded.value;\n`;
await fs.writeFile(new URL('../d1-seed.sql', import.meta.url), sql, 'utf8');
console.log('Wrote d1-seed.sql. Run: npx wrangler d1 execute tuskersedge --remote --file=d1-seed.sql');
