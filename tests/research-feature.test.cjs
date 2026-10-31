/* The figure entry must be bound after its dialog exists in the generated page. Exercise the
   real browser, not just jsdom's post-parse evaluation, and retain the authored paper details. */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launch } = require("./helpers/browser.cjs");
const url = pathToFileURL(path.resolve(__dirname, "../research.html")).href;

test("featured-paper entries open and close accessibly in a browser", { timeout:60000 }, async () => {
  const { browser, close } = await launch();
  const page = await browser.newPage();
  try {
    await page.emulateMediaFeatures([{ name:"prefers-reduced-motion", value:"reduce" }]);
    await page.goto(url, { waitUntil:"domcontentloaded" });
    const entries = await page.$$eval('[data-featured]', els => els.map(el => ({
      doi:el.dataset.doi, title:el.dataset.title, list:!!el.closest('.year-block'), featured:!!el.closest('.featured-grid')
    })));
    for (const where of ['list', 'featured']) {
      assert.ok(entries.some(el => el[where] && el.doi === '10.1007/s10796-026-10779-3'), `${where} retains the 2026 paper`);
      assert.ok(entries.some(el => el[where] && !el.doi && el.title.startsWith('Information undergraduate and non-information undergraduate')), `${where} retains the other featured paper`);
    }
    const first = '[data-featured][data-doi="10.1007/s10796-026-10779-3"]';
    const expected = await page.$eval(first, el => ({ title:el.dataset.title, authors:el.dataset.authors, source:el.dataset.source }));
    await page.click(first);
    const opened = await page.evaluate(() => {
      const modal = document.querySelector("#featured-modal");
      return { open:modal.classList.contains("is-open"), title:modal.querySelector("[data-modal-title]").textContent,
        authors:modal.querySelector("[data-modal-authors]").textContent, source:modal.querySelector("[data-modal-source]").textContent,
        placeholder:modal.querySelector(".figure-box")?.textContent, label:modal.getAttribute("aria-labelledby"),
        focusInside:modal.contains(document.activeElement), mainInert:document.querySelector("main").inert,
        doi:modal.querySelector("[data-modal-doi]").getAttribute("href"), doiHidden:modal.querySelector("[data-modal-doi]").hidden,
        correspondingHidden:modal.querySelector("[data-modal-note]").hidden };
    });
    assert.equal(opened.open, true, "the real click opens the existing dialog");
    assert.equal(opened.title, expected.title);
    assert.equal(opened.authors, expected.authors);
    assert.equal(opened.source, expected.source);
    assert.match(opened.placeholder, /Figure forthcoming/);
    assert.equal(opened.label, "featured-modal-title");
    assert.equal(opened.focusInside, true);
    assert.equal(opened.mainInert, true);
    assert.equal(opened.doi, "https://doi.org/10.1007/s10796-026-10779-3");
    assert.equal(opened.doiHidden, false);
    assert.equal(opened.correspondingHidden, false);

    await page.focus("#featured-modal .modal-close");
    await page.keyboard.down("Shift"); await page.keyboard.press("Tab"); await page.keyboard.up("Shift");
    assert.equal(await page.evaluate(() => document.activeElement.matches("[data-modal-doi]")), true, "Shift-Tab wraps inside the dialog");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.matches("#featured-modal .modal-close")), true, "Tab wraps back to Close");
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#featured-modal", el => el.classList.contains("is-open")), false);
    assert.equal(await page.evaluate(() => document.activeElement.matches('[data-featured][data-doi="10.1007/s10796-026-10779-3"]')), true, "focus returns to the entry");
    assert.equal(await page.$eval("main", el => el.inert), false);

    await page.click(first);
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !document.querySelector("#featured-modal").classList.contains("is-open"), { timeout:10000 });
    assert.equal(await page.evaluate(() => document.activeElement.matches('[data-featured][data-doi="10.1007/s10796-026-10779-3"]')), true);
    assert.equal(await page.evaluate(() => location.pathname.endsWith("/research.html")), true, "Back folds the dialog without leaving");

    const noDoi = '[data-featured][data-doi=""]';
    const otherTitle = await page.$eval(noDoi, el => el.dataset.title);
    await page.focus(noDoi);
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#featured-modal", el => el.classList.contains("is-open")), true, "keyboard activation opens the dialog");
    assert.equal(await page.$eval("[data-modal-title]", el => el.textContent), otherTitle);
    assert.equal(await page.$eval("[data-modal-doi]", el => el.hidden), true, "a paper without an authored DOI does not acquire one");
    assert.equal(await page.$eval("[data-modal-note]", el => el.hidden), true);
    await page.keyboard.press("Escape");

    // Both publication cards and the featured-paper cards have entry points. Check each one,
    // including the two without a DOI, rather than assuming that matching markup is wired up.
    for (const entry of await page.$$("[data-featured]")) {
      const data = await entry.evaluate(el => ({ ...el.dataset }));
      await entry.click();
      assert.equal(await page.$eval("#featured-modal", el => el.classList.contains("is-open")), true);
      assert.equal(await page.$eval("[data-modal-title]", el => el.textContent), data.title);
      assert.equal(await page.$eval("[data-modal-authors]", el => el.textContent), data.authors);
      assert.equal(await page.$eval("[data-modal-source]", el => el.textContent), data.source);
      assert.equal(await page.$eval("[data-modal-doi]", el => el.hidden), !data.doi);
      if (data.doi) assert.equal(await page.$eval("[data-modal-doi]", el => el.getAttribute("href")), `https://doi.org/${data.doi}`);
      assert.equal(await page.$eval("[data-modal-note]", el => el.hidden), data.corresponding !== "true");
      await page.click("#featured-modal .modal-close");
      assert.equal(await page.$eval("#featured-modal", el => el.classList.contains("is-open")), false);
      assert.equal(await entry.evaluate(el => document.activeElement === el), true);
    }
    await page.click(first);
    await page.click("#featured-modal .modal-backdrop", { offset:{ x:5, y:5 } });
    assert.equal(await page.$eval("#featured-modal", el => el.classList.contains("is-open")), false, "the backdrop still closes the dialog");
    assert.equal(await page.evaluate(() => document.activeElement.matches('[data-featured][data-doi="10.1007/s10796-026-10779-3"]')), true);

    for (const viewport of [{ width:320, height:568 }, { width:667, height:375 }]) {
      await page.setViewport(viewport);
      await page.goto(url, { waitUntil:"domcontentloaded" });
      await page.click(first);
      const panel = await page.$eval("#featured-modal .modal-panel", el => {
        const r = el.getBoundingClientRect();
        return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, scroll:el.scrollHeight, visible:el.clientHeight };
      });
      assert.ok(panel.left >= 0 && panel.right <= viewport.width && panel.top >= 0 && panel.bottom <= viewport.height,
        `dialog remains in the ${viewport.width}×${viewport.height} viewport`);
      assert.ok(panel.scroll > panel.visible, "long details can be scrolled in a short viewport");
      await page.$eval("[data-modal-doi]", el => el.scrollIntoView({ block:"nearest" }));
      assert.equal(await page.$eval("[data-modal-doi]", el => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight && !!document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[data-modal-doi]');
      }), true, "the DOI is reachable by scrolling the panel");
      await page.click("#featured-modal .modal-close");
      assert.equal(await page.$eval("#featured-modal", el => el.classList.contains("is-open")), false);
    }
  } finally { await page.close(); await close(); }
});
