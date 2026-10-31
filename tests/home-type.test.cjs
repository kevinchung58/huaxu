/* The owner's Chinese name must remain legible on machines without a CJK system font or a network
   font service. Check the real font loaded by the browser, and that the three glyphs are not tofu. */
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launch } = require("./helpers/browser.cjs");

const ROOT = path.resolve(__dirname, "..");

test("the locally licensed font is content-addressed and included in the asset digest", () => {
  const css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
  const match = css.match(/\.\.\/fonts\/(huaxu-name-([0-9a-f]{10})\.woff2)/);
  assert.ok(match, "the stylesheet names the subset by its content hash");
  const relative = `fonts/${match[1]}`;
  const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, relative))).digest("hex").slice(0, 10);
  assert.equal(match[2], hash);
  assert.ok(JSON.parse(fs.readFileSync(path.join(ROOT, "bin/asset-list.json"), "utf8")).includes(relative));
  assert.match(fs.readFileSync(path.join(ROOT, "fonts/OFL-NotoSerifTC.txt"), "utf8"), /SIL OPEN FONT LICENSE Version 1\.1/);
});

test("the Chinese name is readable without external font services", { timeout: 60000 }, async () => {
  const { browser, close } = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.setRequestInterception(true);
    page.on("request", (req) => /^(https?:)/.test(req.url()) ? req.abort() : req.continue());
    await page.goto(pathToFileURL(path.join(ROOT, "index.html")).href, { waitUntil: "domcontentloaded" });
    const result = await page.evaluate(async () => {
      const name = document.querySelector(".hero h1 span");
      const faces = await document.fonts.load('20px "Hua-Xu Name"', "鍾華栩");
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 64;
      const c = canvas.getContext("2d", { willReadFrequently: true });
      c.font = '40px "Hua-Xu Name"';
      const pixels = Array.from("鍾華栩", (glyph) => {
        c.clearRect(0, 0, 64, 64);
        c.fillText(glyph, 4, 48);
        return Array.from(c.getImageData(0, 0, 64, 64).data).join(",");
      });
      return { text: name?.textContent, family: getComputedStyle(name).fontFamily,
        loadedFaces: faces.length, loaded: faces.every((f) => f.status === "loaded"), unique: new Set(pixels).size };
    });
    assert.match(result.text, /鍾華栩/);
    assert.match(result.family, /Hua-Xu Name/, "the visible name uses the local CJK fallback");
    assert.equal(result.loadedFaces, 1, "the local font face loaded without a network");
    assert.equal(result.loaded, true);
    assert.equal(result.unique, 3, "the three characters do not all render as the same missing-glyph box");
  } finally { await close(); }
});
