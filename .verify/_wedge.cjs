/* _wedge — a diagnosis instrument, not a gate (exit 0 always; read the numbers).
   Why: verify-collision's V1 only asks its question at the 24th consecutive slow frame and only
   when the last 30 frames are all under 0.5 cm/s, so the same wedge can pass or fail depending on
   what the frame ring happened to hold. This sweeps wider (every rail stop, 16 headings, the
   diagonal presses, and every solid's four corners) and reports EVERY run of >=20 frames slower
   than 2 cm/s that still has a legal forward exit and a prop within 6 cm — the gate's own
   definition, measured continuously.
   Run: node .verify/_wedge.cjs [page.html]   (GATE_PAGE=rooms also works)
*/
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const FILE = process.argv[2] || (process.env.GATE_PAGE ? process.env.GATE_PAGE + ".html" : "rooms.html");

function boot(file) {
  return new Promise((resolve, reject) => {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => { const m = String((e && e.message) || e);
      if (!/navigation/.test(m)) errors.push(m); });
    const html = fs.readFileSync(file, "utf8").replace(/<script src="[^"]*"><\/script>/g, "");
    const js = fs.readFileSync("js/site.js", "utf8");
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

(async () => {
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
  const stalls = [];
  let frames = 0;
  const watch = async (keys, n) => {
    keys.forEach((k) => env.key(k));
    let still = 0, runStart = null, runMin = 0;
    const ring = [];
    for (let i = 0; i < n; i++) {
      const w0 = env.walk();
      const b = { x: w0.x, depth: w0.depth, yaw: w0.yaw };
      await env.pump(1);
      const s = env.walk();
      const d = Math.hypot(s.x - b.x, s.depth - b.depth);
      const sp = d / 0.017;
      frames++;
      if (sp < 2) still++; else still = 0;
      if (still === 20) {                       // one report per stall run
        const a2 = (s.yaw * Math.PI) / 180, sy = Math.sin(a2), cy = Math.cos(a2);
        let wx = 0, wd = 0;
        if (keys.includes("w")) wd += 1;
        if (keys.includes("s")) wd -= 1;
        const fwd = { x: wx * cy + wd * sy, d: -wx * sy + wd * cy };
        const norm = Math.hypot(fwd.x, fwd.d) || 1;
        const exits = [];
        for (let k = 0; k < 8; k++) {
          const aa = (k * Math.PI) / 4;
          const ex = Math.sin(aa), ed = Math.cos(aa);
          if ((ex * fwd.x + ed * fwd.d) / norm < 0.35) continue;
          const qx = s.x + ex * 45, qz = s.depth + ed * 45;
          if (Math.abs(qx) <= hw && qz >= mn && qz <= mx_ && !collides(qx, qz)) exits.push(k * 45);
        }
        const sol = s.solver;
        const near = props.map((bb) => {
          const dx = s.x - bb.x, dz = s.depth - bb.z;
          const lx = dx * bb.c + dz * bb.s, ld = -dx * bb.s + dz * bb.c;
          const ox = Math.max(Math.abs(lx) - bb.w / 2, 0), od = Math.max(Math.abs(ld) - bb.d / 2, 0);
          return { id: bb.id, gap: +Math.max(0, Math.hypot(ox, od) - R).toFixed(1) };
        }).sort((p, q) => p.gap - q.gap)[0];
        const rec = { keys: keys.join("+"), x: +s.x.toFixed(1), z: +s.depth.toFixed(1),
                      yaw: +s.yaw.toFixed(1), braced: bracedOnProp(s.x, s.depth),
                      exits, near, contact: sol.contact && { nx: +sol.contact.nx.toFixed(3),
                      nz: +sol.contact.nz.toFixed(3), p: +sol.contact.p.toFixed(2) },
                      vx: +sol.vx.toFixed(2), vd: +sol.vd.toFixed(2) };
        stalls.push(rec);
        console.log("STALL", JSON.stringify(rec));
      }
      if (still > 400) { /* keep going; the run is reported once */ }
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
  const stops = Array.from(env.doc.querySelectorAll("[data-walk-stop]"));
  console.log(`${FILE}: ${props.length} solids, ${stops.length} rail stops`);
  for (let i = 0; i < stops.length; i++) {
    stops[i].click();
    await env.pump(420);
    for (let k = 0; k < 16; k++) {
      await turnTo(k * 22.5);
      await watch(["w"], 120);
    }
    await watch(["w", "a"], 90);
    await watch(["w", "d"], 90);
  }
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
  console.log(`\n${FILE}: ${frames} frames watched, ${stalls.length} stall reports`);
  const uniq = new Map();
  for (const s of stalls) uniq.set(`${s.x},${s.z}`, s);
  console.log(`unique positions: ${uniq.size}`);
  if (env.errors.length) console.log("page errors:", env.errors.slice(0, 3));
  process.exit(0);
})();
