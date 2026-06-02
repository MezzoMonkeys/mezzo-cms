import { chromium } from 'playwright';

const URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/our-work/';
const DIR = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';

// Corrections to try for face 4 (top) and face 5 (bottom)
const TRIES = [
  { top: 'rotateZ(90deg)',   bot: 'rotateZ(-90deg)' },
  { top: 'rotateZ(-90deg)',  bot: 'rotateZ(90deg)'  },
  { top: 'rotateZ(90deg)',   bot: 'rotateZ(180deg)' },
  { top: 'rotateZ(180deg)',  bot: 'rotateZ(180deg)' },
];

async function scrollToFace(page, faceIdx, n, sectionTop, sectionHeight) {
  const scrollable = sectionHeight - 900;
  const progress = (faceIdx + 0.5) / n;
  const y = sectionTop + progress * scrollable;
  await page.evaluate(sy => window.scrollTo({ top: sy, behavior: 'instant' }), y);
  await page.waitForTimeout(900);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  console.log('Loading…');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 40000 });
  await page.waitForTimeout(1500);

  const { sectionTop, sectionHeight, n } = await page.evaluate(() => {
    const s = document.getElementById('cube-gallery');
    return { sectionTop: Math.round(s.getBoundingClientRect().top + window.scrollY), sectionHeight: s.offsetHeight, n: document.querySelectorAll('.cube-info-card').length };
  });

  for (let t = 0; t < TRIES.length; t++) {
    const { top, bot } = TRIES[t];
    const label = `top:${top}  bot:${bot}`;

    // Inject CSS correction
    await page.evaluate(({ top, bot }) => {
      const id = 'pw-fix-style';
      let el = document.getElementById(id);
      if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
      el.textContent = `
        .cube__face--top    img { transform: ${top} !important; }
        .cube__face--bottom img { transform: ${bot} !important; }
      `;
    }, { top, bot });

    // Screenshot face 4
    await scrollToFace(page, 4, n, sectionTop, sectionHeight);
    const p4 = `${DIR}\\pw-fix-t${t}-face4.png`;
    await page.screenshot({ path: p4, fullPage: false });

    // Screenshot face 5
    await scrollToFace(page, 5, n, sectionTop, sectionHeight);
    const p5 = `${DIR}\\pw-fix-t${t}-face5.png`;
    await page.screenshot({ path: p5, fullPage: false });

    console.log(`Try ${t}: ${label}`);
    console.log(`  face4 → ${p4}`);
    console.log(`  face5 → ${p5}`);
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
