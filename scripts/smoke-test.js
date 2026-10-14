import dotenv from 'dotenv';

dotenv.config();
const baseUrl = String(process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
const pages = ['/', '/tours.html', '/gallery.html', '/blog.html', '/about.html', '/contact.html', '/feedback.html', '/faq.html', '/privacy.html', '/terms.html', '/image-credits.html'];
const failures = [];

for (const page of pages) {
  const response = await fetch(`${baseUrl}${page}`);
  if (!response.ok) failures.push(`${page}: HTTP ${response.status}`);
}

const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
if (!health.ok || health.database !== 'sqlite') failures.push('Health endpoint is not reporting SQLite ready.');

const content = await fetch(`${baseUrl}/api/content`).then((response) => response.json());
if (!content.ok || !content.content) failures.push('Public content API failed.');

const privateData = await fetch(`${baseUrl}/data/tuskersedge.db`);
if (privateData.status !== 404) failures.push(`Private database returned HTTP ${privateData.status}, expected 404.`);

if (process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) {
  const login = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.ADMIN_USER, password: process.env.ADMIN_PASSWORD }),
  });
  if (!login.ok) failures.push(`Admin login smoke test returned HTTP ${login.status}.`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}
console.log(`Smoke test passed for ${pages.length} pages, APIs, admin login, and private-file blocking.`);
