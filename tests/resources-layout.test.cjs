/* The resource cards must fit a narrow viewport and keep a description under its title rather
   than squeezing three unrelated columns into a single card. This needs a real layout engine. */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launch } = require("./helpers/browser.cjs");
const ROOT = path.resolve(__dirname, "..");

test("resource cards stay readable from phone to desktop", { timeout: 60000 }, async (t) => {
  const { browser, close } = await launch();
  try {
    for (const width of [320, 390, 700, 1024, 1366]) {
      await t.test(`${width}px`, async () => {
        const page = await browser.newPage();
        try {
          await page.setViewport({ width, height: 768 });
          await page.goto(pathToFileURL(path.join(ROOT, "links.html")).href, { waitUntil: "domcontentloaded" });
          const actual = await page.evaluate(() => {
            const card = document.querySelector(".link-grid .card");
            const title = card.querySelector("h3").getBoundingClientRect();
            const icon = card.querySelector(".ico").getBoundingClientRect();
            const note = card.querySelector(".link-note").getBoundingClientRect();
            const box = card.getBoundingClientRect();
            return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
              cardRight: box.right, titleBottom: title.bottom, iconBottom: icon.bottom,
              noteTop: note.top, noteRight: note.right };
          });
          assert.ok(actual.scrollWidth <= width, `horizontal overflow: ${JSON.stringify(actual)}`);
          assert.ok(actual.cardRight <= width + 1, `card leaves the screen: ${JSON.stringify(actual)}`);
          assert.ok(actual.noteTop >= Math.max(actual.titleBottom, actual.iconBottom) - 1,
            `the description must be below the title and icon: ${JSON.stringify(actual)}`);
          assert.ok(actual.noteRight <= actual.cardRight + 1, "the description stays within the card");
        } finally { await page.close(); }
      });
    }
  } finally { await close(); }
});
