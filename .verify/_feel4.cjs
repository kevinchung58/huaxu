/* scratch: per-frame depth deltas while holding W — where does the speed go? */
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
  await page.evaluate(() => {
    const w = () => document.querySelector("[data-walk]").__walk;
    window.__log = [];
    let lastD = w().depth, lastT = performance.now();
    (function sample(t) {
      const s = w(); const d = s.depth, now = performance.now();
      window.__log.push([+(now - lastT).toFixed(0), +(d - lastD).toFixed(1), +s.velocity.toFixed(0), +s.frameMs.toFixed(0)]);
      lastD = d; lastT = now;
      requestAnimationFrame(sample);
    })(performance.now());
  });
  await page.evaluate(() => document.querySelector("[data-walk-view]").focus());
  await page.keyboard.down("w");
  await new Promise(r => setTimeout(r, 4000));
  await page.keyboard.up("w");
  const log = await page.evaluate(() => window.__log.slice(3, 25));
  console.log("dt_ms, d_depth_cm, vel_cm_s, ema_frame_ms");
  for (const row of log) console.log(row.join("\t"));
  await browser.close();
})().catch(e => { console.log("ERR", e.message); process.exit(1); });
