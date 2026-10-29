/* verify-rail.mjs — the rail's own promise: tap a stop chip, arrive at that stop.
 *
 * Round 69. `verify-walk`'s teaching block taps the stop at z 1392 after turning 48° and taking two
 * metres of strides, and it failed about half the time — twice blamed on the harness. It was the
 * harness *and* the product. The harness half (two JSDOM lanes in one process halving each other's
 * frame rate) is fixed in `verify-walk`; this gate is the product half, on its own, because the
 * teaching block only reproduces the defect from one geometry and passed on the old build once the
 * harness stopped competing with itself.
 *
 * What the defect was, measured with `.verify/_rail.mjs` (this gate is that instrument with
 * assertions):
 *   - the glide's straight line clipped `planter-nakamise-1` (x 278, z 1010, 104×46 cm);
 *   - the solver pushed the body out, and `moved` counted that push-out as movement, so the detour
 *     never fired;
 *   - when it did fire, the detour kept aiming at the stop while it moved sideways, so every step
 *     was a diagonal straight back into the bay it was going round.
 *   Result on the old build: x thrown between 206 and 343 at z 962, 40–90 s without closing a
 *   centimetre — a visitor who taps a chip stands there juddering.
 *
 * The cases are four starting geometries (head angle and stride length before the tap), because the
 * obstruction is a function of where the visitor stands when they press the chip. Each must arrive
 * within ARRIVE_MS, and the run prints the last committed frames of a case that does not.
 *
 * `js/site.js` is patched in memory for the trace, exactly as `_wedge2.cjs` does it: one anchor,
 * asserted to hit once. Run from the repo root: `node .verify/verify-rail.mjs`.
 */
import fs from "node:fs";
import assert from "node:assert/strict";

const rooms = fs.readFileSync("rooms.html", "utf8");
let js = fs.readFileSync("js/site.js", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { JSDOM, VirtualConsole } = await import("jsdom");

const ANCHOR = "  const stepMotion = (dt, glideOnly = false) => {";
const hits = js.split(ANCHOR).length - 1;
assert.equal(hits, 1, `the trace anchor must hit exactly once, hit ${hits}x — re-point it`);
js = js.replace(ANCHOR, ANCHOR + `
    if (gliding && window.__railTrace) window.__railTrace({ x, depth, to: gliding.to, gx: gliding.x, origX: gliding.origX });`);

const TARGET = 1392;                 // the stop the teaching block taps, in rooms.html
const ARRIVE_MS = 30000;             // a clear line is 8.5 s; the old build never arrived at all
const CASES = [
  { turn: 0, stride: 0, why: "from the spawn, straight down the lane" },
  { turn: 400, stride: 200, why: "turned 48°, two metres of strides — the teaching block's own path" },
  { turn: 700, stride: 400, why: "turned further and walked to the east row" },
  { turn: 250, stride: 600, why: "a short turn and a long walk, hard against the planter's line" },
];

function recorder() {
  const noop = () => {};
  return new Proxy({
    canvas: { width: 1024, height: 768 }, fillStyle: "", strokeStyle: "", lineWidth: 1,
    globalCompositeOperation: "source-over", createPattern: () => ({ p: 1 }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
  }, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
}

function boot() {
  const dom = new JSDOM(rooms.replace(/<script[^>]*src=[^>]*><\/script>/g, ""), {
    runScripts: "dangerously", pretendToBeVisual: true, url: "https://huaxu.test/rail.html",
    virtualConsole: new VirtualConsole() });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLElement.prototype.setPointerCapture = () => {};
  w.HTMLElement.prototype.hasPointerCapture = () => false;
  w.matchMedia = (q) => ({ matches: /hover: hover/.test(q), media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
  w.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); } unobserve() {} disconnect() {} };
  w.PointerEvent = w.MouseEvent;
  w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
  w.HTMLCanvasElement.prototype.getContext = function () { return this.__c || (this.__c = recorder()); };
  w.Image = class {
    constructor() { this.naturalWidth = 640; this.naturalHeight = 427; }
    set src(v) { this._s = v; setTimeout(() => { try { if (this.onload) this.onload(); } catch (e) {} }, 5); }
    get src() { return this._s; } get complete() { return !!this._s; }
  };
  w.eval(js);
  return w;
}

let failed = 0;
for (const c of CASES) {
  const w = boot();
  const doc = w.document;
  const body = () => doc.querySelector("[data-walk]").__walk;
  const key = (k, type = "keydown") => (doc.activeElement || doc.documentElement)
    .dispatchEvent(new w.KeyboardEvent(type, { key: k, bubbles: true }));
  const holdT = async (ks, ms) => { ks.forEach((k) => key(k)); await sleep(ms); ks.forEach((k) => key(k, "keyup")); };
  const stops = [...doc.querySelectorAll("[data-walk-stop]")];
  const stop = stops.reduce((b, el) =>
    Math.abs(parseFloat(el.style.getPropertyValue("--z")) - TARGET) <
    Math.abs(parseFloat(b.style.getPropertyValue("--z")) - TARGET) ? el : b, stops[0]);

  if (c.turn) { await holdT(["ArrowRight"], c.turn); await sleep(300); }
  const z0 = body().depth;
  for (let i = 0; i < 200 && body().depth - z0 < c.stride; i += 1) await holdT(["w", "shift"], 120);
  await sleep(300);
  const from = { x: body().x, z: body().depth };

  const frames = [];
  w.__railTrace = (s) => frames.push(s);
  stop.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
  let arrived = false, waited = 0;
  while (waited < ARRIVE_MS) {
    await sleep(100);
    waited += 100;
    if (Math.abs(body().depth - TARGET) < 2) { arrived = true; break; }
  }
  if (!arrived) failed += 1;
  console.log(`${arrived ? "PASS" : "FAIL"}  rail stop ${TARGET} from x ${from.x.toFixed(0)} z ${from.z.toFixed(0)}`
    + ` (${c.why}) — ${arrived ? `arrived in ${(waited / 1000).toFixed(1)} s` : `NOT there after ${(waited / 1000).toFixed(0)} s, at z ${body().depth.toFixed(0)}`}`);
  if (!arrived) {
    console.log("      last committed frames (x, z -> target x, target z):");
    for (const f of frames.slice(-8)) {
      console.log(`        ${f.x.toFixed(1)}, ${f.depth.toFixed(1)}  ->  ${f.gx.toFixed(1)}, ${f.to.toFixed(1)}${f.origX !== undefined ? ` (detouring from x ${f.origX.toFixed(0)})` : ""}`);
    }
  }
  w.close();
}

console.log(`\nverify-rail: ${CASES.length - failed}/${CASES.length} pass`);
process.exit(failed ? 1 : 0);
