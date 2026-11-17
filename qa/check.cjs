const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => { if (response.status() >= 400 && response.url().startsWith('http://localhost:4173')) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const screenshots = path.join(__dirname, 'screenshots');
    fs.mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: path.join(screenshots, 'desktop.png'), fullPage: true });
    await page.screenshot({ path: path.join(screenshots, 'desktop-hero.png') });

    const ctas = await page.locator('[data-wa]').evaluateAll((links) => links.map((link) => link.href));
    assert(ctas.length >= 5);
    for (const href of ctas) {
      const url = new URL(href);
      assert.equal(url.origin + url.pathname, 'https://wa.me/77003605300');
      assert(url.searchParams.get('text').includes('Aveno Academy'));
    }
    assert.deepEqual(await page.locator('main > section').evaluateAll((sections) => sections.map((section) => section.getAttribute('aria-labelledby') || section.className)), ['hero-title', 'inside-title', 'results-title', 'learning-title', 'price-title', 'faq-title', 'final-section']);
    assert.equal(await page.locator('.outcome-card').count(), 4);
    assert.equal(await page.locator('.outcome-card img').count(), 0);
    assert.equal(await page.locator('.outcome-art').count(), 4);
    assert.equal(await page.locator('.shift, .practice, .topic-strip').count(), 0);
    assert((await page.locator('h1').innerText()).replace(/\s+/g, ' ').includes('Используйте ИИ как профессионал.'));
    await page.locator('.faq-list summary').first().click();
    assert.equal(await page.locator('.faq-list details').first().getAttribute('open'), '');
    await page.locator('.faq-list summary').first().click();

    assert.equal(await page.locator('#lead-form').count(), 0);
    assert.equal((await page.locator('.price-card .price-new').innerText()).endsWith('69\u00a0900\u00a0₸'), true);
    assert.equal(await page.locator('.price-card .price-old s').innerText(), '89\u00a0900\u00a0₸');
    assert.equal(await page.locator('.price-features li').count(), 4);
    assert.equal(await page.locator('.price-card .price-saving').innerText(), 'Выгода 20\u00a0000\u00a0₸');
    assert.equal(await page.locator('.price-card.is-struck').count(), 0);
    await page.locator('.price-card').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1400);
    assert.equal(await page.locator('.price-card.is-struck').count(), 1);
    const buy = new URL(await page.locator('.price-card [data-wa="buy"]').getAttribute('href'));
    assert(buy.searchParams.get('text').includes('AI Starter'));
    assert(buy.searchParams.get('text').includes('69 900 ₸'));
    for (const selector of ['.header-contact', '.hero .button', '.inside-bottom .text-link']) assert.equal(await page.locator(selector).getAttribute('href'), '#price');
    await page.locator('.price-card').screenshot({ path: path.join(screenshots, 'price-card.png') });
    await page.locator('#price').screenshot({ path: path.join(screenshots, 'price-desktop.png') });

    for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(100);
      const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert(size.scroll <= size.client + 1, `Horizontal overflow at ${width}: ${JSON.stringify(size)}`);
      const brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => image.complete && !image.naturalWidth).map((image) => image.src));
      assert.deepEqual(brokenImages, []);
      if (width === 390) {
        await page.screenshot({ path: path.join(screenshots, 'mobile.png'), fullPage: true });
        await page.screenshot({ path: path.join(screenshots, 'mobile-hero.png') });
        await page.locator('#price').screenshot({ path: path.join(screenshots, 'price-mobile.png') });
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('#mobile-nav').isVisible(), true);
        await page.locator('#mobile-nav a[href="#inside"]').click();
        assert.equal(await page.locator('#mobile-nav').isVisible(), false);
        await page.locator('.menu-toggle').click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#mobile-nav').isVisible(), false);
      }
    }
    assert.equal(await page.locator('.requisites div').count(), 8);
    for (const doc of ['privacy', 'consent']) {
      await page.goto(`http://localhost:4173/${doc}.html`, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.doc-links a[aria-current="page"]').getAttribute('href'), `${doc}.html`);
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        assert(size.scroll <= size.client + 1, `Horizontal overflow on ${doc} at ${width}`);
      }
      await page.screenshot({ path: path.join(screenshots, `${doc}-desktop.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(screenshots, `${doc}-mobile.png`), fullPage: true });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: 7 responsive widths, no overflow or asset errors, seven-section order, four original SVG cards, all WhatsApp links, FAQ, mobile menu, price block (69 900 ₸ / 89 900 ₸, 4 features, WhatsApp buy message), anchors to #price, requisites, legal pages and correct message. No message sent.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
