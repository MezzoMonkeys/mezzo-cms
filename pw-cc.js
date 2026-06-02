import { chromium } from 'playwright';

const BASE = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/';
const DIR  = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

  const deployed = await page.evaluate(async () => {
    const s = [...document.querySelectorAll('script[src]')].find(s => s.src.includes('main.js'));
    if (!s) return false;
    const txt = await fetch(s.src).then(r => r.text());
    return txt.includes('counter-clip');
  });
  console.log('Counter-clip fix live:', deployed);

  const top = await page.evaluate(() => {
    const el = document.querySelector('.services-section');
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 1345;
  });

  const shots = [
    ['01-panel1',    top + 50],
    ['02-mid',       top + 450],
    ['03-panel2',    top + 950],
    ['04-mid-p2p3',  top + 1350],
  ];

  for (const [label, y] of shots) {
    await page.evaluate(sy => window.scrollTo({ top: sy, behavior: 'instant' }), y);
    await page.waitForTimeout(700);
    const path = DIR + '\\pw-cc-' + label + '.png';
    await page.screenshot({ path });
    console.log('Saved:', path);
  }

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
