import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';

const rootDir = path.resolve();
const dataDir = path.join(rootDir, 'data');
const databasePath = path.join(dataDir, 'tuskersedge.db');

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    csrf_token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    month TEXT NOT NULL DEFAULT '',
    nights TEXT NOT NULL DEFAULT '',
    travelers TEXT NOT NULL DEFAULT '',
    budget TEXT NOT NULL DEFAULT '',
    interests TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tours (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    duration TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    price TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS gallery_images (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    src TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    url TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    read_time TEXT NOT NULL DEFAULT '5 min read',
    excerpt TEXT NOT NULL DEFAULT '',
    content_html TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 0,
    featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS district_guides (
    district_key TEXT PRIMARY KEY,
    district_name TEXT NOT NULL DEFAULT '',
    intro TEXT NOT NULL DEFAULT '',
    climate TEXT NOT NULL DEFAULT '',
    best_time TEXT NOT NULL DEFAULT '',
    highlights TEXT NOT NULL DEFAULT '',
    places TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    content_html TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS social_videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    video_id TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS analytics_daily (
    day TEXT NOT NULL,
    path TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, path)
  );
`);

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { passwordHash, salt };
}

export function verifyPassword(password, passwordHash, salt) {
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(passwordHash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function readJson(fileName, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), 'utf8'));
  } catch {
    return fallback;
  }
}

function createAdmin() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM admins').get().count;
  if (count > 0) return;

  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const { passwordHash, salt } = hashPassword(password);
  db.prepare(`
    INSERT INTO admins (username, password_hash, password_salt)
    VALUES (?, ?, ?)
  `).run(username, passwordHash, salt);
}

function importLegacyContent() {
  const contentCount = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM tours) +
      (SELECT COUNT(*) FROM gallery_images) +
      (SELECT COUNT(*) FROM blog_posts) AS count
  `).get().count;
  if (contentCount > 0) return;

  const content = readJson('content.json', {});
  const messages = readJson('messages.json', { messages: [] });

  const insertTour = db.prepare(`
    INSERT OR IGNORE INTO tours
      (id, title, duration, type, description, price, featured, image, sort_order)
    VALUES
      (@id, @title, @duration, @type, @description, @price, @featured, @image, @sortOrder)
  `);
  const insertGallery = db.prepare(`
    INSERT OR IGNORE INTO gallery_images
      (id, label, category, src, sort_order)
    VALUES (@id, @label, @category, @src, @sortOrder)
  `);
  const insertBlog = db.prepare(`
    INSERT OR IGNORE INTO blog_posts
      (id, title, category, url, image, read_time, excerpt, content_html, published, featured, sort_order)
    VALUES
      (@id, @title, @category, @url, @image, @readTime, @excerpt, @contentHtml, @published, @featured, @sortOrder)
  `);
  const insertDistrict = db.prepare(`
    INSERT OR IGNORE INTO district_guides
      (district_key, district_name, intro, climate, best_time, highlights, places, image, content_html)
    VALUES
      (@districtKey, @districtName, @intro, @climate, @bestTime, @highlights, @places, @image, @contentHtml)
  `);
  const insertVideo = db.prepare(`
    INSERT OR IGNORE INTO social_videos (id, title, url, video_id, sort_order)
    VALUES (@id, @title, @url, @videoId, @sortOrder)
  `);
  const insertEnquiry = db.prepare(`
    INSERT OR IGNORE INTO enquiries
      (id, name, email, phone, month, nights, travelers, budget, interests, details, source, status, created_at)
    VALUES
      (@id, @name, @email, @phone, @month, @nights, @travelers, @budget, @interests, @details, @source, @status, @createdAt)
  `);

  db.transaction(() => {
    (content.tours || []).forEach((item, index) => insertTour.run({
      id: String(item.id || `tour-${index + 1}`),
      title: String(item.title || 'Untitled tour'),
      duration: String(item.duration || ''),
      type: String(item.type || ''),
      description: String(item.description || ''),
      price: String(item.price || ''),
      featured: item.featured ? 1 : 0,
      image: String(item.image || ''),
      sortOrder: index,
    }));

    (content.gallery || []).forEach((item, index) => insertGallery.run({
      id: String(item.id || `gallery-${index + 1}`),
      label: String(item.label || `Gallery image ${index + 1}`),
      category: String(item.category || 'general'),
      src: String(item.src || ''),
      sortOrder: index,
    }));

    (content.blog || []).forEach((item, index) => insertBlog.run({
      id: String(item.id || `blog-${index + 1}`),
      title: String(item.title || 'Untitled post'),
      category: String(item.category || 'General'),
      url: String(item.url || ''),
      image: String(item.image || ''),
      readTime: String(item.readTime || '5 min read'),
      excerpt: String(item.excerpt || ''),
      contentHtml: String(item.contentHtml || ''),
      published: item.published ? 1 : 0,
      featured: item.featured ? 1 : 0,
      sortOrder: index,
    }));

    Object.entries(content.districtGuides || {}).forEach(([key, item]) => insertDistrict.run({
      districtKey: key,
      districtName: String(item.name || item.districtName || key),
      intro: String(item.summary || item.intro || ''),
      climate: String(item.climate || ''),
      bestTime: String(item.weather || item.bestTime || ''),
      highlights: JSON.stringify(Array.isArray(item.highlights) ? item.highlights : []),
      places: String(item.focus || item.places || ''),
      image: String(item.image || ''),
      contentHtml: String(item.articleHtml || item.contentHtml || ''),
    }));

    (content.tiktokVideos || []).forEach((item, index) => insertVideo.run({
      id: String(item.id || `video-${index + 1}`),
      title: String(item.title || ''),
      url: String(item.url || ''),
      videoId: String(item.videoId || ''),
      sortOrder: index,
    }));

    (messages.messages || []).forEach((item, index) => insertEnquiry.run({
      id: String(item.id || `enquiry-${index + 1}`),
      name: String(item.name || ''),
      email: String(item.email || ''),
      phone: String(item.phone || ''),
      month: String(item.month || ''),
      nights: String(item.nights || ''),
      travelers: String(item.travelers || ''),
      budget: String(item.budget || ''),
      interests: String(item.interests || ''),
      details: String(item.details || ''),
      source: String(item.source || 'website'),
      status: item.status === 'read' ? 'read' : 'new',
      createdAt: String(item.createdAt || new Date().toISOString()),
    }));
  })();
}

export function initializeDatabase() {
  createAdmin();
  importLegacyContent();
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
}

export function getContent() {
  const tours = db.prepare('SELECT * FROM tours ORDER BY sort_order, rowid').all().map((item) => ({
    id: item.id,
    title: item.title,
    duration: item.duration,
    type: item.type,
    description: item.description,
    price: item.price,
    featured: Boolean(item.featured),
    image: item.image,
  }));

  const gallery = db.prepare('SELECT * FROM gallery_images ORDER BY sort_order, rowid').all().map((item) => ({
    id: item.id,
    label: item.label,
    category: item.category,
    src: item.src,
  }));

  const blog = db.prepare('SELECT * FROM blog_posts ORDER BY sort_order, rowid').all().map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    url: item.url,
    image: item.image,
    readTime: item.read_time,
    excerpt: item.excerpt,
    contentHtml: item.content_html,
    published: Boolean(item.published),
    featured: Boolean(item.featured),
  }));

  const districtGuides = {};
  db.prepare('SELECT * FROM district_guides ORDER BY district_name').all().forEach((item) => {
    let highlights = [];
    try { highlights = JSON.parse(item.highlights || '[]'); } catch { highlights = []; }
    districtGuides[item.district_key] = {
      name: item.district_name,
      summary: item.intro,
      climate: item.climate,
      weather: item.best_time,
      highlights,
      focus: item.places,
      image: item.image,
      articleHtml: item.content_html,
    };
  });

  const tiktokVideos = db.prepare('SELECT * FROM social_videos ORDER BY sort_order, rowid').all().map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    videoId: item.video_id,
  }));

  return { tours, gallery, blog, districtGuides, tiktokVideos };
}

export function replaceContent(content) {
  const safe = content && typeof content === 'object' ? content : {};
  const deleteAll = {
    tours: db.prepare('DELETE FROM tours'),
    gallery: db.prepare('DELETE FROM gallery_images'),
    blog: db.prepare('DELETE FROM blog_posts'),
    districts: db.prepare('DELETE FROM district_guides'),
    videos: db.prepare('DELETE FROM social_videos'),
  };

  db.transaction(() => {
    deleteAll.tours.run();
    deleteAll.gallery.run();
    deleteAll.blog.run();
    deleteAll.districts.run();
    deleteAll.videos.run();

    const insertTour = db.prepare('INSERT INTO tours VALUES (@id,@title,@duration,@type,@description,@price,@featured,@image,@sortOrder)');
    (safe.tours || []).forEach((item, index) => insertTour.run({
      id: String(item.id || `tour-${crypto.randomUUID()}`), title: String(item.title || 'Untitled tour'),
      duration: String(item.duration || ''), type: String(item.type || ''), description: String(item.description || ''),
      price: String(item.price || ''), featured: item.featured ? 1 : 0, image: String(item.image || ''), sortOrder: index,
    }));

    const insertGallery = db.prepare('INSERT INTO gallery_images VALUES (@id,@label,@category,@src,@sortOrder)');
    (safe.gallery || []).forEach((item, index) => insertGallery.run({
      id: String(item.id || `gallery-${crypto.randomUUID()}`), label: String(item.label || 'Gallery image'),
      category: String(item.category || 'general'), src: String(item.src || ''), sortOrder: index,
    }));

    const insertBlog = db.prepare('INSERT INTO blog_posts VALUES (@id,@title,@category,@url,@image,@readTime,@excerpt,@contentHtml,@published,@featured,@sortOrder)');
    (safe.blog || []).forEach((item, index) => insertBlog.run({
      id: String(item.id || `blog-${crypto.randomUUID()}`), title: String(item.title || 'Untitled post'),
      category: String(item.category || 'General'), url: String(item.url || ''), image: String(item.image || ''),
      readTime: String(item.readTime || '5 min read'), excerpt: String(item.excerpt || ''), contentHtml: String(item.contentHtml || ''),
      published: item.published ? 1 : 0, featured: item.featured ? 1 : 0, sortOrder: index,
    }));

    const insertDistrict = db.prepare('INSERT INTO district_guides VALUES (@districtKey,@districtName,@intro,@climate,@bestTime,@highlights,@places,@image,@contentHtml)');
    Object.entries(safe.districtGuides || {}).forEach(([key, item]) => insertDistrict.run({
      districtKey: key, districtName: String(item.name || item.districtName || key), intro: String(item.summary || item.intro || ''),
      climate: String(item.climate || ''), bestTime: String(item.weather || item.bestTime || ''),
      highlights: JSON.stringify(Array.isArray(item.highlights) ? item.highlights : []),
      places: String(item.focus || item.places || ''), image: String(item.image || ''),
      contentHtml: String(item.articleHtml || item.contentHtml || ''),
    }));

    const insertVideo = db.prepare('INSERT INTO social_videos VALUES (@id,@title,@url,@videoId,@sortOrder)');
    (safe.tiktokVideos || []).forEach((item, index) => insertVideo.run({
      id: String(item.id || `video-${crypto.randomUUID()}`), title: String(item.title || ''),
      url: String(item.url || ''), videoId: String(item.videoId || ''), sortOrder: index,
    }));
  })();
}

export function createSession(adminId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, admin_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)')
    .run(tokenHash, adminId, csrfToken, expiresAt);
  return { token, csrfToken, expiresAt };
}

export function getSession(token) {
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return db.prepare(`
    SELECT sessions.*, admins.username
    FROM sessions JOIN admins ON admins.id = sessions.admin_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash, new Date().toISOString()) || null;
}

export function deleteSession(token) {
  if (!token) return;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}

export function listEnquiries() {
  return db.prepare(`
    SELECT id, name, email, phone, month, nights, travelers, budget, interests, details, source, status,
           created_at AS createdAt
    FROM enquiries ORDER BY created_at DESC
  `).all();
}

export function recordPageView(pagePath) {
  const day = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO analytics_daily (day, path, views) VALUES (?, ?, 1)
    ON CONFLICT(day, path) DO UPDATE SET views = views + 1
  `).run(day, pagePath);
}

export function getAnalyticsSummary(days = 30) {
  const start = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const total = db.prepare('SELECT COALESCE(SUM(views), 0) AS views FROM analytics_daily WHERE day >= ?').get(start).views;
  const daily = db.prepare('SELECT day, SUM(views) AS views FROM analytics_daily WHERE day >= ? GROUP BY day ORDER BY day').all(start);
  const topPaths = db.prepare('SELECT path, SUM(views) AS views FROM analytics_daily WHERE day >= ? GROUP BY path ORDER BY views DESC, path LIMIT 10').all(start);
  return { days, total, daily, topPaths };
}

export const databasePathname = databasePath;
