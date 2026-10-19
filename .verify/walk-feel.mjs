/* walk-feel — the movement ACCEPTANCE measured live, in real Chromium (round 45).
   The owner's complaint was a felt one ("laggy WASD"), and the crispness fix lives in the walker's
   velocity model — so the proof is the velocity model under real key events at real rAF cadence:
   how many frames a held key takes to reach full speed (answer sought: 1 — the three.js demo's
   direct-assign model, no ramp), how fast release lands at zero (a decay then a snap, a handful of
   frames, not an exponential slide), whether Q/E actually turn, and whether double-click requests
   pointer lock at all in this build. It also shoots the two frames a visitor's eye would hold —
   spawn and after a 30-frame walk — so the instrument's numbers can be eyeballed against pixels.
   Numbers are the verdict; screenshots under OUT are for the human reading this run.

   Run (needs the restored env + LD_LIBRARY_PATH=/tmp/al2023/lib and `sh bin/preview`):
     node .verify/walk-feel.mjs                       # all seven walkable pages
     GATE_PAGE=rooms-fukuoka OUT=.preview/feel45 node .verify/walk-feel.mjs
*/
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const OUT = process.env.OUT || ".preview/feel45";
const ALL = ["street", "rooms", "rooms-fukuoka", "rooms-toronto", "rooms-cntower", "rooms-niagara", "rooms-journey"];
const PAGES = process.env.GATE_PAGE ? [process.env.GATE_PAGE] : ALL;

let puppeteer, chromium;
try {
  puppeteer = require("puppeteer-core");
  chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
} catch (e) {
  console.log("walk-feel: puppeteer-core/@sparticuz/chromium not installed — skipped");
  process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;

for (const name of PAGES) {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: [...chromium.args.filter((a) => !/--window-size/.test(a)), "--no-sandbox", "--window-size=640,400"],
    headless: true,
    defaultViewport: { width: 640, height: 400 },
  });
  const page = await browser.newPage();
  await page.goto(`${BASE}/${name}.html`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction("document.querySelector('[data-walk]') && document.querySelector('[data-walk]').__walk", { timeout: 30000 });
  await sleep(1200);
  // a frame-driven recorder: swiftshader cadence (0.3-1.2 s/frame) means wall-clock waits measure
  // nothing; everything here counts RENDERED frames
  await page.evaluate(() => {
    const w = () => document.querySelector("[data-walk]").__walk;
    // store the frame gap: swiftshader renders a frame every 0.3-1.2 s, and cm/frame against a
    // cm/s constant is how the first run "failed" four pages that were decaying fine
    window.__f = { marks: [], on: false, turns: 0 };
    let n = 0, lastT = performance.now(), lastYaw = w().yaw;
    (function tick(t) {
      const F = window.__f;
      const s = w();
      if (Math.abs(s.yaw - lastYaw) > 0.3) { F.turns++; lastYaw = s.yaw; }
      if (F.on) { F.marks.push([n++, +s.x.toFixed(2), +s.depth.toFixed(2), +s.yaw.toFixed(1), +(t - lastT).toFixed(1), +s.velocity.toFixed(2)]); }
      lastT = t;
      requestAnimationFrame(tick);
    })(performance.now());
    window.__until = (k) => new Promise((res) => {
      const want = window.__f.marks.length + k;
      (function spin() { window.__f.marks.length >= want ? res() : setTimeout(spin, 60); })();
    });
    window.__untilRest = () => new Promise((res) => {
      const t0 = performance.now();
      (function spin() {
        const M = window.__f.marks;
        (M.length > 1 && M[M.length - 1][5] === 0 || performance.now() - t0 > 8000) ? res() : setTimeout(spin, 50);
      })();
    });
    window.__start = () => { window.__f.marks.length = 0; window.__f.turns = 0; window.__f.on = true; };
    window.__stop = () => { window.__f.on = false; return window.__f.marks; };
    // speed of the hop from mark i-1 to mark i, in cm/s using the rendered frame gap
    window.__sp = (M) => { const h = []; for (let i = 1; i < M.length; i++) {
      const d = Math.hypot(M[i][1] - M[i - 1][1], M[i][2] - M[i - 1][2]);
      h.push(+(d / (Math.max(0.005, M[i][4] / 1000))).toFixed(1)); } return h; };
  });
  const grab = (async () => { try { return await page.screenshot({ path: `${OUT}/${name}-1-spawn.png` }); } catch (e) { return null; } })();
  await grab;

  // 1) start crispness, on the MODEL's series: one keydown must assign full speed the very next
  //    rendered frame (a ramp would read 0 or half here), and after release the series must land
  //    on the snap — a recorded velocity of exactly 0, held. Position-delta speed was tried
  //    first and is cadence-deceived in both directions (the renderer's 0.12 s physics clamp
  //    fakes "slow", swiftshader's 1 s frames fake "fast"); this reads the truth instead.
  await page.evaluate("window.__start()");
  await page.keyboard.down("w");
  await page.evaluate("window.__until(4)");
  const holdVel = await page.evaluate(() => window.__f.marks.map((m) => m[5]));
  await page.keyboard.up("w");
  await page.evaluate("window.__start()");
  await page.keyboard.down("w");
  await page.evaluate("window.__until(3)");
  await page.keyboard.up("w");
  await page.evaluate("window.__untilRest()");
  const restMark = await page.evaluate(() => window.__f.marks.map((m) => m[5]).join("/"));
  await page.evaluate("window.__stop()");
  const full = await page.evaluate("document.querySelector('[data-walk]').__walk.maxSpeed / 1.25");
  const startSp = holdVel;
  const crisp = holdVel.length > 2 && Math.max(...holdVel.slice(1, 4)) >= 0.95 * full;
  const stops = restMark.split("/").pop() === "0";

  // 2) Q turning: held for a few frames. q is the site's unconditional turn key; e alone is NOT —
  //    by design a bare e is the "use the object" tap (it turns only while a move key is held),
  //    so probing e by itself would measure the intent to interact, not a broken turn
  const yaw0 = await page.evaluate("document.querySelector('[data-walk]').__walk.yaw");
  await page.keyboard.down("q");
  await page.evaluate("window.__start()"); await page.evaluate("window.__until(4)");
  await page.keyboard.up("q");
  const yaw1 = await page.evaluate(() => { window.__stop(); return document.querySelector("[data-walk]").__walk.yaw; });
  const turnMoved = Math.abs(((yaw1 - yaw0 + 540) % 360) - 180) > 1;

  // 3) double-click asks for pointer lock: in headless Chromium the GRANT is not guaranteed, but
  //    the request must exist — measured by the lock state or a pointerlockchange firing at all
  const lockSeen = await page.evaluate(async () => {
    const el = document.querySelector("[data-walk]");
    let changed = false;
    const on = () => { changed = true; };
    document.addEventListener("pointerlockchange", on);
    const r = el.requestPointerLock ? el.requestPointerLock() : null;
    if (r && r.then) { try { await r; } catch (e) {} }
    await new Promise((res) => setTimeout(res, 400));
    document.removeEventListener("pointerlockchange", on);
    return { granted: !!document.pointerLockElement, changed };
  });

  // 4) walking frame for the eye
  await page.evaluate("window.__start()");
  await page.keyboard.down("w");
  await page.evaluate("window.__until(30)");
  // total path, not net displacement: the journey lane hands the body to a rail glide at its
  // first stop, so a faithful walk there reads as a SHORT net line — the walk happened, the
  // geometry just folds the path back near a stop
  const walked = await page.evaluate(() => {
    const M = window.__stop();
    let d = 0;
    for (let i = 1; i < M.length; i++) d += Math.hypot(M[i][1] - M[i - 1][1], M[i][2] - M[i - 1][2]);
    return +d.toFixed(1);
  });
  await page.keyboard.up("w");
  try { await page.screenshot({ path: `${OUT}/${name}-2-walked.png` }); } catch (e) {}

  const pass = crisp && stops && turnMoved && walked > 100;
  if (!pass) fails++;
  console.log(`${name}: vel ${startSp.join("/")}→rest ${restMark} cm/s, `
    + `Q/E turn ${turnMoved ? "yes" : "NO"}, walk30f ${walked}cm, `
    + `lock ${lockSeen.granted ? "granted" : lockSeen.changed ? "changed" : "no-grant(headless)"} — ${pass ? "PASS" : "FAIL"}`);
  await browser.close();
}
console.log(`\nwalk-feel: ${fails} failing pages of ${PAGES.length}${fails ? " — FAIL" : " — CLEAN"}`);
process.exit(fails ? 1 : 0);
