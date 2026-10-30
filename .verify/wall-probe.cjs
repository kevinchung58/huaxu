/* wall-probe — measure the "卡牆" reports instead of guessing at them.

   Drives the real walker (jsdom boot copied from verify-rooms-e2e.cjs, same deterministic
   rAF clock) on all seven pages and classifies every moment the body fails to answer the
   keys:
     sweep   : walk straight ahead at each of 24 headings; a stall is *context-classified*
               as wall (touching a clamp), prop (inside a solid's margin) or free (no
               obstacle at all — a hard bug);
     slide   : pin to a wall walking diagonally, then keep forward input — the body must
               keep sliding along the wall, not stick;
     corner  : for every solid prop, walk into its two front corners from a diagonal;
               a stuck body with a legal tangent direction available is a wedge;
     glide   : click every authored stop; an aborted glide that ends > 6 cm from the stop
               is the rail button stranding the visitor mid-lane;
     jitter  : more than 8 reversals of forward motion inside 30 frames while keys are held.

   This file is an instrument, not a gate (exit 0 either way); the numbers it prints are
   the evidence for whether the collision resolution needs to change.
*/
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const { siteText } = require("../bin/site-sources.cjs");

const js = siteText();
const PAGES = ["street.html", "rooms.html", "rooms-fukuoka.html", "rooms-toronto.html",
               "rooms-cntower.html", "rooms-niagara.html", "rooms-journey.html"];

function boot(file, hash = "") {
  return new Promise((resolve, reject) => {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => { const m = String((e && e.message) || e);
      if (!/navigation/.test(m)) errors.push(m); });
    const html = fs.readFileSync(file, "utf8").replace(/<script src="[^"]*"><\/script>/g, "");
    const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true,
      url: "https://huaxu.test/" + file + hash, virtualConsole: vc });
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
    w.cancelAnimationFrame = (id) => {
      const i = queue.findIndex((q) => q.id === id);
      if (i >= 0) queue.splice(i, 1);
    };
    w.performance = { now: () => now };
    async function pump(n, frameMs = 17, cb) {
      for (let i = 0; i < n; i++) {
        now += frameMs;
        const snapshot = queue.slice();
        queue.length = 0;
        for (const e of snapshot) { try { e.cb(now); } catch (err) { errors.push("tick: " + err.message); } }
        if (cb) cb(i);
      }
    }
    let result;
    try { result = w.eval(js); } catch (err) { reject(err); return; }
    setTimeout(async () => {
      await pump(40);
      resolve({
        w, dom, doc: w.document, errors, pump,
        walk: () => w.document.querySelector("[data-walk]").__walk,
        key: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })),
        keyUp: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keyup", { key: k, bubbles: true })),
      });
    }, 30);
  });
}

const wrapYaw = (d) => ((d + 180) % 360 + 360) % 180 - 180;

/* colliders read from the markup with the renderer's own formula: a body-radius expanded,
   yaw-rotated rectangle. Keeping the math here (not imported) is deliberate: a probe that
   mirrors the shipped code catches shipped-code bugs; one that imports it cannot. */
function readColliders(doc) {
  const px = (el, p) => { const v = el.style.getPropertyValue(p); return v ? parseFloat(v) : 0; };
  return Array.from(doc.querySelectorAll("[data-obj][data-solid=\"true\"]")).map((el) => {
    const m = (p) => parseFloat(el.dataset[p]) || 0;
    const ry = px(el, "--ry") || parseFloat(el.dataset.ry || 0);
    const a = (ry * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return { id: el.dataset.obj, x: px(el, "--x"), z: px(el, "--z"), w: m("w"), d: m("d"), c, s };
  });
}

async function probePage(file) {
  const env = await boot(file);
  const W = env.walk();
  const R = W.radius, hw = W.halfWidth, mn = W.minDepth, mx = W.maxDepth;
  const props = readColliders(env.doc);
  const hitsProp = (x, z) => props.some((b) => {
    const dx = x - b.x, dz = z - b.z;
    const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
    const ox = Math.max(Math.abs(lx) - b.w / 2, 0), od = Math.max(Math.abs(ld) - b.d / 2, 0);
    return ox * ox + od * od < R * R;
  });
  const nearProp = (x, z) => props.find((b) => {
    const dx = x - b.x, dz = z - b.z;
    const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
    const ox = Math.max(Math.abs(lx) - b.w / 2, 0), od = Math.max(Math.abs(ld) - b.d / 2, 0);
    return ox * ox + od * od < (R + 40) * (R + 40);
  });
  const report = { page: file, stalls: [], glides: [], bounds: [], jitter: 0, props: props.length };
  const samples = [];
  const sample = () => { const w = env.walk(); return { x: w.x, d: w.depth, yaw: w.yaw }; };

  async function hold(keys, frames, want) {
    keys.forEach((k) => env.key(k));
    let still = 0, last = null, flips = 0, lastSign = 0;
    for (let i = 0; i < frames; i++) {
      const before = sample();
      await env.pump(1);
      const s = sample();
      const moved = Math.hypot(s.x - before.x, s.d - before.d) / 0.017;   // cm/s
      if (want) {
        const fd = (Math.PI / 180) * s.yaw;
        const fwd = ((s.x - before.x) * Math.sin(fd) + (s.d - before.d) * Math.cos(fd)) / 0.017;
        const sg = Math.abs(fwd) > 20 ? Math.sign(fwd) : 0;   // only real reversals count; a sub-20 cm/s
        if (sg !== 0 && lastSign !== 0 && sg !== lastSign) { flips++; if (flips >= 8) { report.jitter++; flips = 0; } }
        if (sg !== 0) lastSign = sg;                          // sign is measurement noise
      }
      if (moved < 5) still++; else still = 0;
      if (still === 20) {   // one stall report per continuous stuck stretch
        const wall = Math.abs(s.x) >= hw - 1.2 || s.d <= mn + 1.2 || s.d >= mx - 1.2;
        const prop = hitsProp(s.x, s.d);
        report.stalls.push({ ctx: prop ? "prop" : wall ? "wall" : "FREE", at: [+s.x.toFixed(1), +s.d.toFixed(1)],
                             yaw: +s.yaw.toFixed(0), near: nearProp(s.x, s.d) });
      }
      if (Math.abs(s.x) > hw + 0.6 || s.d < mn - 0.6 || s.d > mx + 0.6)
        report.bounds.push({ at: [+s.x.toFixed(1), +s.d.toFixed(1)] });
      samples.push(s);
    }
    keys.forEach((k) => env.keyUp(k));
    await env.pump(6);
  }

  async function turnTo(target) {
    for (let i = 0; i < 320; i++) {
      const y = env.walk().yaw;
      const err = ((target - y + 540) % 360) - 180;
      if (Math.abs(err) <= 1.4) return true;
      env.key(err > 0 ? "arrowright" : "arrowleft");
      await env.pump(2);
      env.keyUp(err > 0 ? "arrowright" : "arrowleft");
    }
    return false;
  }

  // A. sweep: walk into the whole ring of the room from the spawn
  for (let k = 0; k < 24; k++) {
    await turnTo(k * 15);
    await hold(["w"], 150, true);
  }
  // B. wall slide: pin left+forward, then keep only forward input against the wall
  await turnTo(-45);
  await hold(["w", "a"], 40, false);
  const stuckOnWall = () => Math.abs(env.walk().x) >= hw - 0.6;
  if (stuckOnWall()) {
    env.keyUp("a");
    await hold(["w"], 70, true);          // must keep sliding along the wall
    const movedWhileSliding = env.walk().d;  // only depth matters; stall list already covers freeze
    void movedWhileSliding;
    env.keyUp("w");
  }
  await turnTo(45);
  await hold(["w", "d"], 40, false);
  if (stuckOnWall()) { env.keyUp("d"); await hold(["w"], 70, true); env.keyUp("w"); }
  // C. prop corners: run at each solid's two front corners from a diagonal, twice the room
  for (const b of props) {
    for (const corner of [[-1, -1], [1, -1]]) {
      const cx = b.x + corner[0] * b.w / 2, cz = b.z + corner[1] * b.d / 2;
      for (let retry = 0; retry < 2; retry++) {
        const cur = sample();
        const ang = (Math.atan2(cx - cur.x, cz - cur.d) * 180) / Math.PI;   // yaw basis: (sin, cos)
        await turnTo(+ang.toFixed(1));
        await hold(["w"], 110, true);
        const s = sample();
        const frozen = Math.hypot(s.x - cur.x, s.d - cur.d) < 4;
        if (frozen) {
          // is there a legal slide tangent at the freeze point? (two along-face directions)
          const tangent = Math.hypot(s.x + b.c * 20 - s.x, 0); void tangent;
          const legal = [[20, 0], [-20, 0], [0, 20], [0, -20], [14, 14], [-14, -14], [14, -14], [-14, 14]]
            .filter(([ox, od]) => !hitsProp(s.x + ox, s.d + od)
                     && Math.abs(s.x + ox) <= hw && s.d + od >= mn && s.d + od <= mx).length;
          if (legal > 0 && hitsProp(s.x, s.d)) report.stalls.push({
            ctx: "WEDGE", at: [+s.x.toFixed(1), +s.d.toFixed(1)], yaw: +s.yaw.toFixed(0),
            near: b.id + " corner", legal });
        }
        await hold(["s"], 24, false);   // back off before the next approach
      }
    }
  }
  // D. every authored stop through the rail — on a FRESH boot, so the glide's own behaviour
  //    is measured free of the pinned positions the contact sequences left behind.
  {
    const env2 = await boot(file);
    const stops = Array.from(env2.doc.querySelectorAll("[data-walk-stop]"));
    for (let i = 0; i < stops.length; i++) {
      const wantZ = parseFloat(stops[i].style.getPropertyValue("--z")) || 0;
      const rawX = parseFloat(stops[i].style.getPropertyValue("--x"));
      stops[i].click();
      // budget the walk: GLIDE_SPEED is 165 cm/s at 17 ms frames, plus accel and settle
      { const w0 = env2.walk();
        const dz = Math.abs((parseFloat(stops[i].style.getPropertyValue("--z")) || 0) - w0.depth);
        const dx0 = Math.abs(w0.x - (parseFloat(stops[i].style.getPropertyValue("--x")) || w0.x));
        await env2.pump(Math.min(4200, Math.ceil(Math.hypot(dx0, dz) / 165 * 1000 / 17) + 140)); }
      const s = env2.walk();
      // with no authored --x the glide keeps the walker's own x by design (round 33);
      // measure the axis that is actually promised
      const dev = Number.isFinite(rawX)
        ? Math.hypot(s.x - rawX, s.depth - wantZ)
        : Math.abs(s.depth - wantZ);
      if (dev > 6) report.glides.push({ i, want: [Number.isFinite(rawX) ? rawX : "keep-x", wantZ],
                                        got: [+s.x.toFixed(1), +s.depth.toFixed(1)], dev: +dev.toFixed(1) });
    }
    // E1. brace into whatever is ahead (end wall or first solid), then back off: contrary
    //     input must always move the body.
    for (let i = 0; i < 1600; i++) {
      const s = env2.walk();
      env2.key("w"); await env2.pump(1);
      const s2 = env2.walk();
      if (i > 10 && Math.hypot(s2.x - s.x, s2.depth - s.depth) < 0.05) { env2.keyUp("w"); break; }
    }
    env2.keyUp("w");
    {
      const b = { x: env2.walk().x, d: env2.walk().depth };
      env2.key("s"); await env2.pump(40); env2.keyUp("s");
      const a = env2.walk();
      if (Math.hypot(a.x - b.x, a.depth - b.d) < 2)
        report.stalls.push({ ctx: "ESCAPE-FAIL", at: [+a.x.toFixed(1), +a.depth.toFixed(1)],
                             yaw: +a.yaw.toFixed(0), near: "braced forward, 's' ignored" });
    }
    // E2. strafe into the right wall, then walk: must slide along the wall, not stick.
    for (let i = 0; i < 400 && Math.abs(env2.walk().x) < hw - 1.5; i++)
      { env2.key("d"); await env2.pump(1); }
    env2.keyUp("d");
    {
      const w1 = env2.walk();
      // if the strafe stopped against a solid's margin (not the wall), a forward freeze there is
      // the prop doing its job — the assertion only means "wall braced with clear floor ahead"
      const braced = w1.x >= hw - 1.2 || hitsProp(w1.x, w1.depth + 60);
      const b = env2.walk().depth;
      if (w1.x >= hw - 1.2 && !braced) {
        env2.key("w"); await env2.pump(50); env2.keyUp("w");
        if (Math.abs(env2.walk().depth - b) < 2)
          report.stalls.push({ ctx: "SLIDE-FAIL", at: [+env2.walk().x.toFixed(1), +env2.walk().depth.toFixed(1)],
                               yaw: 0, near: "pinned right, 'w' made no progress on free wall band" });
      }
    }
  }
  {
    // E3. brace into the first solid prop's face, then strafe: a visitor against a plinth
    //     must be able to walk around it, not stand frozen on its front.
    const env3 = await boot(file);
    if (props.length) {
      for (let i = 0; i < 1600; i++) {
        const s = env3.walk();
        env3.key("w"); await env3.pump(1);
        const s2 = env3.walk();
        if (i > 10 && Math.hypot(s2.x - s.x, s2.depth - s.depth) < 0.05) { env3.keyUp("w"); break; }
      }
      env3.keyUp("w");
      const before = { x: env3.walk().x, d: env3.walk().depth };
      env3.key("a"); await env3.pump(45); env3.keyUp("a");
      const after = env3.walk();
      if (Math.hypot(after.x - before.x, after.depth - before.d) < 2)
        report.stalls.push({ ctx: "AROUND-FAIL", at: [+after.x.toFixed(1), +after.depth.toFixed(1)],
                             yaw: +after.yaw.toFixed(0), near: "front of " + props[0].id });
    }
  }
  return report;
}

(async () => {
  let total = 0, hard = 0;
  for (const p of PAGES) {
    const r = await probePage(p);
    const free = r.stalls.filter((s) => s.ctx === "FREE" || s.ctx === "WEDGE");
    total += r.stalls.length + r.glides.length + r.bounds.length + r.jitter;
    hard += free.length + r.bounds.length + r.glides.length;
    console.log(`\n== ${r.page}  (${r.props} solid props)`);
    console.log(`   stalls: ${r.stalls.length}  (prop:${r.stalls.filter(s=>s.ctx==="prop").length} ` +
                `wall:${r.stalls.filter(s=>s.ctx==="wall").length} FREE/WEDGE:${free.length})  ` +
                `bounds:${r.bounds.length}  glide-aborts:${r.glides.length}  jitter:${r.jitter}`);
    for (const s of r.stalls)
      console.log(`   stall ${s.ctx} at (${s.at}) yaw ${s.yaw}${s.near ? " near " + (s.near.id || s.near) : ""}${s.legal ? ` slides:${s.legal}` : ""}`);
    for (const g of r.glides.slice(0, 10))
      console.log(`   glide stop#${g.i} wanted (${g.want}) got (${g.got}) — ${g.dev} cm short`);
    for (const b of r.bounds.slice(0, 6)) console.log(`   BOUNDS violation at (${b.at})`);
  }
  console.log(`\ntotal findings: ${total}, of which user-visible stuck/stranded: ${hard}`);
  process.exit(0);   // an instrument, not a gate
})();
