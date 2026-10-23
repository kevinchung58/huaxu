/* Look at the paving tile itself.

   The measure behind "the plaza floor is one pale sheet": the tile is what the floor draws, and
   a tile can be measured without walking anywhere. This prints the tile the page actually built
   (its canvas, tone-mapped as the renderer will see it), its mean and its spread, and a small
   picture of it — so a claim about the paving can be checked against the paving.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-niagara.html node .verify/_tile.mjs
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const ROOMS = process.env.ROOMS || "rooms-niagara.html";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 640, height: 480 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
await sleep(1200);

const out = await page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  const floors = (w?.drawQuads || []).filter((q) => q.world && q.world.every((p) => Math.abs(p[1]) < 0.01));
  const seen = {};
  for (const q of floors) {
    const key = q.textureKey || q.mode;
    if (seen[key]) continue;
    const c = q.arg && q.arg.tile;
    if (!c || !c.getContext) continue;
    const g = c.getContext("2d");
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let r = 0, gg = 0, b = 0, n = 0, min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++;
      const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (l < min) min = l; if (l > max) max = l;
    }
    // a picture of the tile: every fourth pixel, by luma
    const ramp = " .:-=+*#%@";
    const rows = [];
    for (let y = 0; y < c.height; y += 4) {
      let line = "";
      for (let x = 0; x < c.width; x += 2) {
        const i = (y * c.width + x) * 4;
        const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
        line += ramp[Math.min(9, Math.max(0, Math.floor((l - 80) / 10)))];
      }
      rows.push(line);
    }
    seen[key] = { size: [c.width, c.height],
                  mean: [r / n, gg / n, b / n].map((v) => Math.round(v * 10) / 10),
                  lumaMin: Math.round(min), lumaMax: Math.round(max), art: rows,
                  row10: Array.from({ length: c.width }, (_, x) => { const i = (10 * c.width + x) * 4;
                    return (d[i] + d[i + 1] + d[i + 2]) / 3; }).map((v) => Math.round(v)),
                  col10: Array.from({ length: c.height }, (_, y) => { const i = (y * c.width + 10) * 4;
                    return (d[i] + d[i + 1] + d[i + 2]) / 3; }).map((v) => Math.round(v)) };
  }
  return { camera: { z: w.depth, x: w.x }, floorQuads: floors.length, tiles: seen };
});
for (const [key, t] of Object.entries(out.tiles)) {
  console.log(`--- ${key}  ${t.size.join("x")}  mean ${t.mean.join(",")}  luma ${t.lumaMin}..${t.lumaMax}`);
  console.log("row y=10: " + t.row10.join(" "));
  console.log("col x=10: " + t.col10.join(" "));
  console.log(t.art.join("\n"));
}
await browser.close();
