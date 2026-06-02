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

    return {
      cubeGalleryHeight: cubeGallery ? cubeGallery.getBoundingClientRect().height : 'NOT FOUND',
      cubeGalleryOffsetHeight: cubeGallery ? cubeGallery.offsetHeight : 'NOT FOUND',
      scrollSpacerHeight: scrollSpacer ? scrollSpacer.getBoundingClientRect().height : 'NOT FOUND',
      scrollSpacerOffsetHeight: scrollSpacer ? scrollSpacer.offsetHeight : 'NOT FOUND',
      sceneExists: !!scene,
      scenePosition: sceneStyle ? sceneStyle.position : 'NOT FOUND',
      sceneHeight: sceneStyle ? sceneStyle.height : 'NOT FOUND',
      sceneTop: sceneStyle ? sceneStyle.top : 'NOT FOUND',
      sceneRect: scene ? JSON.stringify(scene.getBoundingClientRect()) : 'NOT FOUND',
      cubeExists: !!cube,
      cubeTransform: cubeStyle ? cubeStyle.transform : 'NOT FOUND',
      infoCardCount: infoCards.length,
      facesWithImgCount: facesWithImg.length,
    };
  });

  console.log('\n=== INITIAL METRICS (before scroll) ===');
  console.log('cube-gallery section height (getBCR):', initialMetrics.cubeGalleryHeight);
  console.log('cube-gallery section offsetHeight:    ', initialMetrics.cubeGalleryOffsetHeight);
  console.log('scroll spacer height (getBCR):        ', initialMetrics.scrollSpacerHeight);
  console.log('scroll spacer offsetHeight:           ', initialMetrics.scrollSpacerOffsetHeight);
  console.log('scene exists:                         ', initialMetrics.sceneExists);
  console.log('scene position:                       ', initialMetrics.scenePosition);
  console.log('scene height (computed):              ', initialMetrics.sceneHeight);
  console.log('scene top (computed):                 ', initialMetrics.sceneTop);
  console.log('scene getBoundingClientRect:          ', initialMetrics.sceneRect);
  console.log('cube exists:                          ', initialMetrics.cubeExists);
  console.log('cube transform:                       ', initialMetrics.cubeTransform);
  console.log('.cube-info-card count:                ', initialMetrics.infoCardCount);
  console.log('.cube__face with img count:           ', initialMetrics.facesWithImgCount);

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
    return {
      scrollY: window.scrollY,
      cubeTransform: cubeStyle ? cubeStyle.transform : 'NOT FOUND',
      sceneRect: scene ? JSON.stringify(scene.getBoundingClientRect()) : 'NOT FOUND',
    };
  });
  console.log('scrollY:                              ', metrics300.scrollY);
  console.log('cube transform:                       ', metrics300.cubeTransform);
  console.log('scene getBoundingClientRect:          ', metrics300.sceneRect);

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
    return {
      scrollY: window.scrollY,
      cubeTransform: cubeStyle ? cubeStyle.transform : 'NOT FOUND',
      sceneRect: scene ? JSON.stringify(scene.getBoundingClientRect()) : 'NOT FOUND',
    };
  });
  console.log('scrollY:                              ', metrics800.scrollY);
  console.log('cube transform:                       ', metrics800.cubeTransform);
  console.log('scene getBoundingClientRect:          ', metrics800.sceneRect);

  // ── Console errors at end ───────────────────────────────────────────────────
  console.log('\n=== ALL CONSOLE ERRORS (full session) ===');
  if (consoleErrors.length === 0) {
    console.log('None');
  } else {
    consoleErrors.forEach(e => console.log(' -', e));
  }

  // ── Stickiness analysis ─────────────────────────────────────────────────────
  console.log('\n=== STICKINESS ANALYSIS ===');
  console.log('If scene is sticky (position: sticky, top: 0), its top in getBCR should stay ~0');
  console.log('Initial scene rect top: ', JSON.parse(initialMetrics.sceneRect || '{}').top);
  console.log('At 300px scroll scene rect top: ', JSON.parse(metrics300.sceneRect || '{}').top);
  console.log('At 800px scroll scene rect top: ', JSON.parse(metrics800.sceneRect || '{}').top);

  await browser.close();
  console.log('\nDone.');
})();
