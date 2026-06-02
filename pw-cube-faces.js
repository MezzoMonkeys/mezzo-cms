import { chromium } from 'playwright';

const URL   = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/our-work/';
const DIR   = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';
const VW    = 1440;
const VH    = 900;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH } });
  const page = await ctx.newPage();

  console.log('Loading Our Work page...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 40000 });
  await page.waitForTimeout(2000);

  // Find section top and scrollable range
  const { sectionTop, sectionHeight, n } = await page.evaluate(() => {
    const section = document.getElementById('cube-gallery');
    if (!section) return { sectionTop: 0, sectionHeight: 0, n: 0 };
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    // count rendered cube info cards to get n
    const cards = document.querySelectorAll('.cube-info-card');
    return {
      sectionTop: Math.round(rect.top + window.scrollY),
      sectionHeight: section.offsetHeight,
      scrollable,
      n: cards.length,
    };
  });

  console.log(`Section top: ${sectionTop}, height: ${sectionHeight}, items: ${n}`);

  const scrollable = sectionHeight - VH;

  // Take a screenshot at the centre of each face's progress range
  for (let i = 0; i < n; i++) {
    const progress = (i + 0.5) / n;
    const pageScroll = sectionTop + progress * scrollable;

    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), pageScroll);
    await page.waitForTimeout(900);   // let the RAF animation settle

    // Capture which face is active and its rotation
    const info = await page.evaluate(() => {
      const cube = document.getElementById('cube');
      return {
        transform: cube ? cube.style.transform : '',
        activeCard: [...document.querySelectorAll('.cube-info-card')].findIndex(c => c.classList.contains('is-active')),
      };
    });

    const path = `${DIR}\\pw-face-${String(i).padStart(2,'0')}.png`;
    await page.screenshot({ path, fullPage: false });
    console.log(`Face ${i}: scroll=${Math.round(pageScroll)}  transform="${info.transform}"  activeCard=${info.activeCard}  → ${path}`);
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
