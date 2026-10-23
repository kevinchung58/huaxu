/* What is standing near this stop? A list, with measurements, of the quads around the camera.

   Why this exists: a frame can show "a tall blue-grey column in the middle of the walk" and
   leave the reader to guess what it is. In round 65 that column was, for three frames, an
   unknown -- it could have been the incline's rail, a lamp post, a world tower, or a mistake.
   Guessing is what the repo's own rule forbids ("measure, never assert"), so this reads the
   lane's own quads (the same `__walk.drawQuads` the renderer draws) and prints what is there:
   each quad's colour, its centre, its height range, whether it stands on the ground, and how
   far it is from the camera.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-niagara.html STOP=6 RADIUS=6000 \
           node .verify/_near.mjs
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
const RADIUS = Number(process.env.RADIUS || 6000);     // cm: how far around the camera to look
const MINH = Number(process.env.MINH || 120);          // cm: ignore the floor and the kerb
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

const dump = await page.evaluate((radius, minH) => {
  const w = document.querySelector("[data-walk]")?.__walk;
  const cam = { x: w.x, z: w.depth, yaw: w.yaw };
  const quads = w?.drawQuads || [];
  const out = [];
  for (const q of quads) {
    const pts = q.world || [];
    if (!pts.length) continue;
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), zs = pts.map((p) => p[2]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const z0 = Math.min(...zs), z1 = Math.max(...zs);
    if (y1 - y0 < minH) continue;                    // the floor and the kerb are not "nearby things"
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, cy = (y0 + y1) / 2;
    const d = Math.hypot(cx - cam.x, cz - cam.z);
    if (d > radius) continue;
    // the bearing, in the lane's own convention: 0 is up the lane (+z), 90 is east (+x)
    const bear = ((Math.atan2(cx - cam.x, cz - cam.z) * 180 / Math.PI) + 360) % 360;
    out.push({
      d: Math.round(d), bear: Math.round(bear),
      x: `${Math.round(x0)}..${Math.round(x1)}`, z: `${Math.round(z0)}..${Math.round(z1)}`,
      y: `${Math.round(y0)}..${Math.round(y1)}`, w: Math.round(x1 - x0), h: Math.round(y1 - y0),
      col: q.mode === "flat" ? String(q.arg) : `pat:${q.textureKey || "?"}`,
      stand: y0 < 1 ? "ground" : "float",
    });
  }
  out.sort((a, b) => a.d - b.d);
  return { cam, total: quads.length, near: out.length, rows: out.slice(0, 120) };
}, RADIUS, MINH);
console.log(`camera x ${dump.cam.x} z ${dump.cam.z} yaw ${Math.round(dump.cam.yaw)} — ${dump.total} quads drawn, ${dump.near} near`);
console.log("   d  bear        x-range      z-range      y-range   w   h  stand  colour");
for (const r of dump.rows) {
  console.log(`${String(r.d).padStart(5)} ${String(r.bear).padStart(4)}  ${r.x.padEnd(12)} ${r.z.padEnd(12)} ${r.y.padEnd(11)} ${String(r.w).padStart(4)} ${String(r.h).padStart(4)}  ${r.stand}  ${r.col}`);
}
await browser.close();
