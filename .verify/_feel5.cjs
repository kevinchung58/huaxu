const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 640 } });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/street.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
  await page.evaluate(() => { window.__probe = []; document.querySelector("[data-walk-view]").focus(); });
  await page.keyboard.down("w");
  await new Promise(r => setTimeout(r, 4000));
  await page.keyboard.up("w");
  const rows = await page.evaluate(() => window.__probe.slice(2, 20));
  console.log("elapsed_ms  steps  x  depth  vx  vd");
  for (const r of rows) console.log(r.join("\t"));
  const total = await page.evaluate(() => window.__probe.reduce((a, r) => a + r[0], 0));
  console.log("sum elapsed of ticks:", total.toFixed(0), "ms over", await page.evaluate(() => window.__probe.length), "ticks");
  await browser.close();
})().catch(e => { console.log("ERR", e.message); process.exit(1); });
