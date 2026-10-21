/* scratch: does the governor converge, and where? 25 s of held W, sampled every second */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const [W, H] = [Number(process.argv[2] || 1024), Number(process.argv[3] || 640)];
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: W, height: H } });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/street.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => document.querySelector("[data-walk-view]").focus());
  const d0 = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
  await page.keyboard.down("w");
  for (let i = 1; i <= 6; i++) {
    await new Promise(r => setTimeout(r, 4000));
    const r = await page.evaluate(() => { const w = document.querySelector("[data-walk]").__walk; return { s: +w.renderScale.toFixed(2), fm: +w.frameMs.toFixed(0), d: +w.depth.toFixed(0), rs: w.renderSize }; });
    console.log(`t=${i * 4}s scale ${r.s} frame ${r.fm} ms walked ${(r.d - d0).toFixed(0)} cm (${((r.d - d0) / (i * 4)).toFixed(0)} cm/s) render ${r.rs.join("x")}`);
  }
  await page.keyboard.up("w");
  await browser.close();
})().catch(e => { console.log("ERR", e.message); process.exit(1); });
