/* The portrait's hover preview must not prevent an explicit touch, mouse, or keyboard toggle
   from switching back to the photograph. */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launch } = require("./helpers/browser.cjs");
const url = pathToFileURL(path.resolve(__dirname, "../about.html")).href;

async function state(page) {
  return page.evaluate(() => {
    const button = document.querySelector(".persona");
    return { pressed: button.getAttribute("aria-pressed"), on: button.classList.contains("is-alt"),
      opacity: Number(getComputedStyle(button.querySelector(".persona-alt")).opacity),
      hint: button.querySelector(".persona-hint").textContent.trim() };
  });
}

async function ready(page) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: ".persona-alt, .persona-hint { transition: none !important; }" });
  await page.evaluate(() => document.querySelector(".persona").scrollIntoView({ block: "center" }));
}

test("portrait toggle works for touch, keyboard, and a hovering mouse", { timeout: 60000 }, async (t) => {
  const { browser, close } = await launch();
  try {
    await t.test("two touches restore the photograph on a touch device", async () => {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await ready(page);
        assert.deepEqual(await state(page), { pressed: "false", on: false, opacity: 0, hint: "Tap or click" });
        await page.tap(".persona");
        assert.deepEqual(await state(page), { pressed: "true", on: true, opacity: 1, hint: "Tap or click" });
        await page.tap(".persona");
        assert.deepEqual(await state(page), { pressed: "false", on: false, opacity: 0, hint: "Tap or click" });
      } finally { await page.close(); }
    });
    await t.test("keyboard can switch back while focus remains", async () => {
      const page = await browser.newPage();
      try {
        await ready(page);
        await page.focus(".persona");
        assert.equal((await state(page)).opacity, 1, "focus still previews the illustration");
        await page.keyboard.press("Enter");
        assert.equal((await state(page)).pressed, "true");
        await page.keyboard.press("Space");
        const s = await state(page);
        assert.equal(s.pressed, "false");
        assert.equal(s.on, false);
        assert.equal(s.opacity, 0);
      } finally { await page.close(); }
    });
    await t.test("hover still previews; explicit clicks can restore the photo", async () => {
      const page = await browser.newPage();
      try {
        await ready(page);
        await page.hover(".persona");
        assert.equal((await state(page)).opacity, 1);
        await page.click(".persona");
        assert.equal((await state(page)).pressed, "true");
        await page.click(".persona");
        assert.equal((await state(page)).opacity, 0);
        await page.mouse.move(0, 0);
        await page.hover(".persona");
        assert.equal((await state(page)).opacity, 1, "hover preview returns on a new hover");
      } finally { await page.close(); }
    });
  } finally { await close(); }
});
