import fs from 'fs/promises';
import path from 'path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const baseUrl = String(process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const outputDir = path.resolve('test-results');
await fs.mkdir(outputDir, { recursive: true });

const chrome = await launch({
  chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});
const pages = [
  { name: 'home', path: '/' },
  { name: 'tours', path: '/tours.html' },
  { name: 'contact', path: '/contact.html' },
];
const failures = [];

try {
  for (const page of pages) {
    const result = await lighthouse(`${baseUrl}${page.path}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    const report = result.lhr;
    await fs.writeFile(path.join(outputDir, `lighthouse-${page.name}.json`), JSON.stringify(report, null, 2));
    const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
    console.log(`${page.name}: performance ${scores.performance}, accessibility ${scores.accessibility}, best-practices ${scores['best-practices']}, SEO ${scores.seo}`);
    if (scores.performance < 70) failures.push(`${page.name}: performance score ${scores.performance}`);
    if (scores.accessibility < 95) failures.push(`${page.name}: accessibility score ${scores.accessibility}`);
    if (scores['best-practices'] < 90) failures.push(`${page.name}: best-practices score ${scores['best-practices']}`);
    if (scores.seo < 95) failures.push(`${page.name}: SEO score ${scores.seo}`);
  }
} finally {
  await chrome.kill();
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}
console.log('Lighthouse thresholds passed.');
