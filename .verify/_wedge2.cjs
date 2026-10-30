/* _wedge2 — the same sweep as _wedge, but with the solver itself reporting why a frame refused to move.
   Diagnostic only, never committed as a gate: js/site.js is patched in memory (every anchor asserted
   to hit exactly once) and every patched statement only records values. exit 0 always.
   Why: verify-collision's V1 only asks its question at the 24th consecutive slow frame and only
   when the last 30 frames are all under 0.5 cm/s, so the same wedge can pass or fail depending on
   what the frame ring happened to hold. This sweeps wider (every rail stop, 16 headings, the
   diagonal presses, and every solid's four corners) and reports EVERY run of >=20 frames slower
   than 2 cm/s that still has a legal forward exit and a prop within 6 cm — the gate's own
   definition, measured continuously.
   Run: ROUNDS=5 node .verify/_wedge2.cjs [page.html]   (stops at the first round with a hit)
   It patches js/site.js IN MEMORY only; every anchor is asserted to hit exactly once, so editing
   `moveStep` makes it throw by design — re-point the anchors (they are listed in patchedSite below)
   rather than trusting a silent miss. Each patched statement only records; behavior is the site's.
*/
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const { siteText } = require("../bin/site-sources.cjs");
const FILE = process.argv[2] || (process.env.GATE_PAGE ? process.env.GATE_PAGE + ".html" : "rooms.html");

function boot(file) {
  return new Promise((resolve, reject) => {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => { const m = String((e && e.message) || e);
      if (!/navigation/.test(m)) errors.push(m); });
    const html = fs.readFileSync(file, "utf8").replace(/<script src="[^"]*"><\/script>/g, "");
    const js = patchedSite();
    const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true,
      url: "https://huaxu.test/" + file, virtualConsole: vc });
    const w = dom.window;
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.HTMLElement.prototype.setPointerCapture = () => {};
    w.HTMLElement.prototype.hasPointerCapture = () => false;
    w.HTMLElement.prototype.releasePointerCapture = () => {};
    w.matchMedia = (q) => ({ matches: false, media: q, addEventListener(){}, addListener(){}, removeEventListener(){} });
    w.IntersectionObserver = class { constructor(cb){ this.cb = cb; }
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
      return this.className && String(this.className).includes("walk-view") ? 1024 : 0; } });
    Object.defineProperty(w.HTMLElement.prototype, "clientHeight", { configurable: true, get() {
      return this.className && String(this.className).includes("walk-view") ? 768 : 0; } });
    w.Image = class { constructor(){ this.naturalWidth = 640; this.naturalHeight = 427; }
      set src(v){ this._s = v; setTimeout(() => { if (this.onload) this.onload(); }, 5); }
      get src(){ return this._s; } get complete(){ return !!this._s; } };
    let now = 1000;
    const queue = [];
    let rafId = 1;
    w.requestAnimationFrame = (cb) => { queue.push({ id: rafId, cb }); return rafId++; };
    w.cancelAnimationFrame = (id) => { const i = queue.findIndex((q) => q.id === id); if (i >= 0) queue.splice(i, 1); };
    w.performance = { now: () => now };
    async function pump(n) {
      for (let i = 0; i < n; i++) {
        now += 17;
        const snapshot = queue.slice();
        queue.length = 0;
        for (const e of snapshot) { try { e.cb(now); } catch (err) { errors.push("tick: " + err.message); } }
      }
    }
    try { w.eval(js); } catch (err) { reject(err); return; }
    setTimeout(async () => {
      await pump(40);
      resolve({
        w, doc: w.document, errors, pump,
        walk: () => w.document.querySelector("[data-walk]").__walk,
        key: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })),
        keyUp: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keyup", { key: k, bubbles: true })),
      });
    }, 30);
  });
}


function patchedSite() {
  let js = siteText();
  const subs = [
    ["const moveStep = (nextX, nextDepth, dt = 0.0166) => {",
     "const moveStep = (nextX, nextDepth, dt = 0.0166) => { const __d = (window.__ms = { nx: +nextX.toFixed(2), nz: +nextDepth.toFixed(2), dt: +dt.toFixed(4) });"],
    ["const hit = pushAt(cx, cz) || pushAt(oldX, oldDepth);",
     "const hit = (__d.hit = pushAt(cx, cz) || pushAt(oldX, oldDepth)); if (hit) __d.n = [+hit.nx.toFixed(3), +hit.nz.toFixed(3), +hit.p.toFixed(2)];"],
    ["let along = (cx - oldX) * tX + (cz - oldDepth) * tD;",
     "let along = (__d.along0 = +((cx - oldX) * tX + (cz - oldDepth) * tD).toFixed(3));"],
    ["if (Math.abs(wishAlong) > Math.abs(along)) along = wishAlong;",
     "if (Math.abs(wishAlong) > Math.abs(along)) along = wishAlong; __d.along1 = +along.toFixed(3); __d.t = [+tX.toFixed(3), +tD.toFixed(3)]; __d.cx = +cx.toFixed(2); __d.cz = +cz.toFixed(2); __d.wish = +(vx * tX + vd * tD).toFixed(2);"],
    /* Round 73: the dead zone carries its own name now (it is a speed, `115 * dt`, not the fixed
       1.9 cm a 16.6 ms frame made of it), so the anchor follows the line rather than the number. */
    ["if (Math.abs(along) < deadAlong) {",
     "__d.deadAlong = deadAlong; __d.dead = Math.abs(along) < deadAlong; if (__d.dead) {"],
    ["let sgn = cornerAssist",
     "let __c1 = clear(1), __cm1 = clear(-1); __d.clear = [__c1, __cm1]; __d.ca0 = cornerAssist; let sgn = cornerAssist"],
    ["const qx = px + tX * sgn * creep, qd = pd + tD * sgn * creep;",
     "const qx = px + tX * sgn * creep, qd = pd + tD * sgn * creep; __d.step = [ +qx.toFixed(2), +qd.toFixed(2) ];"],
    ["if (!clear(sgn)) sgn = -sgn;",
     "__d.sgnPre = sgn; if (!clear(sgn)) sgn = -sgn; __d.sgn = sgn;"],
    ["cornerAssist = clear(sgn) ? sgn : 0;",
     "cornerAssist = clear(sgn) ? sgn : 0; __d.ca = cornerAssist;"],
    ["if (cornerAssist) along = creep * cornerAssist;",
     "if (cornerAssist) along = creep * cornerAssist; __d.alongF = +along.toFixed(3); __d.creep = +creep.toFixed(3);"],
    ["const hop2 = Math.hypot(sx - oldX, sd - oldDepth);",
     "const hop2 = (__d.hop2 = +Math.hypot(sx - oldX, sd - oldDepth).toFixed(3)); __d.s = [+sx.toFixed(2), +sd.toFixed(2)]; __d.h2 = h2 ? [+h2.nx.toFixed(2), +h2.nz.toFixed(2), +h2.p.toFixed(2)] : null;"],
    ["if (!collidesAt(sx, sd) && hop2 > 0.01 && (wedged || !buzz || hop2 > 1.2)) {",
     "__d.col = collidesAt(sx, sd); __d.buzz = buzz; __d.dir = dir; __d.wedged = wedged; __d.ok = !__d.col && hop2 > 0.01 && (wedged || !buzz || hop2 > 1.2); if (__d.ok) {"],
    ["x = nx2; depth = nz2;",
     "__d.old = [+oldX.toFixed(2), +oldDepth.toFixed(2)]; __d.new = [+nx2.toFixed(2), +nz2.toFixed(2)]; __d.blocked = [blockedX, blockedD]; __d.proj = projected; __d.move = +Math.hypot(nx2 - oldX, nz2 - oldDepth).toFixed(3); __d.slideDir = slideDir; x = nx2; depth = nz2;"],
  ];
  for (const [a, b] of subs) {
    const n = js.split(a).length - 1;
    if (n !== 1) throw new Error(`patch anchor hit ${n}x: ${a.slice(0, 60)}`);
    js = js.replace(a, b);
  }
  return js;
}
(async () => {
  const FILE = process.argv[2] || "rooms.html";
  const ROUNDS = Number(process.env.ROUNDS || 6);
  for (let round = 1; round <= ROUNDS; round++) {
    const env = await boot(FILE);
    const W = env.walk();
    const hw = W.halfWidth, mn = W.minDepth, mx_ = W.maxDepth, R = W.radius;
    const px = (el, p) => { const v = el.style.getPropertyValue(p); return v ? parseFloat(v) : 0; };
    const props = Array.from(env.doc.querySelectorAll('[data-obj][data-solid="true"]')).map((el) => {
      const m = (p) => parseFloat(el.dataset[p]) || 0;
      const a = ((px(el, "--ry") || parseFloat(el.dataset.ry || 0)) * Math.PI) / 180;
      return { id: el.dataset.obj, x: px(el, "--x"), z: px(el, "--z"), w: m("w"), d: m("d"),
               c: Math.cos(a), s: Math.sin(a) };
    });
    const collides = (x, z) => props.some((b) => {
      const dx = x - b.x, dz = z - b.z;
      const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
      const ox = Math.max(Math.abs(lx) - b.w / 2, 0), od = Math.max(Math.abs(ld) - b.d / 2, 0);
      return ox * ox + od * od < R * R;
    });
    const bracedOnProp = (x, z) => {
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        if (collides(x + Math.sin(a) * 6, z + Math.cos(a) * 6)) return true;
      }
      return false;
    };
    const forwardExits = (x, z, yaw, keys) => {
      const a2 = (yaw * Math.PI) / 180, sy = Math.sin(a2), cy = Math.cos(a2);
      let wx = 0, wd = 0;
      if (keys.includes("w")) wd += 1;
      if (keys.includes("s")) wd -= 1;
      const fx = wx * cy + wd * sy, fd = -wx * sy + wd * cy;
      const norm = Math.hypot(fx, fd) || 1;
      const out = [];
      for (let k = 0; k < 8; k++) {
        const aa = (k * Math.PI) / 4;
        const ex = Math.sin(aa), ed = Math.cos(aa);
        if ((ex * fx + ed * fd) / norm < 0.35) continue;
        const qx = x + ex * 45, qz = z + ed * 45;
        if (Math.abs(qx) <= hw && qz >= mn && qz <= mx_ && !collides(qx, qz)) out.push(k * 45);
      }
      return out;
    };
    let hits = 0, frames = 0;
    const watch = async (keys, n) => {
      keys.forEach((k) => env.key(k));
      let still = 0;
      const ring = [];
      for (let i = 0; i < n; i++) {
        const b = env.walk();
        const b0 = { x: b.x, depth: b.depth };
        await env.pump(1);
        const s = env.walk();
        const sp = Math.hypot(s.x - b0.x, s.depth - b0.depth) / 0.017;
        frames++;
        if (sp < 2) still++; else still = 0;
        ring.push(+sp.toFixed(2)); if (ring.length > 30) ring.shift();
        if (still === 24) {
          const exits = forwardExits(s.x, s.depth, s.yaw, keys);
          if (exits.length && bracedOnProp(s.x, s.depth)) {
            hits++;
            console.log(`FREEZE round ${round} keys=${keys.join("+")} at (${s.x.toFixed(2)},${s.depth.toFixed(2)}) yaw ${s.yaw.toFixed(1)} exits:${exits.join(",")} ring=${JSON.stringify(ring.slice(-6))}`);
            console.log("   solver:", JSON.stringify(env.w.__ms));
            console.log("   props:", JSON.stringify(props.map((b) => {
              const dx = s.x - b.x, dz = s.depth - b.z;
              const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
              return { id: b.id, ox: +(Math.abs(lx) - b.w / 2).toFixed(1), od: +(Math.abs(ld) - b.d / 2).toFixed(1) };
            }).sort((p, q) => Math.hypot(Math.max(p.ox, 0), Math.max(p.od, 0)) - Math.hypot(Math.max(q.ox, 0), Math.max(q.od, 0))).slice(0, 3)));
          }
        }
      }
      keys.forEach((k) => env.keyUp(k));
      await env.pump(6);
    };
    const turnTo = async (target) => {
      for (let i = 0; i < 320; i++) {
        const y = env.walk().yaw;
        const err = ((target - y + 540) % 360) - 180;
        if (Math.abs(err) <= 1.4) return;
        env.key(err > 0 ? "arrowright" : "arrowleft"); await env.pump(2);
        env.keyUp(err > 0 ? "arrowright" : "arrowleft");
      }
    };
    for (let k = 0; k < 8; k++) { await turnTo(k * 45); await watch(["w"], 120); }
    await watch(["w", "a"], 100); await watch(["w", "d"], 100);
    for (const b of props) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const cx = b.x + sx * b.w / 2, cz = b.z + sz * b.d / 2;
        const cur = env.walk();
        const vx = cx - cur.x, vd = cz - cur.depth;
        if (Math.hypot(vx, vd) < 60) continue;
        await turnTo((Math.atan2(vx, vd) * 180) / Math.PI);
        await watch(["w"], 160);
      }
    }
    console.log(`round ${round}: ${frames} frames, ${hits} freeze-with-exit`);
    if (hits) break;
  }
  process.exit(0);
})();
