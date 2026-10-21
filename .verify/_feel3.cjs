/* scratch: hold W for 4 s and report fps, render scale, distance walked and effective speed */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const page_ = process.argv[2] || "street.html";
const W = Number(process.argv[3] || 1024), H = Number(process.argv[4] || 640);
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: W, height: H } });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { window.__t = []; const r = requestAnimationFrame; window.requestAnimationFrame = (cb) => r((t) => { window.__t.push(performance.now()); cb(t); }); });
  await page.goto(`http://127.0.0.1:8080/${page_}`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));
  const d0 = await page.evaluate(() => { document.querySelector("[data-walk-view]").focus(); return document.querySelector("[data-walk]").__walk.depth; });
  await page.evaluate(() => { window.__t.length = 0; });
  await page.keyboard.down("w");
  await new Promise(r => setTimeout(r, 6000));
  await page.keyboard.up("w");
  const out = await page.evaluate(() => {
    const w = document.querySelector("[data-walk]").__walk;
    const t = window.__t;
    return { frames: t.length, scale: w.renderScale, frameMs: +w.frameMs.toFixed(0), render: w.renderSize, display: w.displaySize, depth: w.depth, v: +w.velocity.toFixed(0) };
  });
  const secs = 6;
  console.log(JSON.stringify({ ...out, fps: +(out.frames / secs).toFixed(1), walked: +(out.depth - d0).toFixed(0), speed: +((out.depth - d0) / secs).toFixed(0) }));
  await browser.close();
})().catch(e => { console.log("ERR", e.message); process.exit(1); });
