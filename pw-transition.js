import { chromium } from 'playwright';

const URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/our-work/';
const DIR = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';

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
  const scrollable = info.sectionHeight - 900;

  // Sample the exact boundary between face 4 and face 5
  // Face 4 centre = (4 + 0.5) / 6 = 0.75
  // Face 5 centre = (5 + 0.5) / 6 = 0.917
  // Boundary = 5 / 6 = 0.833
  const face4Centre  = (4 + 0.5) / info.n;
  const face5Centre  = (5 + 0.5) / info.n;
  const boundary     = 5 / info.n;

  const samples = [];
  for (let t = 0; t <= 1; t += 0.1) {
    const p = face4Centre + t * (face5Centre - face4Centre);
    samples.push(p);
  }
  // Also add the exact boundary
  samples.push(boundary);
  samples.sort((a, b) => a - b);

  console.log('Sampling transition from face 4 → face 5:');
  for (let i = 0; i < samples.length; i++) {
    const progress = samples[i];
    const y = info.sectionTop + progress * scrollable;
    await page.evaluate(sy => window.scrollTo({ top: sy, behavior: 'instant' }), y);
    await page.waitForTimeout(800);
    const rx = await page.evaluate(() => {
      const cube = document.getElementById('cube');
      return cube ? cube.style.transform : '';
    });
    const p = `${DIR}\\pw-trans-${String(i).padStart(2,'0')}.png`;
    await page.screenshot({ path: p, fullPage: false });
    console.log(`  i=${i} progress=${progress.toFixed(3)}  rx: ${rx}  → pw-trans-${String(i).padStart(2,'0')}.png`);
  }

  await browser.close();
  console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });
