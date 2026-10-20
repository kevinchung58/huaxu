/* Night legibility, measured from the composited page screenshot — not from canvas readback, not
   from an assertion. The owner's complaint was 「黑夜你自己進去看都是黑的」, so the standard for a
   night frame is arithmetic the frame must meet: the ground band must carry real luma (floor) and
   real structure (spread). Day is measured alongside as the ceiling the hour button trades with.
   Pages: the three lanes the visitor can set plus the LookOut, whose authored held night must pass
   the same floor — it is the reference hour NIGHT is pinned to. Both render paths: 3D as served,
   2D via --disable-webgl, which is how the fallback really boots. */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const { createCanvas, loadImage } = req("@napi-rs/canvas");
const fs = require("node:fs");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const FLOOR = 26;   // mean luma 0-255 in the ground band: below this the eye reads "black"
const SPREAD = 9;   // std dev: a uniform murk with no structure is a blackout in disguise

const band = async (png, x0, y0, x1, y1) => {
  const img = await loadImage(png);
  const c = createCanvas(img.width, img.height); const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const sx = Math.round(img.width * x0), sy = Math.round(img.height * y0);
  const w = Math.round(img.width * (x1 - x0)), h = Math.round(img.height * (y1 - y0));
  const d = g.getImageData(sx, sy, w, h).data;
  let s = 0, s2 = 0, n = w * h;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    s += l; s2 += l * l;
  }
  const m = s / n;
  return { mean: +m.toFixed(1), std: +Math.sqrt(Math.max(0, s2 / n - m * m)).toFixed(1) };
};

(async () => {
  fs.mkdirSync(".preview/round49-hour", { recursive: true });
  const out = [];
  for (const mode of ["3d", "2d"]) {
    const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
      args: [...chromium.args, "--no-sandbox", ...(mode === "2d" ? ["--disable-webgl", "--disable-webgl2"] : [])],
      headless: true, defaultViewport: { width: 900, height: 560 } });
    for (const target of [
      { url: "rooms-niagara.html", stop: 3, held: false },
      { url: "street.html", stop: 0, held: false },
      { url: "rooms-cntower.html", stop: 0, held: true },
    ]) {
      const page = await browser.newPage();
      page.on("pageerror", (e) => console.log("PAGEERROR", target.url, e.message.slice(0, 100)));
      await page.goto("http://127.0.0.1:8080/" + target.url, { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
      if (target.stop) await page.evaluate((s) => document.querySelectorAll("[data-walk-stop]")[s].click(), target.stop);
      await sleep(14000);                       // settle: glides, tone breathing, lamps
      const dayPng = await page.screenshot({ path: `.preview/round49-hour/${mode}-${target.url}-day.png`, type: "png" });
      let nightPng = dayPng;
      if (target.held) {
        out.push({ mode, page: target.url, held: true });   // its boot IS the authored night; no button
      } else {
        await page.evaluate(() => document.querySelector("[data-walk-hour]").click());
        await sleep(12000);
        nightPng = await page.screenshot({ path: `.preview/round49-hour/${mode}-${target.url}-night.png`, type: "png" });
      }
      const day = await band(dayPng, 0.10, 0.55, 0.90, 0.90);
      const night = await band(nightPng, 0.10, 0.55, 0.90, 0.90);
      out.push({ mode, page: target.url, day, night, held: false });
      await page.close();
    }
    await browser.close();
  }
  let bad = 0;
  for (const r of out) {
    if (r.held) { console.log(r.mode, r.page, "HELD — boot frame is the authored night (see -day.png)"); continue; }
    const ok = r.night.mean >= FLOOR && r.night.std >= SPREAD;
    if (!ok) bad++;
    console.log(`${ok ? "OK  " : "LOW "} ${r.mode} ${r.page.padEnd(22)} day ${r.day.mean}/${r.day.std}  night ${r.night.mean}/${r.night.std}  (floor ${FLOOR}/${SPREAD})`);
  }
  console.log(bad ? `HOURPROBE-FAIL ${bad}` : "HOURPROBE-PASS");
})().catch((e) => { console.log("ERR", e.message.slice(0, 160)); process.exit(1); });
