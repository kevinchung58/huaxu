/* scratch probe: what does a frame actually cost, and what does holding W produce?
   wraps rAF before any script runs, so the numbers are the page's own frame budget. */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const page_ = process.argv[2] || "street.html";
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 640 } });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    window.__ft = [];
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => { const a = performance.now(); cb(t); window.__ft.push(+(performance.now() - a).toFixed(1)); });
  });
  await page.goto(`http://127.0.0.1:8080/${page_}`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  const gl = await page.evaluate(() => {
    const c = document.createElement("canvas"); const g = c.getContext("webgl2") || c.getContext("webgl");
    const d = g && g.getExtension("WEBGL_debug_renderer_info");
    return { renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : "?", stats: document.querySelector("[data-walk]").__walk.threeStats };
  });
  console.log("GL:", JSON.stringify(gl));
  const sample = async (label, ms) => {
    await page.evaluate(() => { window.__ft.length = 0; });
    await new Promise(r => setTimeout(r, ms));
    const ft = await page.evaluate(() => window.__ft.slice());
    ft.sort((a,b)=>a-b);
    const q = (p) => ft.length ? ft[Math.min(ft.length-1, Math.floor(p*ft.length))] : null;
    console.log(label, "frames", ft.length, "p50", q(.5), "p90", q(.9), "max", ft[ft.length-1]);
  };
  await sample("idle ", 4000);
  await page.evaluate(() => document.querySelector("[data-walk-view]").focus());
  await page.keyboard.down("w");
  await sample("walkW", 4000);
  await page.keyboard.up("w");
  const pos = await page.evaluate(() => { const w = document.querySelector("[data-walk]").__walk; return { d: +w.depth.toFixed(0), x: +w.x.toFixed(0), v: +w.velocity.toFixed(1) }; });
  console.log("after walk:", JSON.stringify(pos));
  await browser.close();
})().catch(e => { console.log("ERR", e.message); process.exit(1); });
