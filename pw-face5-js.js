import { chromium } from 'playwright';

const URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/our-work/';
const DIR = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';

async function scrollToFace(page, faceIdx, n, sectionTop, sectionHeight) {
  const scrollable = sectionHeight - 900;
  const y = sectionTop + ((faceIdx + 0.5) / n) * scrollable;
  await page.evaluate(sy => window.scrollTo({ top: sy, behavior: 'instant' }), y);
  await page.waitForTimeout(1200);
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
  console.log('n =', info.n);

  // ── Read DOM structure of faces 4 & 5 ─────────────────────────────────────
  const structure = await page.evaluate(() => {
    const faces = [4, 5].map(i => {
      const el = document.querySelector(`[data-cube-face="${i}"]`);
      if (!el) return { i, found: false };
      const img = el.querySelector('img');
      return {
        i,
        found: true,
        classes: el.className,
        imgSrc: img ? img.src.slice(-30) : null,
        imgStyle: img ? img.style.cssText : null,
        computedTransform: img ? getComputedStyle(img).transform : null,
      };
    });
    return faces;
  });
  console.log('Face structure:', JSON.stringify(structure, null, 2));

  // ── Baseline: face 4 and face 5 unchanged ─────────────────────────────────
  await scrollToFace(page, 4, info.n, info.sectionTop, info.sectionHeight);
  await page.screenshot({ path: `${DIR}\\pw-js-face4-baseline.png` });
  console.log('Baseline face 4 → pw-js-face4-baseline.png');

  await scrollToFace(page, 5, info.n, info.sectionTop, info.sectionHeight);
  await page.screenshot({ path: `${DIR}\\pw-js-face5-baseline.png` });
  console.log('Baseline face 5 → pw-js-face5-baseline.png');

  // ── Apply fix for face 4: rotateZ(90deg) via CSS ──────────────────────────
  await page.evaluate(() => {
    const id = 'face-fix-style';
    let el = document.getElementById(id);
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    el.textContent = `
      .cube__face--top    img { transform: rotateZ(90deg)  !important; }
      .cube__face--bottom img { transform: rotateZ(180deg) !important; }
    `;
  });

  await scrollToFace(page, 4, info.n, info.sectionTop, info.sectionHeight);
  await page.screenshot({ path: `${DIR}\\pw-js-face4-css-fixed.png` });
  console.log('CSS fix face 4 rotateZ(90deg) → pw-js-face4-css-fixed.png');

  await scrollToFace(page, 5, info.n, info.sectionTop, info.sectionHeight);
  await page.screenshot({ path: `${DIR}\\pw-js-face5-css-180.png` });
  console.log('CSS fix face 5 rotateZ(180deg) → pw-js-face5-css-180.png');

  // ── Apply fix via JS directly on img elements ─────────────────────────────
  await page.evaluate(() => {
    // Remove CSS override first
    const el = document.getElementById('face-fix-style');
    if (el) el.textContent = '';

    const img4 = document.querySelector('[data-cube-face="4"] img');
    const img5 = document.querySelector('[data-cube-face="5"] img');
    if (img4) img4.style.transform = 'rotateZ(90deg)';
    if (img5) img5.style.transform = 'rotateZ(180deg)';
  });

  await scrollToFace(page, 4, info.n, info.sectionTop, info.sectionHeight);
  await page.screenshot({ path: `${DIR}\\pw-js-face4-js-fixed.png` });
  console.log('JS fix face 4 rotateZ(90deg) → pw-js-face4-js-fixed.png');

  await scrollToFace(page, 5, info.n, info.sectionTop, info.sectionHeight);
  await page.screenshot({ path: `${DIR}\\pw-js-face5-js-180.png` });
  console.log('JS fix face 5 rotateZ(180deg) → pw-js-face5-js-180.png');

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
