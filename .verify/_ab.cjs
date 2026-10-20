/* round 48 A/B: one browser mode per process, same stop, run against both builds by the caller. */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const [out, mode] = process.argv.slice(2);
  const noWebGL = mode === "2d";
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox", ...(noWebGL ? ["--disable-webgl", "--disable-webgl2"] : [])],
    headless: true, defaultViewport: { width: 640, height: 400 } });
  const p = await browser.newPage();
  await p.goto("http://127.0.0.1:8080/rooms-niagara.html", { waitUntil: "networkidle0", timeout: 60000 });
  await p.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
  await sleep(3000);
  await p.evaluate(() => document.querySelectorAll("[data-walk-stop]")[3].click());
  let last = "", stable = 0;
  while (stable < 4) { await sleep(500);
    const pos = await p.evaluate(() => { const s = document.querySelector("[data-walk]").__walk; return `${s.x.toFixed(1)},${s.depth.toFixed(1)},y${s.yaw.toFixed(1)},p${(s.pitch||0).toFixed(1)}`; });
    stable = pos === last ? stable + 1 : 0; last = pos; }
  await p.screenshot({ path: out });
  console.log("shot", out, "@", last, "T~", "early");
  await browser.close();
})().catch((e) => { console.log("ERR", e.message.slice(0, 140)); process.exit(1); });
