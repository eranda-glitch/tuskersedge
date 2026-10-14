import fs from 'fs/promises';
import path from 'path';

const rootDir = path.resolve();
const files = (await fs.readdir(rootDir)).filter((name) => name.endsWith('.html'));
const errors = [];
const warnings = [];

for (const fileName of files) {
  const html = await fs.readFile(path.join(rootDir, fileName), 'utf8');
  if (/Ã|Â|â|ï¿½|ðŸ/.test(html)) errors.push(`${fileName}: contains corrupted text encoding`);

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${fileName}: duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}`);

  if (fileName !== 'admin.html' && fileName !== '404.html' && !/<h1\b/i.test(html)) warnings.push(`${fileName}: no H1 heading`);
  if (!/<meta\s+name=["']description["']/i.test(html)) warnings.push(`${fileName}: no meta description`);
  if (!/<link\s+rel=["']icon["']/i.test(html)) warnings.push(`${fileName}: no favicon`);
  if (!['admin.html', '404.html', 'offline.html'].includes(fileName)) {
    if (!/<link\s+rel=["']canonical["']/i.test(html)) warnings.push(`${fileName}: no canonical URL`);
    if (!/<meta\s+property=["']og:image["']/i.test(html)) warnings.push(`${fileName}: no social sharing image`);
    if (!/<meta\s+name=["']twitter:image["']/i.test(html)) warnings.push(`${fileName}: no Twitter sharing image`);
    if (!/<script\s+type=["']application\/ld\+json["']/i.test(html)) warnings.push(`${fileName}: no structured data`);
  }

  const references = [
    ...[...html.matchAll(/(?:href|src)=["']([^"'#]+)["']/gi)].map((match) => match[1]),
    ...[...html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)].map((match) => match[1]),
  ];

  for (const reference of references) {
    if (reference.includes('${')) continue;
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference)) continue;
    if (reference.startsWith('/api/')) continue;
    const cleanReference = reference.split('?')[0];
    const target = cleanReference.startsWith('/')
      ? path.join(rootDir, cleanReference.slice(1))
      : path.resolve(rootDir, cleanReference);
    try { await fs.access(target); }
    catch { errors.push(`${fileName}: missing local reference ${reference}`); }
  }
}

warnings.forEach((warning) => console.warn(`WARN ${warning}`));
errors.forEach((error) => console.error(`ERROR ${error}`));
console.log(`Checked ${files.length} HTML files: ${errors.length} errors, ${warnings.length} warnings.`);
if (errors.length) process.exitCode = 1;
