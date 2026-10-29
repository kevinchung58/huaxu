/* wall-live — the collision gates on real input in a real browser (round 42 §0x item 2).

   jsdom drives the same moveBody, but this harness exists because the owner's report came from
   playing the site with a keyboard: it presses real keys in headless Chromium, walks the ring of
   each page while holding a brace against walls and plinths, and fails (loudly, in the output)
   if the live body ever stops answering while floor is legal ahead of the press. It also reads
   the rAF cadence, which doubles as the software-renderer frame-time figure a report keeps asking
   for — the numbers are printed, and printing is this file's whole job: it is an instrument.

   Run (needs the restored env + LD_LIBRARY_PATH=/tmp/al2023/lib and `sh bin/preview`):
     node .verify/wall-live.mjs                       # all seven walkable pages
     GATE_PAGE=rooms-fukuoka node .verify/wall-live.mjs
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
  console.log("wall-live: puppeteer-core/@sparticuz/chromium not installed — skipped");
  process.exit(0);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"],
  headless: true,
  defaultViewport: { width: 800, height: 500 },
});
const page = await browser.newPage();
let deadStops = 0, frames = 0;

for (const name of PAGES) {
  await page.goto(`${BASE}/${name}.html`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction("document.querySelector('[data-walk]') && document.querySelector('[data-walk]').__walk", { timeout: 15000 });
  // a recorder the page runs itself: 16 ms samples of the live body + frame cadence
  await page.evaluate(() => {
    const w = () => document.querySelector("[data-walk]").__walk;
    window.__live = { samples: [], on: false, props: Array.from(document.querySelectorAll("[data-obj][data-solid=\"true\"]")).map((el) => ({
      id: el.dataset.obj, x: parseFloat(el.style.getPropertyValue("--x")) || 0, z: parseFloat(el.style.getPropertyValue("--z")) || 0,
      w: parseFloat(el.dataset.w) || 0, d: parseFloat(el.dataset.d) || 0, ry: parseFloat(el.dataset.ry || 0),
    })) };
    let last = performance.now();
    (function tick(t) {
      const L = window.__live; const s = w();
      if (L.on) {
        L.samples.push([+s.x.toFixed(2), +s.depth.toFixed(2), +s.yaw.toFixed(1), t - last]);
        if (L.samples.length > 4000) L.samples.shift();
      }
      last = t;
      requestAnimationFrame(tick);
    })(performance.now());
    // Ask the LIVE SOLVER, don't re-implement it: round 42's version probed props only, which
    // is exactly why it passed while painted world walls were walk-through (the owner's round-45
    // report). blockedAt is the page's own colliders() — props and wall strips — so a probe
    // answer here is the solver's real answer at an arbitrary reachable point.
    window.__liveCollides = (x, z) => {
      const st = w();
      return st.blockedAt(x, z) || Math.abs(x) > st.halfWidth || z < st.minDepth || z > st.maxDepth;
    };
  });
  // hold W and turn a full circle in 12 steps: every heading drives into whatever the room has
  await page.keyboard.down("w");
  for (let k = 0; k < 12; k++) {
    await page.evaluate(() => { window.__live.samples.length = 0; window.__live.on = true; });
    await page.keyboard.down("ArrowRight");
    await sleep(300);                                        // ~22° of turn while walking
    await page.keyboard.up("ArrowRight");
    await sleep(1600);                                       // then a full brace-and-press
    const { dead, times } = await page.evaluate(() => {
      window.__live.on = false;
      const S = window.__live.samples; const C = window.__liveCollides;
      const w = () => document.querySelector("[data-walk]").__walk;
      const st = w(); const hw = st.halfWidth, mn = st.minDepth, mx = st.maxDepth;
      let deadStops = 0, still = 0;
      for (let i = 1; i < S.length; i++) {
        const sp = Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]) / 0.05;   // cm/s per ~50ms sample
        if (sp < 2) {
          still++;
          if (still === 8) {   // 0.4 s with no answer
            const yaw = S[i][2] * Math.PI / 180;
            let fwd = false;
            for (let q = 1; q <= 4 && !fwd; q++) {          // can the press reach floor within 1.8 s?
              const fx = S[i][0] + Math.sin(yaw) * 40 * q, fz = S[i][1] + Math.cos(yaw) * 40 * q;
              if (!C(fx, fz) && Math.abs(fx) <= hw && fz >= mn && fz <= mx) fwd = true;
            }
            if (fwd) deadStops++;
          }
        } else still = 0;
      }
      return { dead: deadStops, times: S.slice(1).map((s, i) => [s[3], S[i][3]]).map((p) => p[0]) };
    });
    frames += times.length;
    deadStops += dead;
    const p50 = times.length ? [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)].toFixed(1) : "-";
    const p95 = times.length ? [...times].sort((a, b) => a - b)[Math.floor(times.length * 0.95)].toFixed(1) : "-";
    console.log(`${name} heading ${k * 30}°: dead-stops-with-floor-ahead=${dead} frame p50=${p50}ms p95=${p95}ms`);
  }
  await page.keyboard.up("w");
}
console.log(`\nwall-live: ${deadStops} dead stops over ${frames} frame samples across ${PAGES.length} pages`);
console.log("(instrument only — verify-collision is the gate)");
await browser.close();
process.exit(0);
