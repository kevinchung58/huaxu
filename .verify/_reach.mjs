/* _reach -- can a visitor actually get to the things this site offers to press?

   Round 75. `verify-ux.mjs` asks what happens *when* a pressable box is pressed; it presses them from
   wherever the walker happens to be, so it cannot see a box that no stop can reach. That gap is
   exactly the stall: on street.html the goldfish stall (`stall-kingyo`) sits at x 322, z 957 while the
   authored stops are on the lane's centre line at x 0, and the reach is 190 cm -- so from every stop
   the bar says nothing. A toy that can only be found by wandering off the centre line is the same
   defect as a toy that does nothing: it promises a press and never delivers one.

   This probe walks to every pressable box the way `verify-rooms-e2e` walks to a door (turn to its
   bearing, walk in, repeat while a wall is in the way) and reports, per page, which ones answer the
   reach. jsdom with a deterministic clock, so a pass is minutes rather than hours.

   Run: node .verify/_reach.mjs            (all eight walk pages)
        PAGES=street.html node .verify/_reach.mjs
*/
import fs from "node:fs";

const { JSDOM, VirtualConsole } = await import("jsdom");

const PAGES = (process.env.PAGES || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,"
  + "rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html").split(",");

const js = fs.readFileSync("js/site.js", "utf8");

function boot(file) {
  const navs = [], errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => {
    const m = String((e && e.message) || e);
    if (/navigation/.test(m)) navs.push(m); else errors.push(m);
  });
  /* P2 (round 69): the place's world data is a plain script file; jsdom fetches nothing, so it is
     inlined here before the external-script strip -- the same bytes the browser loads. */
  const html = fs.readFileSync(file, "utf8")
    .replace(/<script[^>]*src="(js\/places\/[a-z0-9-]+\.js)(\?[^"]*)?"[^>]*><\/script>/g,
      (_m, src) => `<script>${fs.readFileSync(src, "utf8")}</script>`)
    .replace(/<script[^>]*src="(js\/games\.js)(\?[^"]*)?"[^>]*><\/script>/g,
      (_m, src) => `<script>${fs.readFileSync(src, "utf8")}</script>`)
    .replace(/<script[^>]*src=[^>]*><\/script>/g, "");
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true,
    url: `https://huaxu.test/${file}`, virtualConsole: vc,
  });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLElement.prototype.setPointerCapture = () => {};
  w.HTMLElement.prototype.hasPointerCapture = () => false;
  w.HTMLElement.prototype.releasePointerCapture = () => {};
  w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
  w.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); }
    unobserve() {} disconnect() {}
  };
  w.PointerEvent = w.MouseEvent;
  w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  const noop = () => {};
  const grad = { addColorStop: noop };
  w.HTMLCanvasElement.prototype.getContext = function () {
    return this.__c || (this.__c = {
      canvas: { width: 1024, height: 768 },
      fillStyle: "", strokeStyle: "", lineWidth: 1, globalCompositeOperation: "source-over",
      save() {}, restore() {}, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
      arc: noop, ellipse: noop, rect: noop, fillRect() {}, strokeRect: noop, translate: noop,
      scale: noop, rotate: noop, clip() {}, fill() {}, stroke() {}, drawImage() {}, setTransform() {},
      transform() {}, createPattern: () => ({}), createRadialGradient: () => grad,
      createLinearGradient: () => grad, measureText: () => ({ width: 0 }), fillText() {}, strokeText() {},
    });
  };
  w.innerWidth = 1024; w.innerHeight = 768; w.devicePixelRatio = 1;
  Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { configurable: true, get() {
    return this.className && String(this.className).includes("walk-view") ? 1024 : 0;
  }});
  Object.defineProperty(w.HTMLElement.prototype, "clientHeight", { configurable: true, get() {
    return this.className && String(this.className).includes("walk-view") ? 768 : 0;
  }});
  w.Image = class {
    constructor() { this.naturalWidth = 640; this.naturalHeight = 427; }
    set src(v) { this._s = v; setTimeout(() => { if (this.onload) this.onload(); }, 5); }
    get src() { return this._s; } get complete() { return !!this._s; }
  };
  /* Deterministic clock: each pump advances 17 ms and drains the rAF queue, so a walk is frames
     rather than wall time. This is the only way a "walk to all 43 boxes" pass is affordable. */
  let now = 1000;
  const queue = [];
  let rafId = 1;
  w.requestAnimationFrame = (cb) => { queue.push({ id: rafId, cb }); return rafId++; };
  w.cancelAnimationFrame = (id) => {
    const i = queue.findIndex((q) => q.id === id);
    if (i >= 0) queue.splice(i, 1);
  };
  Object.defineProperty(w, "performance", { configurable: true, value: { now: () => now } });
  async function pump(n, frameMs = 17) {
    for (let i = 0; i < n; i++) {
      now += frameMs;
      const snapshot = queue.slice();
      queue.length = 0;
      for (const e of snapshot) { try { e.cb(now); } catch (err) { errors.push("tick: " + err.message); } }
    }
  }
  return new Promise((resolve, reject) => {
    try { w.eval(js); } catch (err) { reject(err); return; }
    setTimeout(async () => {
      await pump(40);
      resolve({
        w, doc: w.document, navs, errors, pump,
        walk: () => w.document.querySelector("[data-walk]").__walk,
        key: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })),
        keyUp: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keyup", { key: k, bubbles: true })),
        reach: () => w.document.querySelector(".walk-hit.is-reach"),
        close: () => w.close(),
      });
    }, 250);
  });
}

const wrapYaw = (d) => ((d + 180) % 360 + 360) % 360 - 180;
const prop = (el, name) => Number.parseFloat(el.style.getPropertyValue(name)) || 0;

async function turnToYaw(env, target) {
  for (let i = 0; i < 80; i++) {
    const d = wrapYaw(target - env.walk().yaw);
    if (Math.abs(d) < 4) return;
    const k = d > 0 ? "arrowright" : "arrowleft";
    env.key(k);
    await env.pump(6);
    env.keyUp(k);
    await env.pump(2);
  }
}

async function walkToReach(env, objId, maxFrames = 900, rounds = 6) {
  const el = env.doc.querySelector(`[data-obj="${objId}"]`);
  if (!el) return false;
  const tx = () => prop(el, "--x");
  const tz = () => prop(el, "--z");
  for (let round = 0; round < rounds; round++) {
    const r = env.reach();
    if (r && r.dataset.obj === objId) return true;
    const bearing = Math.atan2(tx() - env.walk().x, tz() - env.walk().depth) * 180 / Math.PI;
    await turnToYaw(env, bearing);
    env.key("w");
    for (let i = 0; i < maxFrames; i += 5) {
      await env.pump(5);
      const now = env.reach();
      if (now && now.dataset.obj === objId) break;
      if (Math.hypot(tx() - env.walk().x, tz() - env.walk().depth) < 90) break;
    }
    env.keyUp("w");
    await env.pump(6);
  }
  const r = env.reach();
  return !!(r && r.dataset.obj === objId);
}

let unreachable = 0, total = 0;
const missing = [];
for (const file of PAGES) {
  if (!fs.existsSync(file)) continue;
  const env = await boot(file);
  const doc = env.doc;
  if (!env.walk()) { console.log(`${file}: NO WALK (skipped)`); env.close(); continue; }
  const pressable = Array.from(doc.querySelectorAll(".walk-hit"))
    .filter((el) => el.dataset.quiet === undefined);
  const stops = Array.from(doc.querySelectorAll("[data-walk-stop]"));
  const misses = [];
  for (const el of pressable) {
    const ox = prop(el, "--x"), oz = prop(el, "--z");
    /* Start from the authored stop nearest the thing: a visitor uses the stop strip, and a box that
       is only reachable from the far end of the lane is still reachable -- and still worth knowing. */
    let best = 0, bestD = Infinity;
    stops.forEach((s, i) => {
      const sz = Number.parseFloat(env.w.getComputedStyle(s).getPropertyValue("--z")) || 0;
      const sx = Number.parseFloat(env.w.getComputedStyle(s).getPropertyValue("--x")) || 0;
      const d = Math.hypot(sx - ox, sz - oz);
      if (d < bestD) { bestD = d; best = i; }
    });
    stops[best].click();
    /* A stop is a jump: wait on the lane's own `glide` handle rather than on a frame count. 40 frames
       of a 640 cm glide is 112 cm of it, and the probe would then walk from wherever the glide had
       got to and call a reachable object unreachable. */
    for (let i = 0; i < 900 && env.walk().glide; i += 10) await env.pump(10);
    await env.pump(10);
    const got = await walkToReach(env, el.dataset.obj);
    total++;
    if (!got) {
      unreachable++;
      misses.push(`${el.dataset.obj} [${el.dataset.verb}] x${Math.round(ox)} z${Math.round(oz)} (nearest stop ${best}, ${Math.round(bestD)} cm)`);
      const w2 = env.walk();
      const d2 = Math.hypot(ox - w2.x, oz - w2.depth);
      console.log(`  MISS  ${file} ${el.dataset.obj} [${el.dataset.verb}]  x${Math.round(ox)} z${Math.round(oz)}  nearest stop ${best} ${Math.round(bestD)} cm  `
        + `stopped at x${Math.round(w2.x)} z${Math.round(w2.depth)} = ${Math.round(d2)} cm away`
        + `  (reach found: ${env.reach() ? env.reach().dataset.obj : "nothing"})`);
    }
  }
  console.log(`${file}: ${pressable.length - misses.length}/${pressable.length} pressable reachable on foot`);
  missing.push(...misses.map((m) => `${file} ${m}`));
  env.close();
}
console.log(`\n${total - unreachable}/${total} pressable boxes can be reached on foot`);
if (missing.length) console.log(missing.join("\n"));
