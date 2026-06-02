import { chromium } from 'playwright';

const URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/';
const SHOTS_DIR = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms';

async function waitForDeploy(page, maxMs = 180000) {
  const deadline = Date.now() + maxMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    const hasCrossfade = await page.evaluate(() => {
      const src = [...document.querySelectorAll('script')].find(s => s.src && s.src.includes('main.js'));
      return !!src;
    });
    // Check for the crossfade fix by inspecting the script source
    const fixed = await page.evaluate(async () => {
      const scripts = [...document.querySelectorAll('script[src]')];
      for (const s of scripts) {
        if (!s.src.includes('main.js')) continue;
        try {
          const r = await fetch(s.src);
          const txt = await r.text();
          return txt.includes('prevBody') && txt.includes('nextBody');
        } catch { return false; }
      }
      return false;
    });
    console.log(`Attempt ${attempt}: crossfade fix deployed = ${fixed}`);
    if (fixed) return true;
    if (Date.now() + 15000 < deadline) await new Promise(r => setTimeout(r, 15000));
  }
  return false;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  console.log('Waiting for deployment...');
  const deployed = await waitForDeploy(page);
  console.log(deployed ? '✓ New version live\n' : '⚠ Timed out, testing current version\n');

  const servicesTop = await page.evaluate(() => {
    const el = document.querySelector('.services-section');
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 1345;
  });

  const shots = [
    { label: '01-panel1',        y: servicesTop + 50 },
    { label: '02-mid-transition', y: servicesTop + 450 },
    { label: '03-panel2',        y: servicesTop + 950 },
    { label: '04-mid-p2-p3',    y: servicesTop + 1350 },
    { label: '05-panel4',        y: servicesTop + 2650 },
  ];

  for (const { label, y } of shots) {
    await page.evaluate(sy => window.scrollTo({ top: sy, behavior: 'instant' }), y);
    await page.waitForTimeout(700);
    const path = `${SHOTS_DIR}\\pw-fix-${label}.png`;
    await page.screenshot({ path, fullPage: false });
    console.log(`[${label}] scrollY=${y}  →  ${path}`);
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
