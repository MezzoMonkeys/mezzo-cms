import { chromium } from 'playwright';

const URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/our-work/';
const DIR = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';

// Broader set of candidates for the bottom face (face 5)
const TRIES = [
  { label: 'scaleX(-1)',                  top: 'rotateZ(90deg)', bot: 'scaleX(-1)' },
  { label: 'scaleY(-1)',                  top: 'rotateZ(90deg)', bot: 'scaleY(-1)' },
  { label: 'scaleX(-1) rotateZ(90deg)',   top: 'rotateZ(90deg)', bot: 'scaleX(-1) rotateZ(90deg)' },
  { label: 'scaleX(-1) rotateZ(-90deg)',  top: 'rotateZ(90deg)', bot: 'scaleX(-1) rotateZ(-90deg)' },
  { label: 'scaleY(-1) rotateZ(90deg)',   top: 'rotateZ(90deg)', bot: 'scaleY(-1) rotateZ(90deg)' },
  { label: 'scaleY(-1) rotateZ(-90deg)',  top: 'rotateZ(90deg)', bot: 'scaleY(-1) rotateZ(-90deg)' },
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
    const { label, top, bot } = TRIES[t];

    await page.evaluate(({ top, bot }) => {
      const id = 'pw-fix-style';
      let el = document.getElementById(id);
      if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
      el.textContent = `
        .cube__face--top    img { transform: ${top} !important; }
        .cube__face--bottom img { transform: ${bot} !important; }
      `;
    }, { top, bot });

    await scrollToFace(page, 5, n, sectionTop, sectionHeight);
    const p5 = `${DIR}\\pw-fix2-t${t}-face5.png`;
    await page.screenshot({ path: p5, fullPage: false });
    console.log(`Try ${t} [${label}]  → ${p5}`);
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
