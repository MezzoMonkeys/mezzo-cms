import { chromium } from 'playwright';

const URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/our-work/';
const DIR = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';

async function scrollToFace(page, faceIdx, n, sectionTop, sectionHeight) {
  const scrollable = sectionHeight - 900;
  const y = sectionTop + ((faceIdx + 0.5) / n) * scrollable;
  await page.evaluate(sy => window.scrollTo({ top: sy, behavior: 'instant' }), y);
  await page.waitForTimeout(1800);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 40000 });
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    const s = document.getElementById('cube-gallery');
    return {
      sectionTop: Math.round(s.getBoundingClientRect().top + window.scrollY),
      sectionHeight: s.offsetHeight,
      n: document.querySelectorAll('.cube-info-card').length,
    };
  });

  // Check what JS commit is loaded (look for the -270 fix)
  const jsVersion = await page.evaluate(() => {
    // Try to find cube.js source from a script tag
    return [...document.scripts].map(s => s.src).filter(s => s.includes('cube'));
  });
  console.log('cube scripts:', jsVersion);

  // Screenshot all 6 faces using natural scroll (no overrides)
  for (let i = 0; i < info.n; i++) {
    await scrollToFace(page, i, info.n, info.sectionTop, info.sectionHeight);
    const label = await page.evaluate(() => {
      const active = document.querySelector('.cube-info-card.is-active');
      const title = active ? active.querySelector('.cube-info-card__title')?.textContent?.trim() : '?';
      const cube = document.getElementById('cube');
      return { title, transform: cube?.style.transform };
    });
    const p = `${DIR}\\pw-live-face${i}.png`;
    await page.screenshot({ path: p });
    console.log(`Face ${i}: "${label.title}"  transform: ${label.transform}  → pw-live-face${i}.png`);
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
