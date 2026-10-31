/* The first-visit guide needs to be in the rendered, hit-testable chrome, not merely unhidden
   underneath the canvas. Exercise it at desktop and touch viewport sizes in real Chromium. */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launch } = require("./helpers/browser.cjs");
const url = pathToFileURL(path.resolve(__dirname, "../street.html")).href;

async function measurement(page) {
  return page.evaluate(() => {
    const tutor = document.querySelector("[data-walk-tutor]");
    const skip = tutor.querySelector("[data-walk-tutor-skip]");
    const box = tutor.getBoundingClientRect(), b = skip.getBoundingClientRect();
    const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    const bounds = (el) => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom }; };
    const controls = [document.querySelector(".walk-top"), document.querySelector(".walk-tools")];
    const pad = document.querySelector(".walk-pad"), open = document.querySelector(".walk-open");
    if (getComputedStyle(pad).display !== "none") controls.push(pad);
    if (!open.hidden && getComputedStyle(open).display !== "none") controls.push(open);
    return { hidden:tutor.hidden, text:tutor.innerText, box:bounds(tutor), button:bounds(skip),
      target:top === skip || skip.contains(top), targetElement:top ? `${top.tagName}.${top.className}` : null, controls:controls.map(bounds),
      viewport:{width:innerWidth,height:innerHeight}, live:tutor.querySelector("[data-walk-tutor-text]").getAttribute("aria-live") };
  });
}

function assertLayout(m, text = /Turn first/) {
  assert.equal(m.hidden, false);
  assert.match(m.text, text);
  assert.ok(m.box.left >= 0 && m.box.right <= m.viewport.width && m.box.top >= 0 && m.box.bottom <= m.viewport.height, JSON.stringify(m));
  assert.equal(m.target, true, `Skip must be the actual hit target: ${JSON.stringify(m)}`);
  assert.equal(m.live, "polite");
  for (const r of m.controls) {
    const overlap = m.box.left < r.right && m.box.right > r.left && m.box.top < r.bottom && m.box.bottom > r.top;
    assert.equal(overlap, false, `guide covers a walk control: ${JSON.stringify(m)}`);
  }
}

test("the first-visit guide is visible and operable without covering walk controls", { timeout: 120000 }, async (t) => {
  const { browser, close } = await launch();
  try {
    for (const viewport of [
      { width:320, height:568, isMobile:true, hasTouch:true },
      { width:390, height:844, isMobile:true, hasTouch:true },
      { width:667, height:375, isMobile:true, hasTouch:true },
      { width:1366, height:768 },
    ]) {
      await t.test(`${viewport.width}×${viewport.height}`, async () => {
        const page = await browser.newPage();
        try {
          await page.setViewport(viewport);
          await page.evaluateOnNewDocument(() => localStorage.removeItem("huaxu.walk-guide.v1"));
          await page.goto(url, { waitUntil:"domcontentloaded" });
          await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk &&
            !document.querySelector("[data-walk-tutor]").hidden &&
            getComputedStyle(document.querySelector("[data-walk-listpanel]")).visibility === "hidden", { timeout:30000 });
          assertLayout(await measurement(page));
          const firstStep = await page.$eval("[data-walk-tutor-text]", el => el.textContent);
          await page.$eval("[data-walk-tutor-text]", el => { el.textContent =
            "Stand in front of something and press E, or press the bar that names it at the foot of the picture: a door takes you through, a picture shows you the reel, a machine plays. What everything else is, and why, is written in the list."; });
          assertLayout(await measurement(page), /Stand in front/);
          await page.$eval("[data-walk-tutor-text]", (el, text) => { el.textContent = text; }, firstStep);
          if (viewport.hasTouch) await page.tap("[data-walk-tutor-skip]");
          else await page.click("[data-walk-tutor-skip]");
          assert.equal(await page.$eval("[data-walk-tutor]", el => el.hidden), true, "Skip closes the guide");
          assert.equal(await page.evaluate(() => localStorage.getItem("huaxu.walk-guide.v1")), "1");
          if (viewport.hasTouch) await page.tap("[data-walk-tutor-replay]");
          else await page.click("[data-walk-tutor-replay]");
          assertLayout(await measurement(page));
        } finally { await page.close(); }
      });
    }
    await t.test("Space activates the guide and named action instead of jumping", async () => {
      const page = await browser.newPage();
      try {
        await page.evaluateOnNewDocument(() => localStorage.removeItem("huaxu.walk-guide.v1"));
        await page.goto(pathToFileURL(path.resolve(__dirname, "../rooms-fukuoka.html")).href, { waitUntil:"domcontentloaded" });
        await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk &&
          getComputedStyle(document.querySelector("[data-walk-listpanel]")).visibility === "hidden", { timeout:30000 });
        await page.focus("[data-walk-tutor-skip]");
        await page.keyboard.press("Space");
        assert.equal(await page.$eval("[data-walk-tutor]", el => el.hidden), true, "Space activates Skip");
        await page.waitForFunction(() => !document.querySelector("[data-walk-open]").hidden, { timeout:20000 });
        await page.$eval("[data-walk-open]", el => { window.__actionClicks = 0; el.addEventListener("click", () => window.__actionClicks++); });
        await page.focus("[data-walk-open]");
        await page.keyboard.press("Space");
        assert.equal(await page.evaluate(() => window.__actionClicks), 1, "Space activates the named action");
      } finally { await page.close(); }
    });
    await t.test("a touch visitor can turn, use the stick, and read the next steps", async () => {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width:390, height:844, isMobile:true, hasTouch:true });
        await page.evaluateOnNewDocument(() => localStorage.removeItem("huaxu.walk-guide.v1"));
        await page.goto(url, { waitUntil:"domcontentloaded" });
        await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk &&
          getComputedStyle(document.querySelector("[data-walk-listpanel]")).visibility === "hidden", { timeout:30000 });
        const cdp = await page.createCDPSession();
        for (let i = 0; i < 2; i++) {
          await cdp.send("Input.dispatchTouchEvent", { type:"touchStart", touchPoints:[{ x:35, y:250, id:1 }] });
          await cdp.send("Input.dispatchTouchEvent", { type:"touchMove", touchPoints:[{ x:355, y:250, id:1 }] });
          await cdp.send("Input.dispatchTouchEvent", { type:"touchEnd", touchPoints:[] });
        }
        await page.waitForFunction(() => document.querySelector("[data-walk-tutor-count]").textContent === "2 / 4", { timeout:15000 });
        assertLayout(await measurement(page), /push the stick on a touch screen/);
        const point = await page.$eval(".walk-pad", el => {
          const r = el.getBoundingClientRect(); return { x:r.left + r.width / 2, y:r.top + r.height * 0.2, id:1 };
        });
        await cdp.send("Input.dispatchTouchEvent", { type:"touchStart", touchPoints:[point] });
        try {
          await page.waitForFunction(() => document.querySelector("[data-walk-tutor-count]").textContent === "3 / 4", { timeout:20000 });
        } finally { await cdp.send("Input.dispatchTouchEvent", { type:"touchEnd", touchPoints:[] }); }
        assertLayout(await measurement(page), /press E/);
        await page.tap("[data-walk-tutor-skip]");
        assert.equal(await page.$eval("[data-walk-tutor]", el => el.hidden), true);
      } finally { await page.close(); }
    });
  } finally { await close(); }
});
