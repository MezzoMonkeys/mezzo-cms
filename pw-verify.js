import { chromium } from 'playwright';

const URL = 'https://mezzo-html.vercel.app/our-work';
const POLL_INTERVAL = 15000; // 15 seconds
const TIMEOUT = 3 * 60 * 1000; // 3 minutes

async function pollForNewVersion(page) {
  console.log('Polling for new deployment (overflow-x: clip on site-shell)...');
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < TIMEOUT) {
    attempt++;
    try {
      await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

      const overflowX = await page.evaluate(() => {
        const el = document.querySelector('.site-shell');
        if (!el) return null;
        return window.getComputedStyle(el).overflowX;
      });

      console.log(`  Attempt ${attempt}: site-shell overflow-x = "${overflowX}"`);

      if (overflowX === 'clip') {
        console.log('  New version detected (overflow-x: clip)!\n');
        return true;
      }
    } catch (e) {
      console.log(`  Attempt ${attempt}: Error - ${e.message}`);
    }

    if (Date.now() - start + POLL_INTERVAL < TIMEOUT) {
      console.log(`  Waiting ${POLL_INTERVAL / 1000}s before next poll...`);
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
    } else {
      break;
    }
  }

  console.log('  Timed out waiting for new version. Proceeding with current version.\n');
  return false;
}

async function runChecks() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Step 1: Poll for new deployment
  const isNewVersion = await pollForNewVersion(page);

  // Navigate fresh and wait for network idle
  console.log('Step 1: Navigate to page and wait for network idle...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('  Page loaded.\n');

  // Helper: get cube scene info
  async function getCubeInfo(scrollY) {
    return page.evaluate(() => {
      const scene = document.querySelector('.cube-gallery__scene');
      const cube = document.querySelector('.cube');
      const activeCards = document.querySelectorAll('.cube-info-card.is-active');
      const pastCards = document.querySelectorAll('.cube-info-card.is-past');

      if (!scene) return { error: 'No .cube-gallery__scene found' };

      const rect = scene.getBoundingClientRect();
      const transform = cube ? window.getComputedStyle(cube).transform : 'N/A';
      const position = window.getComputedStyle(scene).position;

      return {
        sceneTop: rect.top,
        sceneBottom: rect.bottom,
        sceneHeight: rect.height,
        scenePosition: position,
        cubeTransform: transform,
        activeCardCount: activeCards.length,
        pastCardCount: pastCards.length,
      };
    });
  }

  // Step 2: Scroll to y=1500
  console.log('Step 2: Scrolling to y=1500...');
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
  await page.waitForTimeout(500);

  const info1500 = await getCubeInfo(1500);
  console.log('  At scroll y=1500:');
  console.log(`    scene.top        = ${info1500.sceneTop}`);
  console.log(`    scene.position   = ${info1500.scenePosition}`);
  console.log(`    cube transform   = ${info1500.cubeTransform}`);
  console.log(`    is-active cards  = ${info1500.activeCardCount}`);
  console.log(`    is-past cards    = ${info1500.pastCardCount}`);

  const sticky1500 = Math.abs(info1500.sceneTop) < 5; // allow ~5px tolerance
  console.log(`    sticky working?  = ${sticky1500 ? 'YES (top ≈ 0)' : 'NO (top = ' + info1500.sceneTop + ')'}\n`);

  // Step 4: Screenshot at y=1500
  const shot1 = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms\\pw-verify-1500.png';
  await page.screenshot({ path: shot1, fullPage: false });
  console.log(`  Screenshot saved: ${shot1}\n`);

  // Step 5: Scroll to y=3000
  console.log('Step 5: Scrolling to y=3000...');
  await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }));
  await page.waitForTimeout(500);

  const info3000 = await getCubeInfo(3000);
  console.log('  At scroll y=3000:');
  console.log(`    scene.top        = ${info3000.sceneTop}`);
  console.log(`    scene.position   = ${info3000.scenePosition}`);
  console.log(`    cube transform   = ${info3000.cubeTransform}`);
  console.log(`    is-active cards  = ${info3000.activeCardCount}`);
  console.log(`    is-past cards    = ${info3000.pastCardCount}`);

  const sticky3000 = Math.abs(info3000.sceneTop) < 5;
  console.log(`    sticky working?  = ${sticky3000 ? 'YES (top ≈ 0)' : 'NO (top = ' + info3000.sceneTop + ')'}\n`);

  const shot2 = 'm:\\MEZZO\\MARKETING\\WEBSITE\\mezzo-cms\\pw-verify-3000.png';
  await page.screenshot({ path: shot2, fullPage: false });
  console.log(`  Screenshot saved: ${shot2}\n`);

  // Step 6: Log cube transforms
  console.log('Step 6: Cube transform summary:');
  console.log(`  At scroll 1500: ${info1500.cubeTransform}`);
  console.log(`  At scroll 3000: ${info3000.cubeTransform}`);
  const rotating = info1500.cubeTransform !== info3000.cubeTransform;
  console.log(`  Cube rotating?   = ${rotating ? 'YES (transforms differ)' : 'MAYBE NOT (transforms identical)'}\n`);

  // Step 7: Info card counts
  console.log('Step 7: Info card counts at scroll 3000:');
  console.log(`  .cube-info-card.is-active: ${info3000.activeCardCount}`);
  console.log(`  .cube-info-card.is-past:   ${info3000.pastCardCount}\n`);

  // Final verdict
  console.log('=== FINAL VERDICT ===');
  console.log(`  New deployment detected:   ${isNewVersion ? 'YES' : 'NO (timed out, tested current version)'}`);
  console.log(`  Sticky at scroll 1500:     ${sticky1500 ? 'PASS' : 'FAIL'}`);
  console.log(`  Sticky at scroll 3000:     ${sticky3000 ? 'PASS' : 'FAIL'}`);
  console.log(`  Cube rotating:             ${rotating ? 'PASS' : 'UNCERTAIN'}`);
  console.log(`  Overall sticky fix:        ${sticky1500 && sticky3000 ? 'WORKING' : 'NOT WORKING'}`);

  await browser.close();
}

runChecks().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
