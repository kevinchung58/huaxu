/* Stand at an authored stop and look at a computed yaw, and save the frame.

   Why this exists beside `_aim.mjs`: that script waits 20 s for the body to reach a stop, and the
   software renderer in this sandbox walks about 145 cm/s of *wall clock* -- so a stop 86 m down the
   lane was never reached and the frame was taken from wherever the glide happened to be. A frame
   of the wrong place is worse than no frame, because it reads as evidence.

   So this one waits for arrival properly (the site's own `--z` target, up to ARRIVE_MS), reports
   the depth and yaw it actually reached, and refuses to save a frame it did not arrive at.

   Two more traps it closes, both paid for in TODO rounds 61-63:
     - the visitor's hour rides in localStorage (`huaxu.walk-hour.v1`), so `HOUR=night` opens the
       lane at the hour its records were authored at;
     - the pointer parked over the canvas floats a preview card over the picture, so the mouse is
       moved out of the frame before every shot.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-niagara.html \
           HOUR=night VIEWS='6:-18,6:60' node .verify/_view.mjs .preview/r64/plaza */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const ROOMS = process.env.ROOMS || "rooms.html";
const OUT = process.argv[2] || ".preview/view";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const HOUR = process.env.HOUR || "day";
const ARRIVE_MS = Number(process.env.ARRIVE_MS || 300000);
const TOL = Number(process.env.TOL || 6);          // cm: how close to the authored depth is "there"
const VIEWS = (process.env.VIEWS || "0:0").split(",")
  .map((v) => { const [i, yaw, label] = v.split(":"); return { stop: Number(i), yaw: Number(yaw), label: label || "" }; })
  .filter((v) => Number.isFinite(v.stop) && Number.isFinite(v.yaw));
// The software renderer in this sandbox walks at a few centimetres a second of wall clock, so the
// frame size is a cost: a smaller viewport renders faster and the walk arrives sooner. The
// viewport is written into the frame's name so a measurement is never read at the wrong size.
const VW = Number(process.env.VIEW_W || 1024), VH = Number(process.env.VIEW_H || 768);

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"],
  headless: true, defaultViewport: { width: VW, height: VH },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text()); });

// The visitor's hour is theirs, and it is kept across pages: set it before the lane boots.
await page.evaluateOnNewDocument((hour) => {
  try { if (hour === "night") window.localStorage.setItem("huaxu.walk-hour.v1", "night"); }
  catch (e) { /* private mode: the choice lives this visit only */ }
}, HOUR);

await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
await sleep(800);

const state = () => page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  return w ? { x: w.x, z: w.depth, yaw: w.yaw, pitch: w.pitch, renderer: w.renderer, quads: w.quads } : null;
});

for (const view of VIEWS) {
  const target = await page.evaluate((i) => {
    const el = document.querySelectorAll("[data-walk-stop]")[i];
    if (!el) return null;
    const read = (k) => { const v = Number.parseFloat(getComputedStyle(el).getPropertyValue(k)); return Number.isFinite(v) ? v : null; };
    return { z: read("--z"), x: read("--x"), yaw: el.dataset.viewYaw !== undefined ? Number(el.dataset.viewYaw) : null,
             pitch: el.dataset.viewPitch !== undefined ? Number(el.dataset.viewPitch) : null,
             label: el.getAttribute("aria-label") };
  }, view.stop);
  if (!target) { console.log(`SKIP stop ${view.stop}: no such stop`); continue; }

  await page.evaluate((i) => document.querySelectorAll("[data-walk-stop]")[i].click(), view.stop);
  const t0 = Date.now();
  let arrived = false;
  while (Date.now() - t0 < ARRIVE_MS) {
    await sleep(400);
    const s = await state();
    if (!s) continue;
    const zOk = Math.abs(s.z - target.z) <= TOL;
    const xOk = target.x === null || Math.abs(s.x - target.x) <= TOL;
    if (zOk && xOk) { arrived = true; break; }
  }
  const at = await state();
  console.log(`STOP ${view.stop} ${target.label} → ${JSON.stringify({ target, at, arrived, waited: Math.round((Date.now() - t0) / 1000) })}`);
  if (!arrived) { console.log(`NOT THERE: stop ${view.stop} — no frame saved`); continue; }

  /* Aiming, third version, because the first two were both wrong and both looked fine.

     v1 held an arrow key for at least 600 ms ("a software rasteriser needs a long hold"): at 120
     deg/s that is 72 degrees, and three frames named yaw0 were shot at -15.9, -34.1 and -20.9.
     v2 sized the burst to the angle left and re-read the head. It still could not land: the lane
     integrates turning per frame with dt clamped to 0.12 s, so the SMALLEST turn a key press can
     make is 120 * 0.12 = 14.4 degrees (measured: a 150 ms hold moved the head 14.4 and stopped).
     A key cannot aim a camera to a degree on a slow frame; a drag can.

     So the aim is the gesture a visitor with a mouse or a thumb actually uses: pointer down, move,
     up. That path sets the heading from the drag distance (0.09 deg per pixel, site.js) instead of
     integrating it over frames, so one drag lands wherever it is aimed. Drags travel at least 9 px
     because a pointerup that moved less than 8 px is a *tap* in the lane's own rule, and a tap
     presses whatever is under the pointer. Residual under 0.8 deg is left alone: it is under a
     pixel at this focal length, and inside the tolerance the stops are read back with. */
  const DRAG = 0.09, cx = Math.round(VW / 2), cy = Math.round(VH / 2);
  const dragBy = async (px) => {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + px, cy, { steps: 3 });
    await page.mouse.up();
    await sleep(260);
  };
  let off = 0, aimed = false;
  for (let guard = 0; guard < 8; guard++) {
    const s2 = await state();
    off = ((view.yaw - s2.yaw + 540) % 360) - 180;
    if (Math.abs(off) <= 0.8) { aimed = true; break; }
    const px = Math.max(-420, Math.min(420, Math.round(off / DRAG)));
    if (Math.abs(px) < 9) { aimed = Math.abs(off) <= 0.8; break; }
    await dragBy(px);
  }
  // The last word is the head's own, read after it settles.
  let s3 = await state();
  for (let i = 0; i < 6 && s3; i++) { await sleep(200); const n = await state(); if (n && Math.abs(n.yaw - s3.yaw) < 0.02) break; s3 = n; }
  off = s3 ? ((view.yaw - s3.yaw + 540) % 360) - 180 : 0;
  if (Math.abs(off) > 1.2) { console.log(`NOT AIMED: stop ${view.stop} — ${off.toFixed(1)} deg off, no frame saved`); continue; }
  // The pointer to the corner with no button held: a hover, not a drag, so the head does not move,
  // and a preview card no longer floats over the picture.
  await page.mouse.move(2, 2);
  await sleep(900);
  const s = await state();
  // The file is named for the head that was actually there, never for the wish.
  const name = `stop${view.stop}-yaw${s ? Math.round(s.yaw) : Math.round(view.yaw)}-${VW}x${VH}${view.label ? "-" + view.label : ""}`;
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`SHOT ${name} at ${JSON.stringify(s)}`);
}
await browser.close();
console.log(`_view: frames in ${OUT}`);
