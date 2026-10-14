const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
});

const clean = (value, max = 4000) => String(value ?? '').trim().slice(0, max);
const validEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const now = () => new Date().toISOString();
const randomHex = (bytes = 32) => {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map((value) => value.toString(16).padStart(2, '0')).join('');
};
const sha256 = async (value) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
};

async function passwordHash(password, salt = randomHex(16)) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return { salt, hash: [...new Uint8Array(bits)].map((value) => value.toString(16).padStart(2, '0')).join('') };
}

async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

async function getContent(env) {
  const row = await env.DB.prepare('SELECT value FROM app_state WHERE key = ?').bind('content').first();
  if (!row) return { tours: [], gallery: [], blog: [], districtGuides: {}, tiktokVideos: [] };
  try { return JSON.parse(row.value); } catch { return { tours: [], gallery: [], blog: [], districtGuides: {}, tiktokVideos: [] }; }
}

async function session(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const token = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/)?.[1] || '';
  if (!token) return null;
  const tokenHash = await sha256(token);
  return env.DB.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(tokenHash, now()).first();
}

async function requireAdmin(request, env) {
  const current = await session(request, env);
  if (!current) return { error: json({ ok: false, error: 'Authentication required.' }, 401) };
  const csrf = request.headers.get('x-csrf-token') || '';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && csrf !== current.csrf_token) {
    return { error: json({ ok: false, error: 'Invalid security token. Refresh and try again.' }, 403) };
  }
  return { current };
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

async function handleApi(request, env, path) {
  if (path === '/health' && request.method === 'GET') return json({ ok: true, database: 'cloudflare-d1' });

  if (path === '/content' && request.method === 'GET') {
    const content = await getContent(env);
    content.blog = (content.blog || []).filter((post) => post.published);
    return json({ ok: true, content }, 200, { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
  }

  if (path === '/analytics/pageview' && request.method === 'POST') {
    const body = await readBody(request);
    const pagePath = clean(body.path, 160).split('?')[0];
    if (!/^\/[a-zA-Z0-9/_-]*(?:\.html)?$/.test(pagePath) || pagePath.includes('admin')) return json({ ok: false }, 400);
    const day = now().slice(0, 10);
    await env.DB.prepare(`INSERT INTO analytics_daily (day, path, views) VALUES (?, ?, 1)
      ON CONFLICT(day, path) DO UPDATE SET views = views + 1`).bind(day, pagePath || '/').run();
    return new Response(null, { status: 204 });
  }

  if (path === '/contact' && request.method === 'POST') {
    const body = await readBody(request);
    if (clean(body.website, 200)) return json({ ok: true, message: 'Your enquiry has been received.' }, 201);
    if (body.privacyConsent !== 'yes') return json({ ok: false, error: 'Please accept the Privacy Policy.' }, 400);
    const enquiry = {
      id: crypto.randomUUID(), name: clean(body.name || `${clean(body.firstName, 80)} ${clean(body.lastName, 80)}`, 160),
      email: clean(body.email || body.contact, 254), phone: clean(body.phone || body.whatsapp, 60),
      month: clean(body.travelDate || body.month || body.preferredMonth, 80), nights: clean(body.nights || body.tripLength, 40),
      travelers: clean(body.travelers, 120), budget: clean(body.budget, 120), interests: clean(body.interests || body.message, 1500),
      details: clean(body.details || body.notes, 4000), source: clean(body.source || 'website', 120), status: 'new', createdAt: now(),
    };
    if (!enquiry.name || (!enquiry.email && !enquiry.phone)) return json({ ok: false, error: 'Name and email or phone are required.' }, 400);
    if (!validEmail(enquiry.email)) return json({ ok: false, error: 'Enter a valid email address.' }, 400);
    await env.DB.prepare(`INSERT INTO enquiries (id,name,email,phone,month,nights,travelers,budget,interests,details,source,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(enquiry.id, enquiry.name, enquiry.email, enquiry.phone, enquiry.month, enquiry.nights,
      enquiry.travelers, enquiry.budget, enquiry.interests, enquiry.details, enquiry.source, enquiry.status, enquiry.createdAt).run();
    return json({ ok: true, message: 'Your enquiry has been received.' }, 201);
  }

  if (path === '/login' && request.method === 'POST') {
    const body = await readBody(request);
    const username = clean(body.username, 100);
    const password = String(body.password || '');
    let admin = await env.DB.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first();
    if (!admin && username === clean(env.ADMIN_USER || 'admin', 100) && env.ADMIN_PASSWORD) {
      const hashed = await passwordHash(env.ADMIN_PASSWORD);
      await env.DB.prepare('INSERT INTO admins (username,password_hash,password_salt) VALUES (?,?,?)').bind(username, hashed.hash, hashed.salt).run();
      admin = { username, password_hash: hashed.hash, password_salt: hashed.salt };
    }
    const candidate = admin ? await passwordHash(password, admin.password_salt) : null;
    if (!admin || !candidate || candidate.hash !== admin.password_hash) return json({ ok: false, error: 'Invalid credentials' }, 401);
    const token = randomHex(32); const csrfToken = randomHex(24); const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare('INSERT INTO sessions (token_hash,username,csrf_token,expires_at) VALUES (?,?,?,?)').bind(await sha256(token), username, csrfToken, expiresAt).run();
    return json({ ok: true, csrfToken, username }, 200, { 'set-cookie': cookie('admin_token', token, 8 * 60 * 60) });
  }

  if (path === '/session' && request.method === 'GET') {
    const current = await session(request, env);
    return json({ ok: true, authenticated: Boolean(current), csrfToken: current?.csrf_token || '', username: current?.username || '' });
  }

  if (path === '/logout' && request.method === 'POST') {
    const auth = await requireAdmin(request, env); if (auth.error) return auth.error;
    const token = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)admin_token=([^;]+)/)?.[1] || '';
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return json({ ok: true }, 200, { 'set-cookie': cookie('admin_token', '', 0) });
  }

  if (path.startsWith('/admin/')) {
    const auth = await requireAdmin(request, env); if (auth.error) return auth.error;
    if (path === '/admin/content' && request.method === 'GET') return json({ ok: true, content: await getContent(env) });
    if (path === '/admin/content' && request.method === 'PUT') {
      const content = await readBody(request);
      await env.DB.prepare('INSERT INTO app_state (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('content', JSON.stringify(content)).run();
      return json({ ok: true });
    }
    if (path === '/admin/messages' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT id,name,email,phone,month,nights,travelers,budget,interests,details,source,status,created_at AS createdAt FROM enquiries ORDER BY created_at DESC').all();
      return json({ ok: true, messages: results });
    }
    if (path === '/admin/analytics' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT day, SUM(views) AS views FROM analytics_daily GROUP BY day ORDER BY day DESC LIMIT 30').all();
      return json({ ok: true, analytics: { days: 30, total: results.reduce((sum, row) => sum + Number(row.views || 0), 0), daily: results.reverse(), topPaths: [] } });
    }
    if (path === '/admin/messages/mark-read' && request.method === 'POST') { await env.DB.prepare("UPDATE enquiries SET status='read'").run(); return json({ ok: true }); }
    const readMatch = path.match(/^\/admin\/messages\/([^/]+)\/read$/);
    if (readMatch && request.method === 'POST') { await env.DB.prepare("UPDATE enquiries SET status='read' WHERE id=?").bind(readMatch[1]).run(); return json({ ok: true }); }
    const deleteMatch = path.match(/^\/admin\/messages\/([^/]+)$/);
    if (deleteMatch && request.method === 'DELETE') { await env.DB.prepare('DELETE FROM enquiries WHERE id=?').bind(deleteMatch[1]).run(); return json({ ok: true }); }
    if (path === '/admin/backup' && request.method === 'GET') return json({ exportedAt: now(), content: await getContent(env) });
    if (path === '/admin/blog/publish' && request.method === 'POST') {
      const body = await readBody(request);
      const title = clean(body.title, 180);
      if (!title) return json({ ok: false, error: 'Title is required.' }, 400);
      const content = await getContent(env);
      const blog = Array.isArray(content.blog) ? content.blog : [];
      const post = {
        id: clean(body.id, 120) || `blog-${crypto.randomUUID()}`,
        title,
        category: clean(body.category || 'General', 80),
        url: clean(body.existingUrl || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.html`, 180),
        image: clean(body.image || 'images/1.jpeg', 500),
        readTime: clean(body.readTime || '5 min read', 40),
        excerpt: clean(body.excerpt || '', 600),
        contentHtml: clean(body.contentHtml || '', 20000),
        published: true,
        featured: Boolean(body.featured),
      };
      const index = blog.findIndex((item) => item.id === post.id);
      if (index >= 0) blog[index] = { ...blog[index], ...post }; else blog.unshift(post);
      await env.DB.prepare('INSERT INTO app_state (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('content', JSON.stringify({ ...content, blog })).run();
      return json({ ok: true, post });
    }
    if (path === '/admin/upload-image' && request.method === 'POST') {
      const body = await readBody(request); const match = String(body.dataUrl || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);
      if (!match || !env.BUCKET) return json({ ok: false, error: 'R2 image storage is not configured.' }, 503);
      const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) return json({ ok: false, error: 'Image must be smaller than 5 MB.' }, 400);
      const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[match[1]];
      const key = `uploads/${crypto.randomUUID()}.${ext}`;
      await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: match[1] } });
      return json({ ok: true, path: `/media/${key}` }, 201);
    }
  }
  return json({ ok: false, error: 'Not found' }, 404);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  return handleApi(context.request, context.env, url.pathname.replace(/^\/api/, '') || '/');
}
