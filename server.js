import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __dirname = path.resolve();
const dataPath = path.join(__dirname, 'data', 'messages.json');
const contentPath = path.join(__dirname, 'data', 'content.json');

const sessions = new Set();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (!k) return acc;
    acc[k] = decodeURIComponent(v.join('='));
    return acc;
  }, {});
}

function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.admin_token && sessions.has(cookies.admin_token)) {
    return next();
  }
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

function sanitize(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

async function readMessages() {
  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { messages: [] };
  }
}

async function writeMessages(payload) {
  await fs.writeFile(dataPath, JSON.stringify(payload, null, 2));
}

async function readContent() {
  try {
    const raw = await fs.readFile(contentPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { tours: [], gallery: [], blog: [] };
  }
}

async function writeContent(payload) {
  await fs.writeFile(contentPath, JSON.stringify(payload, null, 2));
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

app.post('/api/contact', async (req, res) => {
  try {
    const body = req.body || {};
    const message = {
      id: Date.now().toString(36),
      name: sanitize(body.name || `${sanitize(body.firstName)} ${sanitize(body.lastName)}`),
      email: sanitize(body.email || body.contact),
      phone: sanitize(body.phone || body.whatsapp),
      month: sanitize(body.month || body.preferredMonth),
      nights: sanitize(body.nights || body.tripLength),
      travelers: sanitize(body.travelers),
      budget: sanitize(body.budget),
      interests: sanitize(body.interests || body.message),
      details: sanitize(body.details || body.notes),
      source: sanitize(body.source || 'website'),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    const data = await readMessages();
    data.messages.push(message);
    await writeMessages(data);

    const toEmail = process.env.EMAIL_TO || process.env.GMAIL_USER;
    const subject = `New enquiry from ${message.name || 'Website'}`;
    const text = `New enquiry received:\n\n` +
      `Name: ${message.name}\n` +
      `Email: ${message.email}\n` +
      `Phone/WhatsApp: ${message.phone}\n` +
      `Preferred month: ${message.month}\n` +
      `Nights: ${message.nights}\n` +
      `Travelers: ${message.travelers}\n` +
      `Budget: ${message.budget}\n` +
      `Interests: ${message.interests}\n` +
      `Details: ${message.details}\n` +
      `Source: ${message.source}\n` +
      `Timestamp: ${message.createdAt}\n`;

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      await transporter.sendMail({
        from: `TuskersEdge <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject,
        text,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to save message.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin';
  if (username === adminUser && password === adminPass) {
    const token = Math.random().toString(36).slice(2);
    sessions.add(token);
    res.setHeader(
      'Set-Cookie',
      `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax`
    );
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.admin_token) {
    sessions.delete(cookies.admin_token);
  }
  res.setHeader('Set-Cookie', 'admin_token=; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/admin/content', requireAuth, async (req, res) => {
  const content = await readContent();
  res.json({ ok: true, content });
});

app.put('/api/admin/content', requireAuth, async (req, res) => {
  const payload = req.body || {};
  await writeContent(payload);
  res.json({ ok: true });
});

app.get('/api/admin/messages', requireAuth, async (req, res) => {
  const data = await readMessages();
  res.json({ ok: true, messages: data.messages || [] });
});

app.post('/api/admin/messages/mark-read', requireAuth, async (req, res) => {
  const data = await readMessages();
  data.messages = (data.messages || []).map((m) => ({ ...m, status: 'read' }));
  await writeMessages(data);
  res.json({ ok: true });
});

app.delete('/api/admin/messages/:id', requireAuth, async (req, res) => {
  const data = await readMessages();
  data.messages = (data.messages || []).filter((m) => m.id !== req.params.id);
  await writeMessages(data);
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
