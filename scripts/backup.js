import fs from 'fs/promises';
import path from 'path';
import { db } from '../lib/database.js';

const rootDir = path.resolve();
const backupDir = path.join(rootDir, 'backups');
await fs.mkdir(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const destination = path.join(backupDir, `tuskersedge-${stamp}.db`);
await db.backup(destination);
db.close();
console.log(`Backup created: ${destination}`);

