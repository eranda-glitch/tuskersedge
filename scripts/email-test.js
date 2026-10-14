import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();
const user = process.env.GMAIL_USER || '';
const password = process.env.GMAIL_APP_PASSWORD || '';
const recipient = process.env.EMAIL_TO || user;

if (!user || !password || password === 'YOUR_APP_PASSWORD_HERE' || !recipient) {
  console.error('Email is not configured. Set GMAIL_USER, GMAIL_APP_PASSWORD, and EMAIL_TO.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass: password },
  disableFileAccess: true,
  disableUrlAccess: true,
});

await transporter.verify();
const result = await transporter.sendMail({
  from: `TuskersEdge <${user}>`,
  to: recipient,
  subject: 'TuskersEdge email delivery test',
  text: `Email delivery test completed at ${new Date().toISOString()}.`,
});
console.log(`Email accepted by Gmail: ${result.messageId}`);
