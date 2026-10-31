/* A shaded surface may be shaded a second time. The production mixer's own rgb() output must
   remain a valid input, not become rgb(NaN,NaN,...). */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launch } = require("./helpers/browser.cjs");

function mixer() {
  const source = fs.readFileSync(path.resolve(__dirname, "../js/site.js"), "utf8");
  const start = source.indexOf("  const mix = (hex, k) =>");
  const end = source.indexOf("\n  };", start);
  assert.ok(start >= 0 && end > start, "the real mixer is available");
  return new Function(`${source.slice(start, end + 5)}\nreturn mix;`)();
}

test("shading an authored hex colour retains its existing result", () => {
  assert.equal(mixer()("#694a33", -0.02), "rgb(103,73,51)");
});

test("shading a previous shade keeps every colour component finite", () => {
  const mix = mixer();
  assert.equal(mix(mix("#694a33", -0.02), 0.1), "rgb(118,90,67)");
  assert.equal(mix(mix("#2f6db3", 0.8), -0.12), "rgb(189,189,183)");
});

test("the Niagara scene does not submit invalid colour strings", { timeout:60000 }, async () => {
  const { browser, close } = await launch();
  const page = await browser.newPage();
  const invalid = [];
  page.on("console", msg => { if (/NANCOLOUR/.test(msg.text())) invalid.push(msg.text()); });
  try {
    await page.setViewport({ width:640, height:480 });
    await page.goto(pathToFileURL(path.resolve(__dirname, "../rooms-niagara.html")).href, { waitUntil:"domcontentloaded" });
    await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.quads > 0, { timeout:30000 });
    await new Promise(resolve => setTimeout(resolve, 2500));
    assert.deepEqual(invalid, [], `invalid colours reached the real scene: ${invalid.join(" / ")}`);
  } finally { await page.close(); await close(); }
});
