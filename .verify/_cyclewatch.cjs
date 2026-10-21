/* what a visitor actually sees: boot once, shoot at ~40 s (day), let the page's own 900 s day
   cycle run, shoot again at ~8.5 min (deep night), both render paths. No instrumentation tricks. */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  for (const mode of ["3d", "2d"]) {
    const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
      args: [...chromium.args, "--no-sandbox", ...(mode === "2d" ? ["--disable-webgl", "--disable-webgl2"] : [])],
      headless: true, defaultViewport: { width: 640, height: 400 } });
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 120)));
    await page.goto("http://127.0.0.1:8080/rooms-niagara.html", { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
    await sleep(30000);   // walk in first so the view holds the falls
    await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[3].click());
    await sleep(9000);
    await page.screenshot({ path: `.preview/round48-ab/cycle-${mode}-day.png` });
    const t0 = Date.now();
    await sleep(500000 - (Date.now() - t0) < 0 ? 0 : 460000);  // ~7.7 min more: night band
    await page.screenshot({ path: `.preview/round48-ab/cycle-${mode}-night.png` });
    console.log(mode, "done, gap minutes:", (page._t));
    await browser.close();
  }
  console.log("CYCLE-WATCH-DONE");
})().catch((e) => { console.log("ERR", e.message.slice(0, 140)); process.exit(1); });
