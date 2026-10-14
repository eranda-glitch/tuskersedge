import fs from 'fs/promises';
import path from 'path';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = String(process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const outputDir = path.resolve('test-results');
await fs.mkdir(outputDir, { recursive: true });

const allPages = ['/', '/tours.html', '/gallery.html', '/blog.html', '/about.html', '/contact.html', '/feedback.html', '/faq.html', '/privacy.html', '/terms.html', '/image-credits.html', '/10-things-to-taste-in-colombo.html', '/a-slow-12-day-sri-lanka-loop.html', '/how-to-do-yala-responsibly.html', '/booking-the-kandy-ella-train.html', '/24-hours-in-galle-fort.html', '/being-a-respectful-guest-in-tea-country.html', '/when-to-visit-sri-lanka-by-region.html', '/udawalawe-safari-responsible-travel-guide.html', '/sri-lanka-with-children-family-travel-guide.html', '/first-week-in-sri-lanka-route-without-the-rush.html', '/what-to-pack-for-sri-lanka.html', '/tuskersedge.html'];
const engines = [
  { name: 'edge', launch: () => chromium.launch({ channel: 'msedge', headless: true }) },
  { name: 'chrome', launch: () => chromium.launch({ channel: 'chrome', headless: true }) },
  { name: 'firefox', launch: () => firefox.launch({ headless: true }) },
  { name: 'webkit', launch: () => webkit.launch({ headless: true }) },
];
const failures = [];
const warnings = [];

for (const engine of engines) {
  let browser;
  try {
    browser = await engine.launch();
  } catch (error) {
    warnings.push(`${engine.name}: browser could not start (${error.message.split('\n')[0]})`);
    continue;
  }
  const pages = engine.name === 'edge' ? allPages : ['/', '/tours.html', '/gallery.html', '/contact.html'];
  for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    for (const pagePath of pages) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });
      try {
        const response = await page.goto(`${baseUrl}${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(400);
        if (!response?.ok()) failures.push(`${engine.name}/${viewport.name}${pagePath}: HTTP ${response?.status()}`);
        if (await page.locator('h1').count() === 0) failures.push(`${engine.name}/${viewport.name}${pagePath}: missing H1`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
        if (overflow) failures.push(`${engine.name}/${viewport.name}${pagePath}: horizontal overflow`);
        if (pagePath === '/tours.html') {
          try {
            await page.locator('#sri-lanka-map-root svg').waitFor({ state: 'visible', timeout: 5000 });
          } catch {
            failures.push(`${engine.name}/${viewport.name}${pagePath}: Sri Lanka map did not render`);
          }
        }
        if (engine.name === 'edge' && viewport.name === 'desktop') {
          const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
          for (const violation of accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact))) {
            failures.push(`${engine.name}/${viewport.name}${pagePath}: accessibility ${violation.id} (${violation.nodes.length})`);
          }
        }
        for (const error of pageErrors.filter((value) => !value.includes('tiktok.com') && !value.includes('fonts.googleapis.com') && !value.startsWith('Failed to load resource:'))) {
          failures.push(`${engine.name}/${viewport.name}${pagePath}: ${error}`);
        }
      } catch (error) {
        failures.push(`${engine.name}/${viewport.name}${pagePath}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  const interaction = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await interaction.goto(`${baseUrl}/gallery.html`, { waitUntil: 'domcontentloaded' });
  await interaction.locator('.gallery-item').first().click();
  if (!(await interaction.locator('#gallery-lightbox').evaluate((element) => element.classList.contains('flex')))) failures.push(`${engine.name}: gallery lightbox did not open`);
  await interaction.locator('#gallery-lightbox-image').click();
  if (!(await interaction.locator('#gallery-lightbox-image').evaluate((element) => element.classList.contains('is-zoomed')))) failures.push(`${engine.name}: gallery zoom did not activate`);
  await interaction.screenshot({ path: path.join(outputDir, `${engine.name}-gallery-mobile.png`), fullPage: false });
  await interaction.goto(`${baseUrl}/contact.html`, { waitUntil: 'domcontentloaded' });
  const minDate = await interaction.locator('input[name="travelDate"]').first().getAttribute('min');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(minDate || '')) failures.push(`${engine.name}: travel date minimum was not set`);
  await interaction.close();
  await browser.close();
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}
warnings.forEach((warning) => console.warn(`WARN ${warning}`));
console.log('Browser checks passed for every browser that could run, at desktop and mobile sizes.');
