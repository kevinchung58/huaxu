/* Walk to an authored stop and report what the lane actually drew there.

   The measure behind "the plaza floor is one pale sheet": a frame cannot say whether the paving
   was missing, untextured, or textured at a scale the mipmap eats. The lane's own quads can --
   each floor quad carries its mode, its texture key and its uv, so the tile's world size and
   the floor's texture can be read off the page rather than argued from a photograph.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-niagara.html STOP=6 node .verify/_lane.mjs
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const ROOMS = process.env.ROOMS || "rooms-niagara.html";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const STOP = Number(process.env.STOP || 6);
const ARRIVE_MS = Number(process.env.ARRIVE_MS || 300000);
const TOL = Number(process.env.TOL || 6);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 640, height: 480 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
await sleep(800);

const target = await page.evaluate((i) => {
  const el = document.querySelectorAll("[data-walk-stop]")[i];
  if (!el) return null;
  const read = (k) => { const v = Number.parseFloat(getComputedStyle(el).getPropertyValue(k)); return Number.isFinite(v) ? v : null; };
  return { z: read("--z"), x: read("--x"), label: el.getAttribute("aria-label") };
}, STOP);
console.log("target", JSON.stringify(target));
if (!target) { await browser.close(); process.exit(1); }

await page.evaluate((i) => document.querySelectorAll("[data-walk-stop]")[i].click(), STOP);
const t0 = Date.now();
let arrived = false;
while (Date.now() - t0 < ARRIVE_MS) {
  await sleep(400);
  const s = await page.evaluate(() => { const w = document.querySelector("[data-walk]")?.__walk; return w ? { z: w.depth, x: w.x } : null; });
  if (!s) continue;
  if (Math.abs(s.z - target.z) <= TOL && (target.x === null || Math.abs(s.x - target.x) <= TOL)) { arrived = true; break; }
}
console.log("arrived", arrived, "in", Math.round((Date.now() - t0) / 1000), "s");
if (!arrived) { await browser.close(); process.exit(1); }

const dump = await page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  const quads = w?.drawQuads || [];
  const floors = quads.filter((q) => q.world && q.world.every((p) => Math.abs(p[1]) < 0.01));
  // The tile's own mean: a paving that is only a texture has a tone, and the floor's far tiers
  // have to meet it or the plaza wears a step across it. The canvas is on the quad's pattern.
  const tileMean = (q) => {
    const c = q.arg && q.arg.tile;
    if (!c || !c.getContext) return null;
    const g = c.getContext("2d");
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let r = 0, gg = 0, b = 0, n = 0, min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++;
      const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (l < min) min = l; if (l > max) max = l;
    }
    return { size: [c.width, c.height], mean: [r / n, gg / n, b / n].map((v) => Math.round(v * 10) / 10),
             lumaMin: Math.round(min), lumaMax: Math.round(max) };
  };
  const rows = floors.map((q) => {
    const zs = q.world.map((p) => p[2]);
    const xs = q.world.map((p) => p[0]);
    const us = q.uv.map((p) => p[0]);
    const vs = q.uv.map((p) => p[1]);
    return { z0: Math.round(Math.min(...zs)), z1: Math.round(Math.max(...zs)),
             x0: Math.round(Math.min(...xs)), x1: Math.round(Math.max(...xs)),
             u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs),
             mode: q.mode, key: q.textureKey, lit: q.lit, air: q.air, day: q.day,
             tile: tileMean(q) };
  }).sort((a, b) => a.z0 - b.z0);
  const byKey = {};
  const seen = {};
  for (const r of rows) {
    byKey[r.key || r.mode] = (byKey[r.key || r.mode] || 0) + 1;
    if (r.tile && !seen[r.key]) seen[r.key] = r.tile;
  }
  return { camera: { z: w.depth, x: w.x }, total: quads.length, floors: rows.length, byKey, tiles: seen,
           rows: rows.slice(0, 6) };
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
