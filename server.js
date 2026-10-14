import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import sanitizeHtml from 'sanitize-html';
import {
  createSession, db, deleteSession, getContent, getSession, initializeDatabase,
  getAnalyticsSummary, listEnquiries, recordPageView, replaceContent, verifyPassword,
} from './lib/database.js';

dotenv.config();
initializeDatabase();

const app = express();
const rootDir = path.resolve();
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;
const siteUrl = String(process.env.SITE_URL || 'https://tuskersedge.com').replace(/\/$/, '');

if (isProduction && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'admin')) {
  throw new Error('Set a strong ADMIN_PASSWORD before starting in production.');
}

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://www.tiktok.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      frameSrc: ["'self'", 'https://www.tiktok.com'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many messages. Please try again later.' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many login attempts. Please try again later.' },
});
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { ok: false },
});

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, part) => {
    const [key, ...value] = part.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(value.join('='));
    return cookies;
  }, {});
}

function clean(value, maxLength = 2000) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function validEmail(value) {
  return value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugify(value) {
  return clean(value, 160).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'blog-post';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeXml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function cleanRichHtml(value) {
  return sanitizeHtml(String(value || ''), {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'hr', 'span'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'title', 'loading'], '*': ['class'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', alt: attribs.alt || '' } }),
    },
  });
}

function sessionFromRequest(req) {
  const token = parseCookies(req.headers.cookie || '').admin_token || '';
  return { token, session: getSession(token) };
}

function requireAuth(req, res, next) {
  const { token, session } = sessionFromRequest(req);
  if (!session) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  req.adminToken = token;
  req.adminSession = session;
  next();
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const provided = String(req.get('x-csrf-token') || '');
  const expected = String(req.adminSession?.csrf_token || '');
  if (!provided || provided.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return res.status(403).json({ ok: false, error: 'Invalid security token. Refresh and try again.' });
  }
  next();
}

const mailConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD !== 'YOUR_APP_PASSWORD_HERE');
const transporter = mailConfigured ? nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  disableFileAccess: true,
  disableUrlAccess: true,
}) : null;

app.get('/api/health', (req, res) => res.json({ ok: true, database: 'sqlite', emailConfigured: mailConfigured }));

app.get('/sitemap.xml', (req, res) => {
  const staticPages = [
    ['', '1.0', 'weekly'], ['tours.html', '0.9', 'weekly'], ['gallery.html', '0.8', 'weekly'],
    ['blog.html', '0.8', 'weekly'], ['about.html', '0.7', 'monthly'], ['faq.html', '0.7', 'monthly'],
    ['contact.html', '0.8', 'monthly'], ['feedback.html', '0.7', 'weekly'],
    ['privacy.html', '0.3', 'yearly'], ['terms.html', '0.3', 'yearly'],
    ['image-credits.html', '0.2', 'yearly'],
  ];
  const publishedPosts = getContent().blog
    .filter((post) => post.published && /^[a-zA-Z0-9_-]+\.html$/.test(post.url || ''))
    .map((post) => [post.url, post.featured ? '0.8' : '0.6', 'monthly']);
  const uniquePages = Array.from(new Map([...staticPages, ...publishedPosts].map((page) => [page[0], page])).values());
  const urls = uniquePages.map(([pagePath, priority, changefreq]) =>
    `  <url><loc>${escapeXml(`${siteUrl}/${pagePath}`)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
  ).join('\n');
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

const legacyBlogRedirects = {
  '/blog-post-1.html': '/10-things-to-taste-in-colombo.html',
  '/blog-post-2.html': '/a-slow-12-day-sri-lanka-loop.html',
  '/blog-post-3.html': '/how-to-do-yala-responsibly.html',
  '/blog-post-4.html': '/booking-the-kandy-ella-train.html',
  '/blog-post-5.html': '/24-hours-in-galle-fort.html',
  '/blog-post-6.html': '/being-a-respectful-guest-in-tea-country.html',
  '/blog-post-1.htm': '/10-things-to-taste-in-colombo.html',
  '/blog-post-2.htm': '/a-slow-12-day-sri-lanka-loop.html',
  '/blog-post-3.htm': '/how-to-do-yala-responsibly.html',
  '/blog-post-4.htm': '/booking-the-kandy-ella-train.html',
  '/blog-post-5.htm': '/24-hours-in-galle-fort.html',
  '/blog-post-6.htm': '/being-a-respectful-guest-in-tea-country.html',
};
app.get(Object.keys(legacyBlogRedirects), (req, res) => res.redirect(301, legacyBlogRedirects[req.path]));

app.get('/api/content', (req, res) => {
  const content = getContent();
  content.blog = content.blog.filter((post) => post.published);
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({ ok: true, content });
});

app.post('/api/analytics/pageview', analyticsLimiter, (req, res) => {
  const pagePath = clean(req.body?.path, 160).split('?')[0];
  if (!/^\/[a-zA-Z0-9/_-]*(?:\.html)?$/.test(pagePath) || pagePath.includes('admin')) {
    return res.status(400).json({ ok: false });
  }
  recordPageView(pagePath || '/');
  res.status(204).end();
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const body = req.body || {};
  if (clean(body.website, 200)) return res.status(201).json({ ok: true, message: 'Your enquiry has been received.' });
  if (body.privacyConsent !== 'yes') return res.status(400).json({ ok: false, error: 'Please accept the Privacy Policy.' });
  const enquiry = {
    id: crypto.randomUUID(),
    name: clean(body.name || `${clean(body.firstName, 80)} ${clean(body.lastName, 80)}`, 160),
    email: clean(body.email || body.contact, 254),
    phone: clean(body.phone || body.whatsapp, 60),
    month: clean(body.travelDate || body.month || body.preferredMonth, 80),
    nights: clean(body.nights || body.tripLength, 40),
    travelers: clean(body.travelers, 120),
    budget: clean(body.budget, 120),
    interests: clean(body.interests || body.message, 1500),
    details: clean(body.details || body.notes, 4000),
    source: clean(body.source || 'website', 120),
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  if (!enquiry.name || (!enquiry.email && !enquiry.phone)) return res.status(400).json({ ok: false, error: 'Name and email or phone are required.' });
  if (!validEmail(enquiry.email)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });

  db.prepare(`INSERT INTO enquiries
    (id,name,email,phone,month,nights,travelers,budget,interests,details,source,status,created_at)
    VALUES (@id,@name,@email,@phone,@month,@nights,@travelers,@budget,@interests,@details,@source,@status,@createdAt)`
  ).run(enquiry);

  if (transporter) {
    const lines = [
      `Name: ${enquiry.name}`, `Email: ${enquiry.email}`, `Phone/WhatsApp: ${enquiry.phone}`,
      `Preferred travel date: ${enquiry.month}`, `Nights: ${enquiry.nights}`, `Travelers: ${enquiry.travelers}`,
      `Budget: ${enquiry.budget}`, `Interests: ${enquiry.interests}`, `Details: ${enquiry.details}`,
      `Source: ${enquiry.source}`, `Timestamp: ${enquiry.createdAt}`,
    ];
    transporter.sendMail({
      from: `TuskersEdge <${process.env.GMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.GMAIL_USER,
      replyTo: validEmail(enquiry.email) ? enquiry.email : undefined,
      subject: `New website enquiry from ${enquiry.name}`,
      text: lines.join('\n'),
    }).catch((error) => console.error('Email notification failed:', error.message));
  }
  res.status(201).json({ ok: true, message: 'Your enquiry has been received.' });
});

app.post('/api/login', loginLimiter, (req, res) => {
  const username = clean(req.body?.username, 100);
  const password = String(req.body?.password || '');
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !verifyPassword(password, admin.password_hash, admin.password_salt)) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }
  const session = createSession(admin.id);
  res.cookie('admin_token', session.token, { httpOnly: true, secure: isProduction, sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000, path: '/' });
  res.json({ ok: true, csrfToken: session.csrfToken, username: admin.username });
});

app.get('/api/session', (req, res) => {
  const { session } = sessionFromRequest(req);
  res.json({ ok: true, authenticated: Boolean(session), csrfToken: session?.csrf_token || '', username: session?.username || '' });
});

app.post('/api/logout', requireAuth, requireCsrf, (req, res) => {
  deleteSession(req.adminToken);
  res.clearCookie('admin_token', { path: '/' });
  res.json({ ok: true });
});

app.use('/api/admin', requireAuth, requireCsrf);
app.get('/api/admin/content', (req, res) => res.json({ ok: true, content: getContent() }));

app.put('/api/admin/content', (req, res) => {
  const content = req.body && typeof req.body === 'object' ? req.body : {};
  if (Array.isArray(content.blog)) content.blog = content.blog.map((post) => ({ ...post, title: clean(post.title, 180), excerpt: clean(post.excerpt, 600), contentHtml: cleanRichHtml(post.contentHtml) }));
  if (content.districtGuides && typeof content.districtGuides === 'object') {
    Object.values(content.districtGuides).forEach((guide) => { guide.articleHtml = cleanRichHtml(guide.articleHtml); });
  }
  replaceContent(content);
  res.json({ ok: true });
});

app.get('/api/admin/messages', (req, res) => res.json({ ok: true, messages: listEnquiries() }));
app.get('/api/admin/analytics', (req, res) => res.json({ ok: true, analytics: getAnalyticsSummary(30) }));
app.post('/api/admin/messages/mark-read', (req, res) => { db.prepare("UPDATE enquiries SET status='read'").run(); res.json({ ok: true }); });
app.post('/api/admin/messages/:id/read', (req, res) => { db.prepare("UPDATE enquiries SET status='read' WHERE id=?").run(req.params.id); res.json({ ok: true }); });
app.delete('/api/admin/messages/:id', (req, res) => { db.prepare('DELETE FROM enquiries WHERE id=?').run(req.params.id); res.json({ ok: true }); });

app.get('/api/admin/backup', (req, res) => {
  res.setHeader('Content-Disposition', `attachment; filename="tuskersedge-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ exportedAt: new Date().toISOString(), content: getContent(), enquiries: listEnquiries(), analytics: getAnalyticsSummary(30) });
});

app.post('/api/admin/upload-image', async (req, res) => {
  const fileName = clean(req.body?.fileName || 'upload', 180);
  const dataUrl = String(req.body?.dataUrl || '');
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return res.status(400).json({ ok: false, error: 'Only JPG, PNG and WebP images are accepted.' });
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) return res.status(400).json({ ok: false, error: 'Image must be smaller than 5 MB.' });
  const signatures = {
    'image/jpeg': bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    'image/png': bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP',
  };
  if (!signatures[match[1]]) return res.status(400).json({ ok: false, error: 'Image content does not match its type.' });
  const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const uniqueName = `${slugify(path.basename(fileName, path.extname(fileName)))}-${crypto.randomUUID()}${extensions[match[1]]}`;
  await fs.writeFile(path.join(rootDir, 'images', uniqueName), bytes, { flag: 'wx' });
  res.status(201).json({ ok: true, path: `images/${uniqueName}` });
});

app.post('/api/admin/blog/publish', async (req, res) => {
  const title = clean(req.body?.title, 180);
  const category = clean(req.body?.category || 'General', 80);
  const readTime = clean(req.body?.readTime || '5 min read', 40);
  const excerpt = clean(req.body?.excerpt || 'Read the full article for travel notes and practical tips.', 600);
  const image = clean(req.body?.image || 'images/1.jpeg', 500);
  const existingUrl = clean(req.body?.existingUrl, 180);
  const safeContent = cleanRichHtml(req.body?.contentHtml) || `<p>${escapeHtml(excerpt)}</p>`;
  if (!title) return res.status(400).json({ ok: false, error: 'Title is required.' });

  let fileName = existingUrl && /^[a-zA-Z0-9_-]+\.html$/.test(existingUrl) ? existingUrl : `${slugify(title)}.html`;
  let filePath = path.join(rootDir, fileName);
  if (!existingUrl) {
    let counter = 2;
    while (true) {
      try { await fs.access(filePath); fileName = `${slugify(title)}-${counter++}.html`; filePath = path.join(rootDir, fileName); }
      catch { break; }
    }
  }
  const canonical = `${siteUrl}/${fileName}`;
  const socialImage = `${siteUrl}/assets/tuskersedge-social-card.webp`;
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article', headline: title, description: excerpt,
    image: socialImage, mainEntityOfPage: canonical,
    publisher: { '@type': 'Organization', name: 'TuskersEdge', logo: { '@type': 'ImageObject', url: `${siteUrl}/assets/brand-mark.svg` } },
  }).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="description" content="${escapeHtml(excerpt)}"/><title>${escapeHtml(title)} | TuskersEdge Journal</title><link rel="stylesheet" href="css/site.css"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet"/><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"/><link rel="manifest" href="site.webmanifest"/><link rel="apple-touch-icon" href="assets/apple-touch-icon.png"/><meta name="theme-color" content="#064e3b"/><meta name="mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-title" content="TuskersEdge"/><link rel="canonical" href="${canonical}"/><meta property="og:type" content="article"/><meta property="og:title" content="${escapeHtml(title)}"/><meta property="og:description" content="${escapeHtml(excerpt)}"/><meta property="og:url" content="${canonical}"/><meta property="og:image" content="${socialImage}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:image" content="${socialImage}"/><script type="application/ld+json">${structuredData}</script></head><body class="bg-slate-50 font-body text-slate-800"><main class="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12"><a href="blog.html" class="inline-flex rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold">Back to Blog</a><article class="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="h-56 w-full object-cover md:h-72"/><div class="p-6 md:p-8"><p class="text-xs uppercase tracking-wide text-slate-500">${escapeHtml(category)} - ${escapeHtml(readTime)}</p><h1 class="mt-2 font-heading text-3xl text-emerald-950 md:text-4xl">${escapeHtml(title)}</h1><p class="mt-3 text-sm text-slate-600">${escapeHtml(excerpt)}</p><div class="mt-6 space-y-4">${safeContent}</div></div></article></main><script src="js/analytics.js" defer></script><script src="js/pwa.js" defer></script></body></html>`;
  await fs.writeFile(filePath, html, 'utf8');
  res.json({ ok: true, url: fileName });
});

const blockedPaths = ['/data', '/node_modules', '/api', '/lib', '/backups', '/scripts', '/server.js', '/package.json', '/package-lock.json', '/start-server.bat', '/.env', '/.env.example', '/tuskers edge.zip'];
app.use((req, res, next) => {
  const lowerPath = decodeURIComponent(req.path).toLowerCase();
  if (blockedPaths.some((blocked) => lowerPath === blocked || lowerPath.startsWith(`${blocked}/`)) || lowerPath.endsWith('.zip')) return res.status(404).send('Not found');
  next();
});

app.use(express.static(rootDir, {
  dotfiles: 'deny', index: 'index.html', maxAge: isProduction ? '1d' : 0,
  setHeaders(res, filePath) { if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); },
}));
app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'Not found' }));
app.use((req, res) => res.status(404).sendFile(path.join(rootDir, '404.html')));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ ok: false, error: 'Unexpected server error.' });
});

app.listen(port, () => {
  console.log(`TuskersEdge running at http://localhost:${port}`);
  console.log('SQLite database: data/tuskersedge.db');
  if (!mailConfigured) console.warn('Email notifications are disabled until Gmail credentials are configured.');
});
