/* scratch: round 56 — the small-window frame after the render floor */
const { createRequire } = require("node:module");
const fs = require("node:fs");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 320, height: 200 } });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/street.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
  await page.evaluate(() => document.querySelector("[data-walk-view]").focus());
  await page.keyboard.down("w");
  await new Promise((r) => setTimeout(r, 8000));
  await page.keyboard.up("w");
  await new Promise((r) => setTimeout(r, 600));
  const st = await page.evaluate(() => { const w = document.querySelector("[data-walk]").__walk;
    return { scale: +w.renderScale.toFixed(2), frameMs: +w.frameMs.toFixed(0), render: w.renderSize, display: w.displaySize, depth: +w.depth.toFixed(0) }; });
  fs.mkdirSync(".preview/r56", { recursive: true });
  await page.screenshot({ path: ".preview/r56/street-small-floor.png" });
  console.log(JSON.stringify(st));
  await browser.close();
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
