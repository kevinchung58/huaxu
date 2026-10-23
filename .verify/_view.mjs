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

  // Turn with a held arrow key: the same rate the visitor has, and it cannot press anything.
  // The rate is the site's own (TURN_RATE in js/site.js), and the hold is cut short by a tenth:
  // a frame on a software rasteriser can be a third of a second, and a hold sized for the frame
  // rate overshoots by tens of degrees when the machine is busy -- which is how a frame labelled
  // "yaw 90" ends up at 148 and photographs the wrong side of the street.
  // The key stays down until the head has actually come round: a frame on a software rasteriser
  // can be a third of a second, and a hold timed to the frame rate is a hold the lane never
  // sees -- the key goes down and up between two ticks, and the head does not move at all.
  const TURN_RATE = 120;
  for (let guard = 0; guard < 24; guard++) {
    const s = await state();
    const d = ((view.yaw - s.yaw + 540) % 360) - 180;
    if (Math.abs(d) < 1.5) break;
    const key = d > 0 ? "ArrowRight" : "ArrowLeft";
    await page.keyboard.down(key);
    const budget = Math.max(600, (Math.abs(d) / TURN_RATE) * 1000 * 1.35);
    const t0 = Date.now();
    while (Date.now() - t0 < budget) {
      await sleep(60);
      const s2 = await state();
      const moved = Math.abs(((s2.yaw - s.yaw + 540) % 360) - 180);
      if (moved >= Math.abs(d) - 1.2) break;
    }
    await page.keyboard.up(key);
    await sleep(160);
  }
  // The pointer out of the frame: a preview card floats over the picture when it rests on the canvas.
  await page.mouse.move(2, 2);
  await sleep(900);
  const s = await state();
  const name = `stop${view.stop}-yaw${Math.round(view.yaw)}-${VW}x${VH}${view.label ? "-" + view.label : ""}`;
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`SHOT ${name} at ${JSON.stringify(s)}`);
}
await browser.close();
console.log(`_view: frames in ${OUT}`);
