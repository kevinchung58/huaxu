/* scratch: is the frame cost fill-rate? same page, four viewport sizes, frames per 4 s while walking */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const page_ = process.argv[2] || "street.html";
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true });
  for (const [w, h] of [[1024, 640], [768, 480], [512, 320], [320, 200]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.evaluateOnNewDocument(() => {
      window.__ft = [];
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => raf((t) => { const a = performance.now(); cb(t); window.__ft.push(performance.now() - a); });
    });
    await page.goto(`http://127.0.0.1:8080/${page_}`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => { window.__ft.length = 0; document.querySelector("[data-walk-view]").focus(); });
    await page.keyboard.down("w");
    await new Promise(r => setTimeout(r, 4000));
    await page.keyboard.up("w");
    const ft = await page.evaluate(() => window.__ft.slice());
    const js = await page.evaluate(() => window.__ft.reduce((a, b) => a + b, 0) / Math.max(1, window.__ft.length));
    const d = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
    console.log(`${w}x${h}: ${ft.length} frames / 4 s  (${(ft.length / 4).toFixed(1)} fps)  js ${js.toFixed(1)} ms/frame  walked ${d.toFixed(0)} cm`);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.log("ERR", e.message); process.exit(1); });
