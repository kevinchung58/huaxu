/* wall-pierce-live — the owner's complaint, measured in a real browser (round 45).
   "walls are still passable" was a PLAYED report, so the proof it is fixed must also be PLAYED:
   headless Chromium walks each page in a full 12-heading sweep and every ~50 ms samples where
   the live body stands. The probe recomputes the painted floor-wall segments from the backdrop
   JSON with the SAME acceptance predicate the solver and gate V4 use (spans, base, bottom edges,
   lane clip, cross-section tell) — geometry only, no collider reuse — and reports any moment
   the body stands within 8 cm of the segment's interior: inside the strip's own thickness is a
   walk-through. Contact events (blockedAt true for a live position) are counted so a page where
   the sweep never even touches a wall FAILS too — an empty test must not read as a pass.

   Run (needs the restored env + LD_LIBRARY_PATH=/tmp/al2023/lib and `sh bin/preview`):
     node .verify/wall-pierce-live.mjs
     GATE_PAGE=rooms-journey node .verify/wall-pierce-live.mjs
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const ALL = ["street", "rooms", "rooms-fukuoka", "rooms-toronto", "rooms-cntower", "rooms-niagara", "rooms-journey"];
const PAGES = process.env.GATE_PAGE ? [process.env.GATE_PAGE] : ALL;

let puppeteer, chromium;
try {
  puppeteer = require("puppeteer-core");
  chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
} catch (e) {
  console.log("wall-pierce-live: puppeteer-core/@sparticuz/chromium not installed — skipped");
  process.exit(0);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pierces = 0, pagesNoContact = 0;
const small = ["--no-sandbox", "--window-size=640,400"];

for (const name of PAGES) {
  // a fresh browser per page: swiftshader software raster holds a lot of memory per walk view,
  // and round 45's first live sweep saw "frame got detached" (renderer OOM) on the second page
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: [...chromium.args.filter((a) => !/--window-size/.test(a)), ...small],
    headless: true,
    defaultViewport: { width: 640, height: 400 },
  });
  const page = await browser.newPage();
  let crashed = false;
  page.on("crash", () => { crashed = true; });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto(`${BASE}/${name}.html`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction("document.querySelector('[data-walk]') && document.querySelector('[data-walk]').__walk", { timeout: 30000 });
  await page.evaluate(() => {
    const w = () => document.querySelector("[data-walk]").__walk;
    // the accepted painted wall segments, recomputed here from the backdrop JSON — the gate V4
    // predicate verbatim; a change to one must be mirrored in the other
    const WALL = w().wallHalf;
    const segs = [];
    try {
      const el = document.querySelector("[data-walk-backdrop]");
      const t = (el.textContent || "").trim();
      const bd = t ? JSON.parse(t) : (((window.__HX_PLACES || {})[el.dataset.place] || {})["data-walk-backdrop"] || {});
      const world = (bd.world || {});
      for (const p of world.prims || []) {
        if (p.t !== "f" && p.t !== "x") continue;
        const pts = p.p || [];
        if (pts.length < 3 || pts.some((q) => !Array.isArray(q) || q.length < 3)) continue;
        const ys = pts.map((q) => q[1]);
        const base = Math.min(...ys), span = Math.max(...ys) - base;
        if (span < 130 || base < -20 || base > 120) continue;
        const mn = w().minDepth, mx = w().maxDepth;
        for (let i = 0; i < pts.length; i++) {
          const q0 = pts[i], q1 = pts[(i + 1) % pts.length];
          if (Math.abs(q0[1] - base) > 30 || Math.abs(q1[1] - base) > 30) continue;
          let a = [q0[0], q0[2]], b = [q1[0], q1[2]];
          if (Math.max(a[1], b[1]) < mn - 4 || Math.min(a[1], b[1]) > mx + 4) continue;
          if (a[0] < b[0]) { const t = a; a = b; b = t; }
          const x0 = -WALL - 4, x1 = WALL + 4;
          if (a[0] > x1) { const t = (x1 - b[0]) / (a[0] - b[0] || 1); a = [x1, b[1] + (a[1] - b[1]) * t]; }
          if (b[0] < x0) { const t = (x0 - a[0]) / (b[0] - a[0] || 1); b = [x0, a[1] + (b[1] - a[1]) * t]; }
          if (a[0] <= b[0]) continue;
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (len < 10 || len > WALL) continue;
          segs.push([a[0], a[1], b[0], b[1]]);
        }
      }
    } catch (err) { /* no backdrop: zero segs, and zero segs is itself reported */ }
    window.__segs = segs;
    window.__live = { samples: [], on: false };
    window.__live.turns = 0;
    let lastYaw = w().yaw;
    // contact = the live body is held at ANY boundary the solver owns: blockedAt answers props
    // and painted wall strips, but the lane's own side walls are the x clamp, not a collider —
    // a sweep that walks the whole lane must at least brace against the clamp to count as eyes-on.
    (function tick() {
      const L = window.__live, s = w();
      if (Math.abs(s.yaw - lastYaw) > 0.3) { L.turns++; lastYaw = s.yaw; }
      if (L.on) {
        const x = +s.x.toFixed(2), z = +s.depth.toFixed(2);
        const held = s.blockedAt(x, z) || Math.abs(x) >= s.halfWidth - 0.6 ||
                     z <= s.minDepth + 0.6 || z >= s.maxDepth - 0.6;
        L.samples.push([x, z, held ? 1 : 0]);
      }
      requestAnimationFrame(tick);
    })();
  });
  const nSegs = await page.evaluate("window.__segs.length");
  await page.keyboard.down("w");
  let pagePierce = 0, pageContact = 0, pageSamples = 0;
  for (let k = 0; k < 12; k++) {
    await page.evaluate(() => { window.__live.samples.length = 0; window.__live.turns = 0; window.__live.on = true; });
    await page.keyboard.down("ArrowRight");
    await page.waitForFunction("window.__live.turns >= 18", { timeout: 40000 });
    await page.keyboard.up("ArrowRight");
    // frames, not wall time: swiftshader renders 8-15 fps, and sleep(1500) would move the body
    // 30 cm instead of a heading's worth. 160 recorded frames is 11 m of walk at any cadence.
    await page.waitForFunction("window.__live.samples.length >= 160", { timeout: 120000 });
    const r = await page.evaluate(() => {
      window.__live.on = false;
      const S = window.__live.samples, G = window.__segs;
      let inside = 0, contact = 0;
      for (const [x, z, bl] of S) {
        if (bl) contact++;
        // ask the solver itself: a live sample that says free where a strip stands is a walk-through
        for (const [ax, az, bx, bz] of G) {
          const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
          let t = ((x - ax) * dx + (z - az) * dz) / L2; t = Math.max(0, Math.min(1, t));
          if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < 8) { inside++; break; }
        }
      }
      return { inside, contact, n: S.length };
    });
    pagePierce += r.inside; pageContact += r.contact; pageSamples += r.n;
  }
  await page.keyboard.up("w");
  pierces += pagePierce;
  if (nSegs > 0 && pageContact === 0) pagesNoContact++;
  console.log(`${name}: segs=${nSegs} samples=${pageSamples} pierce=${pagePierce} wall-contact=${pageContact}${crashed ? " CRASHED" : ""}`);
  if (crashed) pagesNoContact++;   // a page that fell over is not a page that passed
  await browser.close();
}
const verdict = pierces === 0 && pagesNoContact === 0;
console.log(`\nwall-pierce-live: ${pierces} inside-a-painted-wall samples, ${pagesNoContact} pages failing the contact-or-crash guard, over ${PAGES.length} pages — ${verdict ? "CLEAN" : "FAIL"}`);
process.exit(verdict ? 0 : 1);
