/* _aisleprobe.cjs — does pressing along a long face carry you past it?

   Round 73 found that it did not, sometimes: `moveStep`'s corner assist asked for
   `|along| < 1.9` (1.9 cm) before it stepped in, and 1.9 cm is exactly 115 cm/s at a 16.6 ms frame —
   but `moveBody` splits any hop longer than 2.6 cm into micro-steps, so a full-speed frame arrived as
   two 1.4 cm hops, both "below" the threshold. Every frame spent against a face was read as a corner,
   and the assist crept the body back toward the room's centre at 115 cm/s while the visitor pressed
   forward along it. The dead zone is a speed now (`deadAlong = 115 * dt`).

   The probe walks the Moji hall's port table from six entry headings — the entry x is whatever the
   walk in produced, and the stall only appeared from some of them — then turns east and presses W.
   A pass is every line reaching the hall's east wall. Before the fix: 2 of 6 stalled near x 368.

   Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_aisleprobe.cjs
*/
/* verify-rooms-e2e.cjs — walk the hub and owned spaces with deterministic input.

   The street has exactly three main destinations; real landmark/sub-spaces are
   discovered from their parent object. This harness drives the walk (W to move,
   A/D to edge across, held arrows to turn, E to act, Esc to leave) and proves:

     1. Street doors navigate only to Toronto, Tokyo and Fukuoka.
     2. The narrow Journey lane clamps to its own walls and authored deck extent;
        a sealed Tokyo lane independently proves the end-wall clamp, and jumps respect the ceiling.
     3. Solid display plinths stop the walker without sealing the side aisle, while
        camera-relative movement stays smooth and world-space collision bounds stay fixed.
     4. Child-space exits respawn beside the owning prop, ready to interact again.
     5. The street's own back door leaves for the album, not for another room.

   jsdom has no layout and refuses navigation; the camera math is deterministic,
   so movement is driven by pumping requestAnimationFrame with a monotonic clock
   and a "Not implemented: navigation" error is the click landing. A stubbed
   canvas recorder stands in for pixels, exactly as verify-walk.mjs does.

   Run: node .verify/verify-rooms-e2e.cjs
*/
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");

const js = fs.readFileSync("js/site.js", "utf8");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [], fails = [];
const ok = (n, c, e = "") => { out.push(`${c ? "PASS" : "FAIL"}  ${n}${e ? "  — " + e : ""}`); if (!c) fails.push(n); };

function boot(file, hash = "") {
  return new Promise((resolve, reject) => {
    const navs = [], errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => {
      const m = String((e && e.message) || e);
      if (/navigation/.test(m)) navs.push(m); else errors.push(m);
    });
    // P2 (round 69): the place's world data is a plain script file now; jsdom fetches nothing, so it
    // is inlined here before the external-script strip, the same bytes the browser loads.
    let html = fs.readFileSync(file, "utf8")
      .replace(/<script[^>]*src="(js\/places\/[a-z0-9-]+\.js)(\?[^"]*)?"[^>]*><\/script>/g,
               (_m, src) => `<script>${fs.readFileSync(src, "utf8")}</script>`)
      .replace(/<script[^>]*src=[^>]*><\/script>/g, "");
    const dom = new JSDOM(html, {
      runScripts: "dangerously", pretendToBeVisual: true,
      url: "https://huaxu.test/" + file + hash, virtualConsole: vc,
    });
    const w = dom.window;
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.HTMLElement.prototype.setPointerCapture = () => {};
    w.HTMLElement.prototype.hasPointerCapture = () => false;
    w.HTMLElement.prototype.releasePointerCapture = () => {};
    w.matchMedia = (q) => ({ matches: false, media: q, addEventListener(){}, addListener(){}, removeEventListener(){} });
    w.IntersectionObserver = class {
      constructor(cb){ this.cb = cb; }
      observe(el){ this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); }
      unobserve(){} disconnect(){} };
    w.PointerEvent = w.MouseEvent;
    w.Element.prototype.animate = () => ({ cancel(){}, finished: Promise.resolve() });
    w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
    const noop = () => {};
    const grad = { addColorStop: noop };
    w.HTMLCanvasElement.prototype.getContext = function () {
      return this.__c || (this.__c = {
        canvas: { width: 1024, height: 768 },
        fillStyle: "", strokeStyle: "", lineWidth: 1, globalCompositeOperation: "source-over",
        save(){}, restore(){}, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
        arc: noop, ellipse: noop, rect: noop, fillRect(){}, strokeRect: noop, translate: noop,
        scale: noop, rotate: noop, clip(){}, fill(){}, stroke(){}, drawImage(){}, setTransform(){},
        transform(){}, createPattern: () => ({}), createRadialGradient: () => grad,
        createLinearGradient: () => grad, measureText: () => ({ width: 0 }), fillText(){}, strokeText(){},
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
      constructor(){ this.naturalWidth = 640; this.naturalHeight = 427; }
      set src(v){ this._s = v; setTimeout(() => { if (this.onload) this.onload(); }, 5); }
      get src(){ return this._s; } get complete(){ return !!this._s; }
    };
    // Deterministic clock for the walk: each pump advances 17 ms and drains the rAF queue.
    let now = 1000;
    const queue = [];
    let rafId = 1;
    w.requestAnimationFrame = (cb) => { queue.push({ id: rafId, cb }); return rafId++; };
    w.cancelAnimationFrame = (id) => {
      const i = queue.findIndex((q) => q.id === id);
      if (i >= 0) queue.splice(i, 1);
    };
    w.performance = { now: () => now };
    async function pump(n, frameMs = 17) {
      for (let i = 0; i < n; i++) {
        now += frameMs;
        const snapshot = queue.slice();
        queue.length = 0;
        for (const e of snapshot) { try { e.cb(now); } catch (err) { errors.push("tick: " + err.message); } }
      }
    }
    let result;
    try { result = w.eval(js); } catch (err) { reject(err); return; }
    setTimeout(async () => {
      await pump(40);                                  // boot paints, idle pulse settles
      resolve({
        w, dom, doc: w.document, navs, errors, pump,
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

/* W follows the camera's floor-projected forward direction. Straight lane walks
   below begin at the authored default heading; angled movement is tested by projection. */
async function walkDeep(env, forwardFrames) {
  env.key("w");
  await env.pump(forwardFrames);
  env.keyUp("w");
  await env.pump(6);
}

/* A short, released arrow press is a deliberate turn; holding the key is rate-limited. */
async function tapTurn(env, key = "arrowright") {
  env.key(key);
  await env.pump(5);
  env.keyUp(key);
  await env.pump(2);
}
const wrapYaw = (degrees) => ((degrees + 180) % 360 + 360) % 360 - 180;
async function turnToYaw(env, target) {
  const delta = wrapYaw(target - env.walk().yaw);
  if (Math.abs(delta) < 0.4) return;
  const key = delta < 0 ? "arrowleft" : "arrowright";
  const frames = Math.max(1, Math.round(Math.abs(delta) / (env.walk().turnRate * 0.017)));
  env.key(key);
  await env.pump(frames);
  env.keyUp(key);
  await env.pump(3);
}
async function turnToReach(env, objId, maxTaps = 60) {
  const el = env.doc.querySelector(`[data-obj="${objId}"]`);
  for (let i = 0; i < maxTaps; i++) {
    const r = env.reach();
    if (r && r.dataset.obj === objId) return true;
    if (!el) return false;
    const targetX = parseFloat(el.style.getPropertyValue("--x"));
    const targetZ = parseFloat(el.style.getPropertyValue("--z"));
    const targetYaw = Math.atan2(targetX - env.walk().x, targetZ - env.walk().depth) * 180 / Math.PI;
    await tapTurn(env, wrapYaw(targetYaw - env.walk().yaw) < 0 ? "arrowleft" : "arrowright");
  }
  const r = env.reach();
  return !!(r && r.dataset.obj === objId);
}

/* Walk up to a thing the way a visitor does now: turn to its own bearing, then walk in.

   This replaced a `sidleToReach` that held A and slid sideways toward a door. Round 65 made A/D turn
   the head instead of strafing, so a gate that still holds A spins the walker on the spot and then
   walks it into a wall: every door, print and aisle below reported the neighbouring shopfront as the
   thing in reach, which read as a reach bug and was a gate bug. The walk is repeated in rounds
   because a wall between the body and the thing needs a new bearing once the body has slid along it. */
async function walkToReach(env, objId, maxFrames = 600, rounds = 6) {
  const el = env.doc.querySelector(`[data-obj="${objId}"]`);
  if (!el) return false;
  const tx = () => parseFloat(el.style.getPropertyValue("--x"));
  const tz = () => parseFloat(el.style.getPropertyValue("--z"));
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

/* Hold W until the body stops moving — the honest way to meet a wall, now that walking goes where the
   head points rather than down the lane's own axis. Returns the resting position. */
async function walkUntilBlocked(env, maxFrames = 900) {
  env.key("w");
  let last = env.walk().depth + env.walk().x, still = 0;
  for (let i = 0; i < maxFrames; i += 5) {
    await env.pump(5);
    const now = env.walk().depth + env.walk().x;
    if (Math.abs(now - last) < 0.05) { if (++still >= 3) break; } else { still = 0; }
    last = now;
  }
  env.keyUp("w");
  await env.pump(6);
  return { ...env.walk() };
}

/* Hold W until the walker is deep enough (door z minus a body's width), with a
   hard frame cap. Fixed frame counts lie: forward speed saturates, so the same
   285 frames that cross the lane's mid-depth stop well short of the far door. */
async function walkToDepth(env, target, maxFrames = 1500) {
  env.key("w");
  for (let i = 0; i < maxFrames; i += 5) {
    await env.pump(5);
    if (env.walk().depth >= target) break;
  }
  env.keyUp("w");
  await env.pump(6);
}

/* Turn until the wanted object's press box is on screen (visibility, not reach). */
async function turnToVisible(env, el, maxTaps = 70) {
  for (let i = 0; i < maxTaps; i++) {
    if (el.style.visibility === "visible") return true;
    await tapTurn(env);
  }
  return el.style.visibility === "visible";
}


(async () => {
  for (const pre of [0, 1.4, -1.4, 2.9, -2.9, 4.3]) {
    const env = await boot("rooms-fukuoka.html");
    await turnToYaw(env, pre);
    env.key("w"); await env.pump(900); env.keyUp("w"); await env.pump(8);
    const rest = +env.walk().x.toFixed(1);
    await turnToYaw(env, 90);
    env.key("w");
    let frames = 0;
    for (let i = 0; i < 120 && env.walk().x < env.walk().halfWidth - env.walk().radius - 1; i++) {
      await env.pump(10); frames += 10;
    }
    env.keyUp("w"); await env.pump(6);
    console.log(`pre ${pre}: rest x=${rest} -> x=${env.walk().x.toFixed(1)} (frames ${frames})`);
    env.close();
  }
  process.exit(0);
})();
