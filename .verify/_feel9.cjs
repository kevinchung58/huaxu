/* scratch: round 56 eye check — walk at full size, then a shrunk viewport, and shoot each frame */
const { createRequire } = require("node:module");
const fs = require("node:fs");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const out = "/home/user/huaxu/.preview/r56";
fs.mkdirSync(out, { recursive: true });

async function shot(browser, page_, W, H, file, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:8080/${page_}`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  if (opts.walk) {
    await page.evaluate(() => document.querySelector("[data-walk-view]").focus());
    await page.keyboard.down("w");
    await new Promise((r) => setTimeout(r, opts.walk));
    await page.keyboard.up("w");
  }
  if (opts.hour !== undefined) {
    await page.evaluate((h) => {
      const b = document.querySelector(`[data-walk-hour="${h}"]`) || document.querySelector("[data-walk-hour]");
      if (b) b.click();
    }, opts.hour);
    await new Promise((r) => setTimeout(r, 900));
  }
  const stat = await page.evaluate(() => {
    const w = document.querySelector("[data-walk]").__walk;
    return { scale: +w.renderScale.toFixed(2), frameMs: +w.frameMs.toFixed(0), render: w.renderSize, display: w.displaySize,
             depth: +w.depth.toFixed(0), speed: +w.velocity.toFixed(0) };
  });
  await page.screenshot({ path: `${out}/${file}.png` });
  console.log(file, JSON.stringify(stat));
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true });
  await shot(browser, "street.html", 1024, 640, "street-walk-full", { walk: 9000 });
  await shot(browser, "street.html", 320, 200, "street-walk-small", { walk: 9000 });
  await shot(browser, "rooms-fukuoka.html", 1024, 640, "fukuoka-night", { walk: 5000, hour: 21 });
  await shot(browser, "rooms.html", 1024, 640, "tokyo-evening", { walk: 6000, hour: 19 });
  await browser.close();
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
