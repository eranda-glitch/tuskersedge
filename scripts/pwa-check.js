import { chromium, webkit } from 'playwright';

const baseUrl = String(process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const failures = [];

const chromiumBrowser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await chromiumBrowser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await page.goto(`${baseUrl}/`, { waitUntil: 'load' });

const manifest = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  const response = await fetch(link.href);
  return response.json();
});
if (manifest.display !== 'standalone') failures.push('Manifest display mode is not standalone.');
if (!manifest.icons?.some((icon) => icon.sizes === '192x192')) failures.push('Manifest is missing a 192px app icon.');
if (!manifest.icons?.some((icon) => icon.sizes === '512x512')) failures.push('Manifest is missing a 512px app icon.');

try {
  await page.evaluate(() => Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
  ]));
} catch {
  failures.push('Service worker did not become ready.');
}

await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
if (!(await page.locator('h1').count())) failures.push('No cached or offline page was available without a network connection.');
await context.close();
await chromiumBrowser.close();

const webkitBrowser = await webkit.launch({ headless: true });
const iosContext = await webkitBrowser.newContext({
  viewport: { width: 820, height: 1180 },
  userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
});
const iosPage = await iosContext.newPage();
await iosPage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
await iosPage.waitForTimeout(2200);
if (!(await iosPage.locator('#pwa-install-banner').count())) failures.push('iOS/iPad install guidance was not shown.');
await iosContext.close();
await webkitBrowser.close();

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}
console.log('PWA manifest, icons, service worker, offline fallback, and iPad install guidance passed.');
