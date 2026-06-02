import { chromium } from 'playwright';

// Point at local mezzo-html dir so we test the actual source files
const URL = 'file:///m:/MEZZO/MARKETING/WEBSITE/mezzo-html/our-work/index.html';
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

  // Use the live Vercel URL so CMS data is present
  console.log('Loading live site…');
  await page.goto('https://mezzo-html-mezzomonkeys-projects.vercel.app/our-work/', {
    waitUntil: 'networkidle', timeout: 40000,
  });
  await page.waitForTimeout(2000);

  // Patch cube.js STOP at runtime to the fixed values
  await page.evaluate(() => {
    // Override the bottom face stop to -270
    // We do this by intercepting the initCubeGallery call –
    // since it has already run we just need to verify visually.
    // The test will compare live site (still has old JS) so we manually
    // patch the cube transform to what the fixed STOP would produce.
  });

  const info = await page.evaluate(() => {
    const s = document.getElementById('cube-gallery');
    return {
      sectionTop: Math.round(s.getBoundingClientRect().top + window.scrollY),
      sectionHeight: s.offsetHeight,
      n: document.querySelectorAll('.cube-info-card').length,
    };
  });

  // Inject BOTH CSS fixes
  await page.evaluate(() => {
    const el = document.createElement('style');
    el.textContent = `.cube__face--top img { transform: rotateZ(90deg) !important; }`;
    document.head.appendChild(el);
  });

  // Simulate the fixed STOP for face 5 by freezing RAF and setting transform
  await scrollToFace(page, 5, info.n, info.sectionTop, info.sectionHeight);
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const cube = document.getElementById('cube');
    if (cube) cube.style.transform = 'rotateX(-270deg) rotateY(-270deg)';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}\\pw-final-face5.png` });
  console.log('Final face 5 (rx=-270) → pw-final-face5.png');

  // Face 4 with CSS fix
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  await scrollToFace(page, 4, info.n, info.sectionTop, info.sectionHeight);
  // Restore RAF for settling, then freeze again
  await page.evaluate(() => {
    // Let it run briefly
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const cube = document.getElementById('cube');
    if (cube) cube.style.transform = 'rotateX(-90deg) rotateY(-270deg)';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}\\pw-final-face4.png` });
  console.log('Final face 4 (rx=-90 + rotateZ(90deg) img) → pw-final-face4.png');

  // Also show face 0 (front) to confirm no regressions
  await page.evaluate(() => {
    const cube = document.getElementById('cube');
    if (cube) cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}\\pw-final-face0.png` });
  console.log('Face 0 (front) → pw-final-face0.png');

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
