/* scratch: effective walking speed against the dt ceiling */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 640 } });
  for (const cap of [0.12, 0.25, 0.5, 2]) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument((c) => { window.__dtCap = c; }, cap);
    await page.goto("http://127.0.0.1:8080/street.html", { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
    await new Promise(r => setTimeout(r, 1200));
    const d0 = await page.evaluate(() => { document.querySelector("[data-walk-view]").focus(); return document.querySelector("[data-walk]").__walk.depth; });
    await page.keyboard.down("w");
    await new Promise(r => setTimeout(r, 5000));
    await page.keyboard.up("w");
    const r = await page.evaluate(() => { const w = document.querySelector("[data-walk]").__walk; return { d: w.depth, s: +w.renderScale.toFixed(2), fm: +w.frameMs.toFixed(0) }; });
    console.log(`cap ${cap}s: walked ${(r.d - d0).toFixed(0)} cm in 5 s = ${((r.d - d0) / 5).toFixed(0)} cm/s (authored 165)  scale ${r.s} frame ${r.fm} ms`);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.log("ERR", e.message); process.exit(1); });
