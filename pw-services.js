import { chromium } from 'playwright';

const URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app/';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Loading homepage...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Find where the services section starts
  const servicesTop = await page.evaluate(() => {
    const el = document.querySelector('.services-section');
    if (!el) return null;
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  });
  console.log(`Services section starts at scrollY ~${servicesTop}px`);

  const shots = [
    { label: '00-initial',   y: 0 },
    { label: '01-services',  y: servicesTop },
    { label: '02-panel2',    y: servicesTop + 400 },
    { label: '03-panel3',    y: servicesTop + 800 },
  ];

  for (const { label, y } of shots) {
    await page.evaluate(scrollY => window.scrollTo({ top: scrollY, behavior: 'instant' }), y);
    await page.waitForTimeout(600);

    const panelInfo = await page.evaluate(() => {
      const panels = Array.from(document.querySelectorAll('.service-panel'));
      return panels.map((p, i) => {
        const body = p.querySelector('.service-panel__body');
        const bodyRect = body ? body.getBoundingClientRect() : null;
        const panelRect = p.getBoundingClientRect();
        return {
          panel: i + 1,
          panelTop: Math.round(panelRect.top),
          panelH: Math.round(panelRect.height),
          bodyTop: bodyRect ? Math.round(bodyRect.top) : null,
          bodyH: bodyRect ? Math.round(bodyRect.height) : null,
          verticalCenter: bodyRect ? Math.round(bodyRect.top + bodyRect.height / 2) : null,
        };
      });
    });

    const path = `m:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms\\pw-svc-${label}.png`;
    await page.screenshot({ path, fullPage: false });
    console.log(`\n[${label}] scrollY=${y}  →  ${path}`);
    panelInfo.forEach(p => {
      if (p.bodyTop !== null) {
        const overlap = p.bodyTop < 0 || p.bodyTop + p.bodyH > 900;
        console.log(`  Panel ${p.panel}: body top=${p.bodyTop} height=${p.bodyH} midpoint=${p.verticalCenter} ${overlap ? '⚠ CLIPPED' : ''}`);
      }
    });
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
