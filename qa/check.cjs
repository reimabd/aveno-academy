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
    assert(ctas.length >= 8);
    for (const href of ctas) {
      const url = new URL(href);
      assert.equal(url.origin + url.pathname, 'https://wa.me/77003605300');
      assert(url.searchParams.get('text').includes('Aveno Academy'));
    }
    assert.deepEqual(await page.locator('main > section').evaluateAll((sections) => sections.map((section) => section.getAttribute('aria-labelledby') || section.className)), ['hero-title', 'inside-title', 'results-title', 'learning-title', 'consultation-title', 'faq-title', 'final-section']);
    assert.equal(await page.locator('.outcome-card').count(), 4);
    assert.equal(await page.locator('.outcome-card img').count(), 0);
    assert.equal(await page.locator('.outcome-art').count(), 4);
    assert.equal(await page.locator('.shift, .practice, .topic-strip').count(), 0);
    assert((await page.locator('h1').innerText()).replace(/\s+/g, ' ').includes('Используйте ИИ как профессионал.'));
    await page.locator('.faq-list summary').first().click();
    assert.equal(await page.locator('.faq-list details').first().getAttribute('open'), '');
    await page.locator('.faq-list summary').first().click();

    await page.evaluate(() => { window.__openedUrls = []; window.open = (url) => window.__openedUrls.push(url); });
    await page.locator('#lead-name').fill('  ');
    await page.locator('#lead-phone').fill('+7 701 234 56 78');
    await page.locator('#lead-form button').click();
    assert.equal(await page.locator('#lead-name').getAttribute('aria-invalid'), 'true');
    await page.locator('#lead-name').fill('Тест Aveno');
    await page.locator('#lead-phone').fill('не номер');
    await page.locator('#lead-form button').click();
    assert.equal(await page.locator('#lead-phone').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.evaluate(() => window.__openedUrls.length), 0);
    await page.locator('#lead-phone').fill('8 (701) 234-56-78');
    await page.locator('#lead-form button').click();
    const submitted = new URL(await page.evaluate(() => window.__openedUrls[0]));
    assert.equal(submitted.pathname, '/77003605300');
    assert(submitted.searchParams.get('text').includes('Тест Aveno'));
    assert(submitted.searchParams.get('text').includes('программу и стоимость'));
    assert(submitted.searchParams.get('text').includes('+77012345678'));
    assert.equal(await page.locator('.form-feedback').isVisible(), true);
    assert.equal(await page.locator('#form-fallback').getAttribute('href'), submitted.href);
    await page.locator('#lead-name').fill('');
    await page.locator('#lead-phone').fill('');

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
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('#mobile-nav').isVisible(), true);
        await page.locator('#mobile-nav a[href="#inside"]').click();
        assert.equal(await page.locator('#mobile-nav').isVisible(), false);
        await page.locator('.menu-toggle').click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#mobile-nav').isVisible(), false);
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: 7 responsive widths, no overflow or asset errors, seven-section order, four original SVG cards, all WhatsApp links, FAQ, mobile menu, form validation and correct message. No message sent.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
