/* Exercise the generated publication filter in a browser, including the selected state announced
   to assistive technology and the counts displayed beside each visible year. */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launch } = require("./helpers/browser.cjs");
const research = pathToFileURL(path.resolve(__dirname, "../research.html")).href;

async function snapshot(page) {
  return page.evaluate(() => ({
    group: document.querySelector("[data-filter-group]").getAttribute("aria-label"),
    buttons: [...document.querySelectorAll("[data-filter]")].map(b => ({
      filter: b.dataset.filter, active: b.classList.contains("is-on"), pressed: b.getAttribute("aria-pressed")
    })),
    years: [...document.querySelectorAll("[data-year]")].map(year => ({
      year: year.dataset.year, hidden: year.hidden, countLabel: year.querySelector("h3 > span").textContent,
      items: [...year.querySelectorAll("[data-pub-type]")].map(pub => ({
        type: pub.dataset.pubType, hidden: pub.hidden, displayed: getComputedStyle(pub).display !== "none"
      }))
    }))
  }));
}

test("publication filters update both results and selected-state semantics", { timeout: 60000 }, async (t) => {
  const { browser, close } = await launch();
  try {
    await t.test("announces the selected button and responds to keyboard and pointer", async () => {
      const page = await browser.newPage();
      try {
        await page.goto(research, { waitUntil: "domcontentloaded" });
        for (const [filter, action] of [["all", "initial"], ["Conference", "keyboard"], ["Journal", "pointer"], ["all", "keyboard"]]) {
          const button = `[data-filter="${filter}"]`;
          if (action === "keyboard") { await page.focus(button); await page.keyboard.press("Enter"); }
          if (action === "pointer") await page.click(button);
          const s = await snapshot(page);
          assert.equal(s.group, "Filter publications by type");
          assert.deepEqual(s.buttons.map(b => [b.filter, b.active, b.pressed]),
            ["all", "Journal", "Conference"].map(name => [name, name === filter, String(name === filter)]));
        }
      } finally { await page.close(); }
    });
    await t.test("each year reports the actual visible publication count", async () => {
      const page = await browser.newPage();
      try {
        await page.goto(research, { waitUntil: "domcontentloaded" });
        for (const filter of ["Conference", "Journal", "all"]) {
          await page.click(`[data-filter="${filter}"]`);
          const s = await snapshot(page);
          for (const y of s.years) {
            const expected = y.items.filter(pub => filter === "all" || pub.type === filter);
            assert.equal(y.hidden, expected.length === 0, `${filter} ${y.year} visibility`);
            if (expected.length) assert.equal(y.countLabel, `${expected.length} publication${expected.length === 1 ? "" : "s"}`, `${filter} ${y.year} count`);
            for (const item of y.items) {
              assert.equal(item.hidden, filter !== "all" && item.type !== filter);
              assert.equal(item.displayed, !item.hidden, `hidden ${item.type} in ${y.year} must not occupy layout`);
            }
          }
        }
      } finally { await page.close(); }
    });
  } finally { await close(); }
});
