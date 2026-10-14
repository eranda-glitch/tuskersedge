import dotenv from 'dotenv';
import { db, hashPassword } from '../lib/database.js';

dotenv.config();

const username = process.env.ADMIN_USER || 'admin';
const password = process.env.ADMIN_PASSWORD || '';
if (!password || password === 'admin' || password.length < 12) {
  throw new Error('Set ADMIN_PASSWORD in .env to a unique password of at least 12 characters first.');
}

const { passwordHash, salt } = hashPassword(password);
const result = db.prepare('UPDATE admins SET password_hash = ?, password_salt = ? WHERE username = ?')
  .run(passwordHash, salt, username);
if (!result.changes) {
  db.prepare('INSERT INTO admins (username, password_hash, password_salt) VALUES (?, ?, ?)')
    .run(username, passwordHash, salt);
}
db.prepare('DELETE FROM sessions').run();
db.close();
console.log(`Admin password reset for ${username}. Existing sessions were signed out.`);

