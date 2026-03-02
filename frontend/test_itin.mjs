import pw from 'playwright';

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto('http://localhost:5175/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(3000);

// Go to itinerary page
await page.evaluate(() => window.__SN?.setFocus('make-trip-btn'));
await page.waitForTimeout(300);
await page.keyboard.press('Enter');

// Wait for Day columns to appear (initial 5-day load)
console.log('Waiting for initial itinerary...');
await page.waitForFunction(() => {
  return document.querySelectorAll('div').length > 50 &&
    Array.from(document.querySelectorAll('div')).some(d => d.textContent?.trim() === 'Day 1');
}, { timeout: 60000 });
await page.waitForTimeout(1000);

await page.screenshot({ path: '/tmp/itin_01_5days.png' });
console.log('Screenshot 1: 5-day itinerary loaded');

// Increase duration to 7
await page.evaluate(() => window.__SN?.setFocus('dur-up'));
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
await page.waitForTimeout(300);

// Click regenerate
await page.evaluate(() => window.__SN?.setFocus('regenerate-btn'));
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
console.log('Regenerating with 7 days...');

// Wait for Day 7 to appear
await page.waitForFunction(() => {
  return Array.from(document.querySelectorAll('div')).some(d => d.textContent?.trim() === 'Day 7');
}, { timeout: 90000 });
await page.waitForTimeout(1000);

await page.screenshot({ path: '/tmp/itin_02_7days.png' });
const days = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('div'))
    .filter(d => /^Day \d+$/.test(d.textContent?.trim() || ''))
    .map(d => d.textContent?.trim());
});
console.log('Days:', days);

// Focus Day 1
await page.evaluate(() => window.__SN?.setFocus('day-col-1'));
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/itin_03_day1.png' });
console.log('Screenshot 3: Day 1 focused');

// Arrow right 4 times -> Day 5
for (let i = 1; i <= 4; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
}
await page.screenshot({ path: '/tmp/itin_04_day5.png' });
console.log('Screenshot 4: Day 5');

// Arrow right -> should scroll to show Day 6
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/itin_05_day6.png' });
console.log('Screenshot 5: Day 6 (scrolled)');

// Arrow right -> Day 7
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/itin_06_day7.png' });
console.log('Screenshot 6: Day 7');

// Arrow left all the way back
for (let i = 1; i <= 6; i++) {
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
}
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/itin_07_back.png' });
console.log('Screenshot 7: Back to Day 1');

await browser.close();
console.log('Done!');
