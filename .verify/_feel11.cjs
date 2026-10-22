/* scratch: which cost dominates a 1024x640 frame under SwiftShader — the fragment bill, the
   compositor stretching the canvas, or the DOM overlay? */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function probe(browser, label, css, mutate) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 640, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => { window.__t = []; const r = requestAnimationFrame;
    window.requestAnimationFrame = (cb) => r((t) => { window.__t.push(performance.now()); cb(t); }); });
  await page.goto("http://127.0.0.1:8080/street.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
  await sleep(1500);
  if (mutate) await page.evaluate(mutate);
  await page.evaluate(() => document.querySelector("[data-walk-view]").focus());
  await page.evaluate(() => { window.__t.length = 0; });
  await page.keyboard.down("w");
  await sleep(6000);
  await page.keyboard.up("w");
  const out = await page.evaluate(() => { const w = document.querySelector("[data-walk]").__walk; const t = window.__t;
    const gaps = t.slice(1).map((v, i) => v - t[i]);
    return { frames: t.length, median: gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)],
             scale: +w.renderScale.toFixed(2), render: w.renderSize, frameMs: +w.frameMs.toFixed(0), depth: +w.depth.toFixed(0) }; });
  console.log(label, JSON.stringify({ fps: +(out.frames / 6).toFixed(1), medianMs: +out.median.toFixed(0), ...out }));
  await page.close();
}
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true });
  await probe(browser, "baseline          ", null, null);
  await probe(browser, "hud hidden        ", null, () => { document.querySelectorAll(".walk-tools,.walk-stops,.walk-card,.walk-list").forEach((e) => { e.style.display = "none"; }); });
  await probe(browser, "canvas hidden     ", null, () => { const c = document.querySelector("[data-walk-view] canvas"); if (c) c.style.visibility = "hidden"; });
  await probe(browser, "canvas 360px css  ", null, () => { const c = document.querySelector("[data-walk-view] canvas"); if (c) { c.style.width = "360px"; c.style.height = "225px"; } });
  await browser.close();
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
