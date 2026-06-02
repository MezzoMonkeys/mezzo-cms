const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  console.log('Navigating to https://mezzo-html.vercel.app/our-work ...');
  await page.goto('https://mezzo-html.vercel.app/our-work', { waitUntil: 'networkidle' });
  console.log('Page loaded.\n');

  // ── Screenshot 1: initial load ──────────────────────────────────────────────
  await page.screenshot({ path: 'pw-screenshot-1-initial.png', fullPage: false });
  console.log('Screenshot 1 saved: pw-screenshot-1-initial.png');

  // ── Evaluate initial metrics ────────────────────────────────────────────────
  const initialMetrics = await page.evaluate(() => {
    const cubeGallery = document.querySelector('#cube-gallery');
    const scrollSpacer = document.querySelector('.cube-gallery__scroll');
    const scene = document.querySelector('.cube-gallery__scene');
    const cube = document.querySelector('#cube');
    const infoCards = document.querySelectorAll('.cube-info-card');
    const facesWithImg = document.querySelectorAll('.cube__face img');

    const sceneStyle = scene ? window.getComputedStyle(scene) : null;
    const cubeStyle = cube ? window.getComputedStyle(cube) : null;

    const cubeGalleryRect = cubeGallery ? cubeGallery.getBoundingClientRect() : null;
    const scrollSpacerRect = scrollSpacer ? scrollSpacer.getBoundingClientRect() : null;
    const sceneRect = scene ? scene.getBoundingClientRect() : null;

    return {
      cubeGalleryHeight: cubeGalleryRect ? cubeGalleryRect.height : 'NOT FOUND',
      cubeGalleryOffsetHeight: cubeGallery ? cubeGallery.offsetHeight : 'NOT FOUND',
      scrollSpacerHeight: scrollSpacerRect ? scrollSpacerRect.height : 'NOT FOUND',
      scrollSpacerOffsetHeight: scrollSpacer ? scrollSpacer.offsetHeight : 'NOT FOUND',
      sceneExists: !!scene,
      scenePosition: sceneStyle ? sceneStyle.position : 'NOT FOUND',
      sceneHeight: sceneStyle ? sceneStyle.height : 'NOT FOUND',
      sceneTop: sceneStyle ? sceneStyle.top : 'NOT FOUND',
      sceneRect: sceneRect ? {
        top: sceneRect.top,
        bottom: sceneRect.bottom,
        left: sceneRect.left,
        right: sceneRect.right,
        width: sceneRect.width,
        height: sceneRect.height,
      } : 'NOT FOUND',
      cubeExists: !!cube,
      cubeTransform: cubeStyle ? cubeStyle.transform : 'NOT FOUND',
      infoCardCount: infoCards.length,
      facesWithImgCount: facesWithImg.length,
      pageScrollHeight: document.documentElement.scrollHeight,
      pageClientHeight: document.documentElement.clientHeight,
    };
  });

  console.log('\n=== INITIAL METRICS (before scroll) ===');
  console.log('Page scrollHeight:                    ', initialMetrics.pageScrollHeight);
  console.log('Page clientHeight:                    ', initialMetrics.pageClientHeight);
  console.log('cube-gallery section height (getBCR):', initialMetrics.cubeGalleryHeight);
  console.log('cube-gallery section offsetHeight:   ', initialMetrics.cubeGalleryOffsetHeight);
  console.log('scroll spacer height (getBCR):       ', initialMetrics.scrollSpacerHeight);
  console.log('scroll spacer offsetHeight:          ', initialMetrics.scrollSpacerOffsetHeight);
  console.log('scene exists:                        ', initialMetrics.sceneExists);
  console.log('scene position:                      ', initialMetrics.scenePosition);
  console.log('scene height (computed):             ', initialMetrics.sceneHeight);
  console.log('scene top (computed):                ', initialMetrics.sceneTop);
  console.log('scene getBoundingClientRect:         ', JSON.stringify(initialMetrics.sceneRect));
  console.log('cube exists:                         ', initialMetrics.cubeExists);
  console.log('cube transform:                      ', initialMetrics.cubeTransform);
  console.log('.cube-info-card count:               ', initialMetrics.infoCardCount);
  console.log('.cube__face with img count:          ', initialMetrics.facesWithImgCount);

  console.log('\n=== CONSOLE ERRORS (at load) ===');
  if (consoleErrors.length === 0) {
    console.log('None');
  } else {
    consoleErrors.forEach(e => console.log(' -', e));
  }

  // ── Scroll 1: 300px ─────────────────────────────────────────────────────────
  console.log('\n--- Scrolling to 300px ---');
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshot-2-scroll300.png', fullPage: false });
  console.log('Screenshot 2 saved: pw-screenshot-2-scroll300.png');

  const metrics300 = await page.evaluate(() => {
    const scene = document.querySelector('.cube-gallery__scene');
    const cube = document.querySelector('#cube');
    const cubeStyle = cube ? window.getComputedStyle(cube) : null;
    const sceneRect = scene ? scene.getBoundingClientRect() : null;
    return {
      scrollY: window.scrollY,
      cubeTransform: cubeStyle ? cubeStyle.transform : 'NOT FOUND',
      sceneRect: sceneRect ? {
        top: sceneRect.top,
        bottom: sceneRect.bottom,
        width: sceneRect.width,
        height: sceneRect.height,
      } : 'NOT FOUND',
    };
  });
  console.log('scrollY:                             ', metrics300.scrollY);
  console.log('cube transform:                      ', metrics300.cubeTransform);
  console.log('scene getBoundingClientRect:         ', JSON.stringify(metrics300.sceneRect));

  // ── Scroll 2: 800px ─────────────────────────────────────────────────────────
  console.log('\n--- Scrolling to 800px ---');
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshot-3-scroll800.png', fullPage: false });
  console.log('Screenshot 3 saved: pw-screenshot-3-scroll800.png');

  const metrics800 = await page.evaluate(() => {
    const scene = document.querySelector('.cube-gallery__scene');
    const cube = document.querySelector('#cube');
    const cubeStyle = cube ? window.getComputedStyle(cube) : null;
    const sceneRect = scene ? scene.getBoundingClientRect() : null;
    return {
      scrollY: window.scrollY,
      cubeTransform: cubeStyle ? cubeStyle.transform : 'NOT FOUND',
      sceneRect: sceneRect ? {
        top: sceneRect.top,
        bottom: sceneRect.bottom,
        width: sceneRect.width,
        height: sceneRect.height,
      } : 'NOT FOUND',
    };
  });
  console.log('scrollY:                             ', metrics800.scrollY);
  console.log('cube transform:                      ', metrics800.cubeTransform);
  console.log('scene getBoundingClientRect:         ', JSON.stringify(metrics800.sceneRect));

  // ── Scroll 3: deeper into cube-gallery (if tall enough) ─────────────────────
  const deepScroll = Math.round((initialMetrics.pageScrollHeight || 5000) * 0.4);
  console.log(`\n--- Scrolling to ${deepScroll}px (40% of page) ---`);
  await page.evaluate((y) => window.scrollTo(0, y), deepScroll);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshot-4-deep.png', fullPage: false });
  console.log(`Screenshot 4 saved: pw-screenshot-4-deep.png`);

  const metricsDeep = await page.evaluate(() => {
    const scene = document.querySelector('.cube-gallery__scene');
    const cube = document.querySelector('#cube');
    const cubeStyle = cube ? window.getComputedStyle(cube) : null;
    const sceneRect = scene ? scene.getBoundingClientRect() : null;
    return {
      scrollY: window.scrollY,
      cubeTransform: cubeStyle ? cubeStyle.transform : 'NOT FOUND',
      sceneRect: sceneRect ? {
        top: sceneRect.top,
        bottom: sceneRect.bottom,
        width: sceneRect.width,
        height: sceneRect.height,
      } : 'NOT FOUND',
    };
  });
  console.log('scrollY:                             ', metricsDeep.scrollY);
  console.log('cube transform:                      ', metricsDeep.cubeTransform);
  console.log('scene getBoundingClientRect:         ', JSON.stringify(metricsDeep.sceneRect));

  // ── Console errors at end ───────────────────────────────────────────────────
  console.log('\n=== ALL CONSOLE ERRORS (full session) ===');
  if (consoleErrors.length === 0) {
    console.log('None');
  } else {
    consoleErrors.forEach(e => console.log(' -', e));
  }

  // ── Stickiness analysis ─────────────────────────────────────────────────────
  console.log('\n=== STICKINESS ANALYSIS ===');
  console.log('Position should be "sticky" and scene top in getBCR should hover near 0 when inside scroll zone.');
  const r0 = initialMetrics.sceneRect;
  const r300 = metrics300.sceneRect;
  const r800 = metrics800.sceneRect;
  const rDeep = metricsDeep.sceneRect;
  console.log('scene.top at scroll=0:      ', r0 !== 'NOT FOUND' ? r0.top : 'N/A');
  console.log('scene.top at scroll=300:    ', r300 !== 'NOT FOUND' ? r300.top : 'N/A');
  console.log('scene.top at scroll=800:    ', r800 !== 'NOT FOUND' ? r800.top : 'N/A');
  console.log(`scene.top at scroll=${deepScroll}: `, rDeep !== 'NOT FOUND' ? rDeep.top : 'N/A');

  await browser.close();
  console.log('\nDone. Screenshots saved to current directory.');
})();
