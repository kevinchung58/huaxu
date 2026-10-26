/* How a table actually looks, measured on the pixels it occupies.

   Crop to the union of that table's own objects -- a fixed rectangle measures the dark hall
   around a small bright model and calls the model dim. Reports brightness spread, how much
   there is to look at (Sobel edge density), how many colours, and how much of it is warm
   window light, which is the one thing a Little Canada table is supposed to be full of.
   Run:  node .verify/verify-look.mjs   */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TABLES = {
  /* Each table is measured from the stop that stands in front of it, aimed at an ABSOLUTE heading.
     Round 69j replaced two things here: the id lists had drifted (planter-i1/i2, stall-m1..m3 and
     crate-m1/m2 are not on any page in this build), and the aim was a count of key presses -- which
     on a clamped 120 ms frame is a 14.4-degree step, i.e. the same defect that made round 69h's
     frames mislabelled. The heading now comes from a measured drag (0.09 deg per pixel, site.js),
     so the view is the same on a fast machine and a software rasteriser. The stop/heading pairs are
     the ones that put each diorama largest on screen (measured across all five stops and both
     directions: lake 115,460 px2 at stop 0/-19, falls 45,144 at 0/-4, market 20,790 at 3/-12,
     city 192,800 at 4/-9). */
  lake:   { rooms: "rooms-toronto.html", stop: 0, yaw: -19, ids: ["plinth-lake","pool-lake","boat-lake","tree-i1","tree-i2","tree-s1","tree-s2"] },
  falls:  { rooms: "rooms-toronto.html", stop: 0, yaw: -4,  ids: ["plinth-falls","falls-n","tree-f1","tree-f2"] },
  market: { rooms: "rooms-toronto.html", stop: 3, yaw: -12, ids: ["plinth-market","tree-m1"] },
  city:   { rooms: "rooms-toronto.html", stop: 4, yaw: -9,  ids: ["plinth-sky","tower-cn","skyline-cn","dome-rc","track-c","tram-t","tree-c1","tree-c2","tree-c3"] },
  /* Goat Island (round 69m). The two falls are one place from one spot: Terrapin Point looks
     north-west over the American Falls and north over the Horseshoe's own crest. Measured over all
     four stops and twelve headings (`_probe_goat.mjs`), stop 2 at yaw -30 is where both are large
     on the same frame — the American Falls 357,408 px2 and the Horseshoe 415,484 px2. A plate that
     measured them from two different stands would be a picture of two views, not of the place. */
  goat:   { rooms: "rooms-goat.html", stop: 2, yaw: -30,
            ids: ["falls-american","falls-horseshoe","pool-lower","terrapin"] },
};
const page = await browser.newPage();
let failed = 0;
for (const [name, t] of Object.entries(TABLES)) {
  await page.goto(`http://127.0.0.1:8080/${t.rooms}`, { waitUntil: "networkidle0" });
  await sleep(1500);
  await page.evaluate((s) => document.querySelectorAll("[data-walk-stop]")[s].click(), t.stop);
  await sleep(2600);
  {   // aim by dragging, then read the head back and say so if it did not arrive
    const state = () => page.evaluate(() => {
      const w = document.querySelector("[data-walk]")?.__walk;
      return w ? w.yaw : null;
    });
    for (let pass = 0; pass < 6; pass++) {
      const now = await state();
      const off = ((t.yaw - now + 540) % 360) - 180;
      if (Math.abs(off) <= 0.8) break;
      const px = Math.max(-430, Math.min(430, Math.round(off / 0.09)));
      if (Math.abs(px) < 9) break;
      await page.mouse.move(512, 384);
      await page.mouse.down();
      await page.mouse.move(512 + px, 384, { steps: 3 });
      await page.mouse.up();
      await sleep(300);
    }
    const got = await state();
    if (Math.abs(((t.yaw - got + 540) % 360) - 180) > 1.5) {
      console.log(`FAIL ${name}: asked heading ${t.yaw}, head at ${got.toFixed(1)}`);
      failed++;
    }
  }
  await page.mouse.move(2, 2);
  await sleep(1200);
  const box = await page.evaluate((ids) => {
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,n=0;
    window.__missing = [];
    for (const id of ids) {
      const el = document.querySelector(`[data-obj="${id}"]`);
      // An id the page does not have is not "hidden": it is a stale name in this table, and the
      // measurement it would have produced is missing. Reported, never skipped silently.
      if (!el) { window.__missing.push(id); continue; }
      if (getComputedStyle(el).visibility === "hidden") continue;
      const r = el.getBoundingClientRect(); n++;
      x0=Math.min(x0,r.left); y0=Math.min(y0,r.top); x1=Math.max(x1,r.right); y1=Math.max(y1,r.bottom);
    }
    if (!n) return null;
    x0=Math.max(0,Math.round(x0)); y0=Math.max(0,Math.round(y0));
    return { x:x0, y:y0, w:Math.min(1024-x0,Math.round(x1-x0)), h:Math.min(768-y0,Math.round(y1-y0)), n,
             missing: window.__missing };
  }, t.ids);
  if (box && box.missing && box.missing.length) {
    console.log(`FAIL ${name}: not on the page — ${box.missing.join(", ")}`);
    failed++;
  }
  if (!box || box.w < 8 || box.h < 8) { console.log(`FAIL ${name}: nothing on screen`); failed++; continue; }
  const f = `/tmp/look-${name}.png`;
  await page.screenshot({ path: f });
  const img = await loadImage(f);
  const c = createCanvas(box.w, box.h), g = c.getContext("2d");
  g.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  const d = g.getImageData(0, 0, box.w, box.h).data;
  const N = box.w * box.h;
  const lum = new Float32Array(N); const cols = new Set();
  let warm = 0, sat = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const R=d[i], G=d[i+1], B=d[i+2];
    lum[p] = 0.2126*R + 0.7152*G + 0.0722*B;
    cols.add((R>>3<<10)|(G>>3<<5)|(B>>3));
    const mx=Math.max(R,G,B), mn=Math.min(R,G,B);
    sat += mx ? (mx-mn)/mx : 0;
    if (R>165 && G>125 && B < R-25) warm++;
  }
  const mean = lum.reduce((a,b)=>a+b,0)/N;
  const sd = Math.sqrt(lum.reduce((a,b)=>a+(b-mean)**2,0)/N);
  let edges = 0;
  for (let y = 1; y < box.h-1; y++) for (let x = 1; x < box.w-1; x++) {
    const i = y*box.w+x;
    const gx = lum[i-box.w+1]+2*lum[i+1]+lum[i+box.w+1]-lum[i-box.w-1]-2*lum[i-1]-lum[i+box.w-1];
    const gy = lum[i+box.w-1]+2*lum[i+box.w]+lum[i+box.w+1]-lum[i-box.w-1]-2*lum[i-box.w]-lum[i-box.w+1];
    if (Math.hypot(gx,gy) > 24) edges++;
  }
  const sorted = [...lum].sort((a,b)=>a-b);
  console.log(`${name.padEnd(7)} ${String(box.w).padStart(3)}x${String(box.h).padStart(3)}px (${box.n} objs)  mean ${mean.toFixed(1).padStart(5)}  sd ${sd.toFixed(1).padStart(4)}  p05-p95 ${sorted[(N*0.05)|0].toFixed(0)}-${sorted[(N*0.95)|0].toFixed(0)}  colours ${String(cols.size).padStart(4)}  edge ${(edges/N*100).toFixed(1).padStart(4)}%  sat ${(sat/N).toFixed(2)}  warm ${(warm/N*100).toFixed(1)}%`);
}
await browser.close();
if (failed) { console.log(`\nlook: ${failed} table(s) could not be measured`); process.exit(1); }
console.log("\nlook: every table measured");
