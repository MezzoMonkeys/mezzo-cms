import { chromium } from 'playwright';

const URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/our-work/';
const DIR = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';

async function scrollToFace(page, faceIdx, n, sectionTop, sectionHeight) {
  const scrollable = sectionHeight - 900;
  const y = sectionTop + ((faceIdx + 0.5) / n) * scrollable;
  await page.evaluate(sy => window.scrollTo({ top: sy, behavior: 'instant' }), y);
  await page.waitForTimeout(1400);
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

  // ── 1. Test settled position with new stop { rx:-270, ry:-90 } ─────────────
  await scrollToFace(page, 5, info.n, info.sectionTop, info.sectionHeight);
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  await page.waitForTimeout(200);

  // Test with rotateZ(90deg) correction on img
  await page.evaluate(() => {
    const cube = document.getElementById('cube');
    if (cube) cube.style.transform = 'rotateX(-270deg) rotateY(-90deg)';
    const el = document.createElement('style');
    el.id = 'test-fix';
    el.textContent = '.cube__face--bottom img { transform: rotateZ(90deg) !important; }';
    document.head.appendChild(el);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}\\pw-ns-settled-rz90.png` });
  console.log('Settled rx:-270 ry:-90 + rotateZ(90deg) → pw-ns-settled-rz90.png');

  // Without correction
  await page.evaluate(() => {
    document.getElementById('test-fix').textContent = '';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}\\pw-ns-settled-none.png` });
  console.log('Settled rx:-270 ry:-90 no img correction → pw-ns-settled-none.png');

  // ── 2. Simulate transition frames using the new stop ─────────────────────────
  // Re-enable RAF equivalent by manually stepping through the lerp
  const face4Stop = { rx: -90,  ry: -270 };
  const face5Stop = { rx: -270, ry:  -90 };

  // Add rotateZ fix permanently for these tests
  await page.evaluate(() => {
    const el = document.getElementById('test-fix');
    el.textContent = `.cube__face--top    img { transform: rotateZ(90deg)  !important; }
                      .cube__face--bottom img { transform: rotateZ(90deg)  !important; }`;
  });

  for (let e = 0; e <= 1; e += 0.2) {
    const rx = face4Stop.rx + (face5Stop.rx - face4Stop.rx) * e;
    const ry = face4Stop.ry + (face5Stop.ry - face4Stop.ry) * e;
    await page.evaluate(({ rx, ry }) => {
      const cube = document.getElementById('cube');
      if (cube) cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    }, { rx, ry });
    await page.waitForTimeout(200);
    const label = String(Math.round(e * 10)).padStart(2, '0');
    await page.screenshot({ path: `${DIR}\\pw-ns-trans-${label}.png` });
    console.log(`Transition e=${e.toFixed(1)} rx=${rx.toFixed(0)} ry=${ry.toFixed(0)} → pw-ns-trans-${label}.png`);
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
