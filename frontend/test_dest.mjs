import pw from 'playwright';
const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5175/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForFunction(() => Array.from(document.querySelectorAll('h3')).length >= 3, { timeout: 60000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/dest_wider.png' });
await browser.close();
console.log('Done');
