/* round 48 paired eyes: same stops on both render paths (WebGL vs forced Canvas2D fallback),
   day (niagara falls) and night (Nakamise lanterns). Fresh browser per page — swiftshader memory. */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const fs = require("fs");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function shoot(out, page, stops, noWebGL) {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox", ...(noWebGL ? ["--disable-webgl", "--disable-webgl2"] : [])],
    headless: true, defaultViewport: { width: 1024, height: 640 } });
  const p = await browser.newPage();
  await p.goto(`http://127.0.0.1:8080/${page}`, { waitUntil: "networkidle0", timeout: 60000 });
  await p.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
  await sleep(1500);
  if (stops.length) {
    const idx = stops[0];
    await p.evaluate((n) => {
      const s = document.querySelectorAll("[data-walk-stop]")[n] || document.querySelector("[data-walk-stop]");
      s.click();
    }, idx);
    let last = "", stable = 0;
    while (stable < 6) { await sleep(500);
      const pos = await p.evaluate(() => { const s = document.querySelector("[data-walk]").__walk; return `${s.x.toFixed(1)},${s.depth.toFixed(1)}`; });
      stable = pos === last ? stable + 1 : 0; last = pos; }
    await sleep(2500);
    await p.screenshot({ path: `${out}/${page.replace(".html", "")}${noWebGL ? "-2d" : "-3d"}-s${idx}.png` });
    console.log(page, "stop", idx, "@", last, noWebGL ? "(2d)" : "");
  }
  await p.screenshot({ path: `${out}/${page.replace(".html", "")}${noWebGL ? "-2d" : "-3d"}-mouth.png` });
  await browser.close();
}
(async () => {
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  await shoot(out, "rooms-niagara.html", [3], false);
  await shoot(out, "rooms-niagara.html", [3], true);
  await shoot(out, "rooms.html", [0], false);
  await shoot(out, "rooms.html", [0], true);
  console.log("R48SHOT-DONE");
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
