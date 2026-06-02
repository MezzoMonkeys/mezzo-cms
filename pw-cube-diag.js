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
    return { sectionTop: Math.round(s.getBoundingClientRect().top + window.scrollY), sectionHeight: s.offsetHeight, n: document.querySelectorAll('.cube-info-card').length };
  });

  // ── Test 1: confirm CSS injection works on face 5 img ──────────────────
  await page.evaluate(() => {
    const id = 'diag-style'; let el = document.getElementById(id);
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    el.textContent = `.cube__face--bottom img { outline: 6px solid red !important; background: red !important; }`;
  });
  await scrollToFace(page, 5, info.n, info.sectionTop, info.sectionHeight);
  await page.screenshot({ path: `${DIR}\\pw-diag-face5-redoutline.png`, fullPage: false });
  console.log('Test 1: red outline on face 5 img → pw-diag-face5-redoutline.png');

  // ── Test 2: try transform on the face ELEMENT (not img) ────────────────
  await page.evaluate(() => {
    const id = 'diag-style'; let el = document.getElementById(id);
    el.textContent = `.cube__face--bottom { transform: rotateX(-90deg) translateZ(var(--half)) rotateZ(90deg) !important; }`;
  });
  await page.waitForTimeout(400);
  await scrollToFace(page, 5, info.n, info.sectionTop, info.sectionHeight);
  await page.screenshot({ path: `${DIR}\\pw-diag-face5-faceZ90.png`, fullPage: false });
  console.log('Test 2: rotateZ(90deg) on face element → pw-diag-face5-faceZ90.png');

  // ── Test 3: directly set cube transform and screenshot face 5 ──────────
  await page.evaluate(() => {
    const id = 'diag-style'; let el = document.getElementById(id);
    el.textContent = '';
  });
  // freeze cube at face5 stop, then test different transforms on cube
  const cubeTransforms = [
    'rotateX(-180deg) rotateY(-270deg)',  // original
    'rotateX(90deg) rotateY(-270deg)',    // try rx=+90
    'rotateX(-90deg) rotateY(-90deg)',    // try different ry
    'rotateX(180deg) rotateY(-270deg)',   // positive 180
  ];
  for (let t = 0; t < cubeTransforms.length; t++) {
    const ct = cubeTransforms[t];
    await page.evaluate((transform) => {
      const cube = document.getElementById('cube');
      if (cube) cube.style.transform = transform;
    }, ct);
    await page.waitForTimeout(600);
    const p = `${DIR}\\pw-diag-face5-cube${t}.png`;
    await page.screenshot({ path: p, fullPage: false });
    console.log(`Test 3.${t}: cube="${ct}" → ${p}`);
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
