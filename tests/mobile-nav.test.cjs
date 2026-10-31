/* Real-browser regression for the fixed header on short mobile viewports. jsdom has no layout or
   scrolling, so it cannot tell whether the bottom links remain reachable. This test uses the
   existing sandbox Chromium and a private copy of its shared libraries: env.test.cjs deliberately
   removes /tmp/al2023 while the normal parallel node:test suite is running. */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launch } = require("./helpers/browser.cjs");

const ROOT = path.resolve(__dirname, "..");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function open(browser, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(pathToFileURL(path.join(ROOT, "index.html")).href, { waitUntil: "domcontentloaded" });
  await page.click(".menu-toggle");
  await page.waitForFunction(() => document.querySelector(".menu-toggle").getAttribute("aria-expanded") === "true");
  await sleep(250); // allow the opening animation to settle before measuring the actual box
  return page;
}

const menuState = (page) => page.evaluate(() => {
  const menu = document.querySelector(".mobile");
  const toggle = document.querySelector(".menu-toggle");
  const last = menu.querySelector("a:last-child");
  const m = menu.getBoundingClientRect(), a = last.getBoundingClientRect();
  return { viewport: innerHeight, menuTop: m.top, menuBottom: m.bottom,
    scrollHeight: menu.scrollHeight, clientHeight: menu.clientHeight, scrollTop: menu.scrollTop,
    lastTop: a.top, lastBottom: a.bottom, bodyScroll: scrollY,
    expanded: toggle.getAttribute("aria-expanded"), controls: toggle.getAttribute("aria-controls"),
    menuId: menu.id, focused: document.activeElement === toggle };
});

test("mobile navigation remains operable in short viewports", { timeout: 120000 }, async (t) => {
  const { browser, close } = await launch();
  try {
    await t.test("the opened menu fits a landscape phone and can scroll to the final link", async () => {
      const page = await open(browser, 667, 375);
      try {
        const initial = await menuState(page);
        assert.ok(initial.menuBottom <= initial.viewport + 1, `menu bottom ${initial.menuBottom} exceeds viewport ${initial.viewport}`);
        assert.ok(initial.scrollHeight > initial.clientHeight, "the constrained menu has content to scroll");
        assert.equal(initial.controls, initial.menuId, "the toggle names the navigation it controls");
        assert.ok(initial.menuId, "the navigation has an id");
        await page.mouse.move(330, 220);
        await page.mouse.wheel({ deltaY: 1000 });
        await sleep(300);
        const scrolled = await menuState(page);
        assert.ok(scrolled.scrollTop > 0, "the menu, not only the page behind it, scrolls");
        assert.ok(scrolled.lastTop >= scrolled.menuTop && scrolled.lastBottom <= scrolled.viewport + 1,
          `last link is off screen: ${JSON.stringify(scrolled)}`);
        assert.equal(scrolled.bodyScroll, 0, "the menu consumes the scroll rather than scrolling the background");
        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded" }),
          page.click('.mobile a[href="street.html"]'),
        ]);
        assert.ok(new URL(page.url()).pathname.endsWith("/street.html"), "the final link is really clickable");
      } finally { await page.close(); }
    });

    await t.test("Escape closes the menu and returns focus to its toggle", async () => {
      const page = await open(browser, 390, 844);
      try {
        await page.focus('.mobile a[href="about.html"]');
        await page.keyboard.press("Escape");
        const state = await menuState(page);
        assert.equal(state.expanded, "false");
        assert.equal(state.focused, true);
        assert.equal(await page.$eval(".mobile", (el) => el.classList.contains("is-open")), false);
      } finally { await page.close(); }
    });
  } finally { await close(); }
});
