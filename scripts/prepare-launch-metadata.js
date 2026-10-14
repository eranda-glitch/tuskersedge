import fs from 'fs/promises';
import path from 'path';

const root = path.resolve();
const siteUrl = 'https://tuskersedge.com';
const excluded = new Set(['admin.html', '404.html', 'offline.html']);
const socialImage = `${siteUrl}/assets/tuskersedge-social-card.webp`;

const files = (await fs.readdir(root)).filter((name) => name.endsWith('.html'));
for (const fileName of files) {
  const filePath = path.join(root, fileName);
  let html = (await fs.readFile(filePath, 'utf8')).replace(/\r\n/g, '\n');

  if (!html.includes('assets/favicon.svg')) {
    html = html.replace('</head>', `  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="manifest" href="site.webmanifest" />
  <meta name="theme-color" content="#064e3b" />
</head>`);
  }

  if (!html.includes('apple-touch-icon')) {
    html = html.replace('</head>', `  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="TuskersEdge" />
</head>`);
  }

  if (!excluded.has(fileName)) {
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || 'TuskersEdge';
    const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || 'Curated Sri Lanka journeys with TuskersEdge.';
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] || `${siteUrl}/${fileName === 'index.html' ? '' : fileName}`;
    const image = socialImage;
    html = html.replace(/https:\/\/tuskersedge\.com\/(?:images\/\d+\.jpeg|Nine-Arch-Bridge-Ella-1920x800-1\.webp)/g, image);
    html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${image}" />`);
    if (!html.includes('property="og:image:alt"')) html = html.replace(/<meta property="og:image"[^>]*>/i, `$&
    <meta property="og:image:alt" content="Sri Lanka travel with TuskersEdge" />`);
    if (!html.includes('name="twitter:title"')) html = html.replace(/<meta name="twitter:card"[^>]*>/i, `$&
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${image}" />`);

    if (!html.includes('"@type":"TravelAgency"')) {
      const schema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TravelAgency', '@id': `${siteUrl}/#organization`, name: 'TuskersEdge', url: siteUrl,
            logo: `${siteUrl}/assets/brand-mark.svg`, image: socialImage,
            email: 'tuskersedgesafari@gmail.com', telephone: '+94729258104', areaServed: { '@type': 'Country', name: 'Sri Lanka' },
            sameAs: ['https://www.booking.com/Pulse-cCBzek', 'https://www.tiktok.com/@nuwa_travels'],
          },
          { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, description, isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': `${siteUrl}/#organization` }, primaryImageOfPage: image },
          { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: siteUrl, name: 'TuskersEdge', publisher: { '@id': `${siteUrl}/#organization` }, inLanguage: 'en' },
        ],
      };
      html = html.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>`);
    }

    if (!html.includes('js/analytics.js')) html = html.replace('</body>', '  <script src="js/analytics.js" defer></script>\n</body>');
    if (!html.includes('js/pwa.js')) html = html.replace('</body>', '  <script src="js/pwa.js" defer></script>\n</body>');
    if (!html.includes('>Image Credits</a>')) {
      html = html.replace(/(<a href="terms\.html"[^>]*>Terms<\/a>)/g, '$1 &middot; <a href="image-credits.html" class="hover:text-jungleLight">Image Credits</a>');
    }
  }

  await fs.writeFile(filePath, html, 'utf8');
}

console.log(`Prepared metadata for ${files.length} HTML files.`);
