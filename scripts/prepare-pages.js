import fs from 'fs/promises';
import path from 'path';

const rootDir = path.resolve();
const siteUrl = (process.env.SITE_URL || 'https://tuskersedge.com').replace(/\/$/, '');
const files = (await fs.readdir(rootDir)).filter((name) => name.endsWith('.html'));

function attributeText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

for (const fileName of files) {
  const filePath = path.join(rootDir, fileName);
  let html = await fs.readFile(filePath, 'utf8');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'TuskersEdge').trim();
  const description = fileName === 'admin.html'
    ? 'TuskersEdge administration dashboard.'
    : `Explore ${title.replace(/\s*\|\s*TuskersEdge.*$/i, '')} with TuskersEdge, local Sri Lanka travel designers.`;

  if (!/<meta\s+name=["']description["']/i.test(html)) {
    html = html.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, `$1\n    <meta name="description" content="${attributeText(description)}" />`);
  }

  if (fileName === 'admin.html' || fileName === '404.html') {
    if (!/<meta\s+name=["']robots["']/i.test(html)) {
      html = html.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, '$1\n    <meta name="robots" content="noindex, nofollow" />');
    }
  } else {
    const pageUrl = fileName === 'index.html' ? `${siteUrl}/` : `${siteUrl}/${fileName}`;
    const metaDescription = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)/i)?.[1] || description;
    const socialMeta = `
    <link rel="canonical" href="${pageUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${attributeText(title)}" />
    <meta property="og:description" content="${attributeText(metaDescription)}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:image" content="${siteUrl}/Nine-Arch-Bridge-Ella-1920x800-1.webp" />
    <meta name="twitter:card" content="summary_large_image" />`;
    if (!/<link\s+rel=["']canonical["']/i.test(html)) html = html.replace(/<\/head>/i, `${socialMeta}\n  </head>`);
  }

  if (/All rights reserved/i.test(html) && !/Privacy Policy<\/a>/.test(html)) {
    html = html.replace(
      /([ \t]*)(?:\(c\)|&copy;)\s*<span id="year-span"><\/span> TuskersEdge\. All rights reserved\./i,
      `$1<span class="mr-3"><a href="privacy.html" class="hover:text-jungleLight">Privacy Policy</a> &middot; <a href="terms.html" class="hover:text-jungleLight">Terms</a></span>\n$1&copy; <span id="year-span"></span> TuskersEdge. All rights reserved.`
    );
  }

  await fs.writeFile(filePath, html, 'utf8');
}

console.log(`Prepared metadata and legal links for ${files.length} pages.`);
