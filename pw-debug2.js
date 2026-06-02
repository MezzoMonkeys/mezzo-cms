import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to https://mezzo-html.vercel.app/our-work ...');
  await page.goto('https://mezzo-html.vercel.app/our-work', { waitUntil: 'networkidle' });
  console.log('Page loaded.\n');

  // ─── Step 2: Walk up the DOM from .cube-gallery__scene ───────────────────────
  console.log('=== STEP 2: Ancestor overflow audit for .cube-gallery__scene ===\n');
  const ancestors = await page.evaluate(() => {
    const el = document.querySelector('.cube-gallery__scene');
    if (!el) return [{ error: '.cube-gallery__scene not found' }];
    const results = [];
    let node = el.parentElement;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      results.push({
        tag: node.tagName,
        id: node.id,
        className: node.className.substring(0, 60),
        overflow: cs.overflow,
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        display: cs.display,
        position: cs.position,
        height: cs.height
      });
      node = node.parentElement;
    }
    return results;
  });

  if (ancestors.length === 0) {
    console.log('  No ancestors found (or .cube-gallery__scene is a direct child of body).');
  } else {
    ancestors.forEach((a, i) => {
      const nonVisible =
        (a.overflow && a.overflow !== 'visible') ||
        (a.overflowX && a.overflowX !== 'visible') ||
        (a.overflowY && a.overflowY !== 'visible');
      const marker = nonVisible ? ' <-- NON-VISIBLE OVERFLOW' : '';
      console.log(`  [${i}] <${a.tag}> id="${a.id}" class="${a.className}"${marker}`);
      console.log(`       overflow: ${a.overflow} | overflow-x: ${a.overflowX} | overflow-y: ${a.overflowY}`);
      console.log(`       display: ${a.display} | position: ${a.position} | height: ${a.height}`);
    });
  }

  // ─── Step 3a: Scroll via window.scrollTo and measure scroll containers ───────
  console.log('\n=== STEP 3a: Scroll via window.scrollTo(0, 500) ===\n');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);

  const scrollCheck1 = await page.evaluate(() => {
    return {
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop,
      siteShellScrollTop: document.querySelector('.site-shell')
        ? document.querySelector('.site-shell').scrollTop
        : 'no element',
      siteShellOverflow: document.querySelector('.site-shell')
        ? getComputedStyle(document.querySelector('.site-shell')).overflow
        : 'no element'
    };
  });
  console.log('  After window.scrollTo(0, 500):');
  console.log('    window.scrollY:              ', scrollCheck1.windowScrollY);
  console.log('    document.documentElement.scrollTop:', scrollCheck1.documentScrollTop);
  console.log('    document.body.scrollTop:     ', scrollCheck1.bodyScrollTop);
  console.log('    .site-shell scrollTop:       ', scrollCheck1.siteShellScrollTop);
  console.log('    .site-shell overflow:        ', scrollCheck1.siteShellOverflow);

  // ─── Step 3b: Scroll via .site-shell.scrollTop and re-measure ────────────────
  console.log('\n=== STEP 3b: Scroll via .site-shell.scrollTop = 500 ===\n');
  await page.evaluate(() => {
    const shell = document.querySelector('.site-shell');
    if (shell) shell.scrollTop = 500;
  });
  await page.waitForTimeout(500);

  const scrollCheck2 = await page.evaluate(() => {
    return {
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop,
      siteShellScrollTop: document.querySelector('.site-shell')
        ? document.querySelector('.site-shell').scrollTop
        : 'no element',
      siteShellOverflow: document.querySelector('.site-shell')
        ? getComputedStyle(document.querySelector('.site-shell')).overflow
        : 'no element'
    };
  });
  console.log('  After .site-shell.scrollTop = 500:');
  console.log('    window.scrollY:              ', scrollCheck2.windowScrollY);
  console.log('    document.documentElement.scrollTop:', scrollCheck2.documentScrollTop);
  console.log('    document.body.scrollTop:     ', scrollCheck2.bodyScrollTop);
  console.log('    .site-shell scrollTop:       ', scrollCheck2.siteShellScrollTop);
  console.log('    .site-shell overflow:        ', scrollCheck2.siteShellOverflow);

  // ─── Step 4: Extended scroll-container hunt (check ALL scrollable elements) ──
  console.log('\n=== STEP 4: Full-page scrollable element scan ===\n');
  const scrollables = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const found = [];
    for (const el of all) {
      const cs = getComputedStyle(el);
      const ox = cs.overflowX;
      const oy = cs.overflowY;
      if (
        (ox === 'auto' || ox === 'scroll' || ox === 'hidden') ||
        (oy === 'auto' || oy === 'scroll' || oy === 'hidden')
      ) {
        found.push({
          tag: el.tagName,
          id: el.id,
          className: el.className ? el.className.toString().substring(0, 70) : '',
          overflowX: ox,
          overflowY: oy,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          isScrollContainer: el.scrollHeight > el.clientHeight
        });
      }
    }
    return found;
  });

  console.log(`  Found ${scrollables.length} elements with non-visible overflow:\n`);
  scrollables.forEach((el, i) => {
    const scrollable = el.isScrollContainer ? ' [SCROLL CONTAINER - scrollHeight > clientHeight]' : '';
    console.log(`  [${i}] <${el.tag}> id="${el.id}" class="${el.className}"`);
    console.log(`       overflow-x: ${el.overflowX} | overflow-y: ${el.overflowY}${scrollable}`);
    if (el.isScrollContainer) {
      console.log(`       scrollHeight: ${el.scrollHeight} | clientHeight: ${el.clientHeight}`);
    }
  });

  // ─── Step 5: Summary ──────────────────────────────────────────────────────────
  console.log('\n=== SUMMARY ===\n');

  const culprits = ancestors.filter(a =>
    (a.overflow && a.overflow !== 'visible') ||
    (a.overflowX && a.overflowX !== 'visible') ||
    (a.overflowY && a.overflowY !== 'visible')
  );

  if (culprits.length === 0) {
    console.log('  No non-visible overflow found in direct ancestors of .cube-gallery__scene.');
    console.log('  The sticky-breaking scroll container may be on <body> or <html>, or a JS-driven custom scroller.');
  } else {
    console.log('  CULPRIT ANCESTOR(S) breaking position:sticky:\n');
    culprits.forEach(a => {
      console.log(`    <${a.tag}> id="${a.id}" class="${a.className}"`);
      console.log(`    overflow: ${a.overflow} | overflow-x: ${a.overflowX} | overflow-y: ${a.overflowY}`);
      console.log(`    display: ${a.display} | position: ${a.position} | height: ${a.height}\n`);
    });
  }

  // Check if .site-shell is the custom scroll container
  if (scrollCheck2.siteShellScrollTop > 0 && scrollCheck2.windowScrollY === 0) {
    console.log('  CONFIRMED: .site-shell is a CUSTOM SCROLL CONTAINER (window does not scroll).');
    console.log('  .site-shell.scrollTop responded to assignment; window.scrollY stayed at 0.');
    console.log('  position:sticky on .cube-gallery__scene is relative to .site-shell as scroll parent,');
    console.log('  but if .site-shell has overflow:hidden (not auto/scroll), sticky will not work.');
  } else if (scrollCheck1.windowScrollY > 0) {
    console.log('  Window/document is the scroll container (window.scrollTo worked).');
  }

  await browser.close();
  console.log('\nDone.');
})();
