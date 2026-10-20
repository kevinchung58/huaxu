/* scratch: stand at the two rail stops that face the falls and shoot them (before/after loops) */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const fs = require("fs");
(async () => {
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 640 } });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/rooms-niagara.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  for (const stop of [3, 2]) {
    await page.evaluate((n) => document.querySelector(`[data-walk-stop="${n}"]`).click(), stop);
    // wait for the ride to arrive: position settles for 3 s
    let last = "", stable = 0;
    while (stable < 6) {
      await new Promise(r => setTimeout(r, 500));
      const pos = await page.evaluate(() => { const s = document.querySelector("[data-walk]").__walk; return `${s.x.toFixed(1)},${s.depth.toFixed(1)}`; });
      stable = pos === last ? stable + 1 : 0; last = pos;
    }
    await new Promise(r => setTimeout(r, 2500));   // let the day cycle/mist breathe into the frame
    await page.screenshot({ path: `${out}/stop-${stop}.png` });
    console.log(`stop ${stop} @ ${last}`);
  }
  await browser.close();
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
