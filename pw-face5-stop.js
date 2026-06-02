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

  // ── Scroll to face 5, let RAF settle, then kill the loop ──────────────────
  await scrollToFace(page, 5, info.n, info.sectionTop, info.sectionHeight);

  // Freeze RAF so we can set cube transforms manually
  await page.evaluate(() => {
    window._origRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = () => 0; // no-op
  });
  await page.waitForTimeout(200);

  // Read what the cube transform is NOW (settled at face 5)
  const settled = await page.evaluate(() => {
    const cube = document.getElementById('cube');
    return cube ? cube.style.transform : 'not found';
  });
  console.log('Settled cube transform at face 5:', settled);

  // Screenshot baseline (RAF frozen, face 5 settled)
  await page.screenshot({ path: `${DIR}\\pw-stop-face5-settled.png` });
  console.log('Settled face 5 → pw-stop-face5-settled.png');

  // Test different cube transforms for face 5
  const candidates = [
    { label: 'original-180',  rx: -180, ry: -270 },
    { label: 'plus90',        rx:   90, ry: -270 },
    { label: 'minus270',      rx: -270, ry: -270 },
    { label: 'plus90-ry270',  rx:   90, ry:  270 },
    { label: 'plus90-ry90',   rx:   90, ry:   90 },
    { label: 'minus270-ry90', rx: -270, ry:   90 },
  ];

  for (const c of candidates) {
    await page.evaluate(({ rx, ry }) => {
      const cube = document.getElementById('cube');
      if (cube) cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    }, c);
    await page.waitForTimeout(300);
    const p = `${DIR}\\pw-stop-${c.label}.png`;
    await page.screenshot({ path: p });
    console.log(`${c.label} (rx=${c.rx}, ry=${c.ry}) → ${p}`);
  }

  // ── Also test: does the image show correctly on the face when raw ──────────
  // Unhide the face's img by showing it absolutely positioned on screen
  await page.evaluate(() => {
    const img5 = document.querySelector('[data-cube-face="5"] img');
    if (img5) {
      // Clone the img outside the 3D context
      const clone = img5.cloneNode(true);
      clone.style.cssText = 'position:fixed;top:10px;right:10px;width:200px;height:200px;object-fit:cover;z-index:9999;border:3px solid yellow;';
      document.body.appendChild(clone);
    }
  });
  // Reset cube transform to face 5 settled
  await page.evaluate(({ rx, ry }) => {
    const cube = document.getElementById('cube');
    if (cube) cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, { rx: -180, ry: -270 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}\\pw-stop-face5-with-raw-img.png` });
  console.log('Face 5 with raw img clone top-right → pw-stop-face5-with-raw-img.png');

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
