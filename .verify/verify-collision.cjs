/* verify-collision — the walker must never catch on walls (owner report, round 42: 卡牆).
   A gate, not an instrument (unlike wall-probe, which measures and reports): it exits 1 when
   any of the three properties the round-42 solver guarantees is violated on any walkable page.

     V1 no freeze-with-exit   : while a movement key is held, 24 consecutive frames below
                                5 cm/s with at least one legal 45 cm escape around the body
                                means the slide/push-out stopped answering input.
     V2 no stranded glide     : a rail stop, given a budget of |distance|/165 cm/s plus 25%
                                slack, must end within 6 cm of the stop's promised position
                                (a stop that is genuinely walled off still fails here, so
                                authoring that would trip this gate on purpose).
     V3 never rest inside a margin : a body at rest must not be penetrating a solid's
                                collision box; the push-out clears it the next move.

   Deterministic: jsdom + pumped rAF (same boot as verify-rooms-e2e), no renderer, no clock.
   Run: node .verify/verify-collision.cjs
*/
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");

const js = fs.readFileSync("js/site.js", "utf8");
const ALL_PAGES = ["street.html", "rooms.html", "rooms-fukuoka.html", "rooms-toronto.html",
                   "rooms-cntower.html", "rooms-niagara.html", "rooms-journey.html"];
// GATE_PAGE=rooms-fukuoka runs one page — for diagnosis, not for the commit gate
const PAGES = process.env.GATE_PAGE ? [process.env.GATE_PAGE + ".html"] : ALL_PAGES;
const fails = [];
let checks = 0;
const ok = (name, cond, extra = "") => {
  checks++;
  if (!cond) fails.push(`${name}${extra ? " — " + extra : ""}`);
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
};

function boot(file) {
  return new Promise((resolve, reject) => {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => { const m = String((e && e.message) || e);
      if (!/navigation/.test(m)) errors.push(m); });
    /* P2 (round 69): a place's world data is its own file now, loaded by a plain <script> in a real
       browser. jsdom does not fetch external scripts at all — this harness strips every one of them
       and evals js/site.js itself — so the place data is inlined here, before that strip, exactly as
       the browser would have run it. Skipping this leaves __HX_PLACES empty and every big page boots
       into a lane with no world, which the collision checks would then measure as "nothing to hit". */
    const html = fs.readFileSync(file, "utf8")
      .replace(/<script src="(js\/places\/[a-z0-9-]+\.js)(\?[^"]*)?"><\/script>/g,
               (_m, src) => `<script>${fs.readFileSync(src, "utf8")}</script>`)
      .replace(/<script src="[^"]*"><\/script>/g, "");
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

async function pageGate(file) {
  const env = await boot(file);
  const W = env.walk();
  const hw = W.halfWidth, mn = W.minDepth, mx_ = W.maxDepth, R = W.radius;
  const px = (el, p) => { const v = el.style.getPropertyValue(p); return v ? parseFloat(v) : 0; };
  const props = Array.from(env.doc.querySelectorAll("[data-obj][data-solid=\"true\"]")).map((el) => {
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
  // a legal escape: one of eight 45 cm probes leaves the body free and inside the lane
  const hasExit = (x, z) => {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const qx = x + Math.sin(a) * 45, qz = z + Math.cos(a) * 45;
      if (Math.abs(qx) <= hw && qz >= mn && qz <= mx_ && !collides(qx, qz)) return true;
    }
    return false;
  };
  /* braced against a prop: something sits 6 cm off one of the eight directions. A head-on
     hold against a *wall* with no prop near is not a freeze the solver owes an answer to —
     walking into a wall stops, in this site as in the field; the gate exists for the round-42
     wedge (a braced body with legal floor the old solver refused to use), and only that. */
  const bracedOnProp = (x, z) => {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      if (collides(x + Math.sin(a) * 6, z + Math.cos(a) * 6)) return true;
    }
    return false;
  };

  let freezes = 0, restInside = 0, watchedFrames = 0, frzPrev = "-";
  let frz = { x: 0, depth: 0 };
  const watch = async (keys, frames) => {
    keys.forEach((k) => env.key(k));
    let still = 0;
    const ring = [];
    for (let i = 0; i < frames; i++) {
      // snapshot the getters — __walk is ONE live object; two reads of env.walk() are the same
      // reference, and `s.x - b.x` against it would measure nothing (the gate's own first bug)
      const w0 = env.walk();
      const b = { x: w0.x, depth: w0.depth };
      await env.pump(1);
      const w1 = env.walk();
      const s = { x: w1.x, depth: w1.depth, yaw: w1.yaw };
      const prev = ring.length ? ring[ring.length - 1] : null;
      const sp0 = prev ? Math.hypot(s.x - prev[0], s.depth - prev[1]) / 0.017 : 0;
      ring.push([+s.x.toFixed(2), +s.depth.toFixed(2), +sp0.toFixed(2), collides(s.x, s.depth) ? 1 : 0]);
      if (ring.length > 30) ring.shift();
      watchedFrames++;
      frz = s;
      const sp = Math.hypot(s.x - b.x, s.depth - b.depth) / 0.017;
      // 2 cm/s, not 5: a body crept along a face at the projection of the press (3-4 cm/s at a
      // one-degree-off hold) is the field-standard answer — velocity tangent-projected, magnitude
      // the player's own. A dead stop against escapable geometry is the regression this gate owns.
      if (sp < 2) {
        still++;
        if (process.env.GATE_DEBUG && still >= 16 && still <= 28)
          console.log(`   frz${still} (${s.x.toFixed(2)},${s.depth.toFixed(2)}) sp ${sp.toFixed(2)}`);
        // the wish this frame: view-plane projection of the held keys, same basis as stepMotion
        const a2 = (s.yaw * Math.PI) / 180, sy = Math.sin(a2), cy = Math.cos(a2);
        // Round 65: A and D turn the head; they do not push the body sideways. The wish this
        // frame is therefore only what the body was asked to *walk*, and a diagonal press is now
        // an arc -- forward while the head comes round -- rather than a side-step.
        let mx = 0, md = 0;
        if (keys.includes("w")) md += 1;
        if (keys.includes("s")) md -= 1;
        const wx = mx * cy + md * sy, wd = -mx * sy + md * cy;
        const norm = Math.hypot(wx, wd) || 1;
        // an exit counts only forward of the press: being able to back away is not an answer the
        // solver owes — walking into a face stops (field-standard), a frozen body with legal
        // ground AHEAD the keys were pushing toward is the round-42 wedge.
        const forwardExit = (() => {
          for (let k = 0; k < 8; k++) {
            const aa = (k * Math.PI) / 4;
            const ex = Math.sin(aa), ed = Math.cos(aa);
            if ((ex * wx + ed * wd) / norm < 0.35) continue;
            const qx = s.x + ex * 45, qz = s.depth + ed * 45;
            if (Math.abs(qx) <= hw && qz >= mn && qz <= mx_ && !collides(qx, qz)) return true;
          }
          return false;
        })();
        if (still === 24 && keys.length && forwardExit && bracedOnProp(s.x, s.depth) &&
            // and the window is truly immobile: a ring holding anything over 0.5 cm/s is the
            // legal tangent creep spending what the press asks for (0.5 is the round-43 position
            // noise floor; a 1.2 cm/s crawl along a braced face is walking, the engine spends it)
            ring.every((r) => r[2] < 0.5)) {
          freezes++;
          if (process.env.GATE_DEBUG) {
            const near = props.map((b) => {
              const dx = s.x - b.x, dz = s.depth - b.z;
              const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
              const ox = Math.max(Math.abs(lx) - b.w / 2, 0), od = Math.max(Math.abs(ld) - b.d / 2, 0);
              return { id: b.id, gap: +Math.max(0, Math.hypot(ox, od) - R).toFixed(1) };
            }).sort((p, q) => p.gap - q.gap)[0];
            const dirs = [];
            for (let k = 0; k < 8; k++) {
              const aa = (k * Math.PI) / 4;
              const ex = Math.sin(aa), ed = Math.cos(aa);
              if ((ex * wx + ed * wd) / norm < 0.35) continue;
              const qx = s.x + ex * 45, qz = s.depth + ed * 45;
              if (Math.abs(qx) <= hw && qz >= mn && qz <= mx_ && !collides(qx, qz))
                dirs.push(`${(k * 45).toFixed(0)}deg`);
            }
            console.log(`   FREEZE keys=${keys.join("+")} at (${s.x.toFixed(1)},${s.depth.toFixed(1)}) yaw ${s.yaw.toFixed(0)}` +
                        ` inside=${collides(s.x, s.depth)} gap=${near && near.gap}(${near && near.id}) exits:${dirs.join(",")} prev=${frzPrev}`);
            console.log("   ring:", JSON.stringify(ring.slice(-14)));
            frzPrev = `(${frz.x.toFixed(1)},${frz.depth.toFixed(1)})`;
          }
        }
      } else still = 0;
      if (collides(s.x, s.depth) && Math.hypot(s.x - b.x, s.depth - b.depth) < 0.02) restInside++;
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

  // V1: sweep the ring and a diagonal press at every wall — no freeze may find an exit
  for (let k = 0; k < 8; k++) { await turnTo(k * 45); await watch(["w"], 120); }
  // The diagonal press: with A and D turning the head, holding W with A is an arc -- the body
  // walks while the view comes round -- and it is the one press that can slide the body along a
  // face it cannot walk straight into.
  await watch(["w", "a"], 100); await watch(["w", "d"], 100);
  // V1 (props): ram every solid's four front corners at 45 degrees from just off its face
  for (const b of props) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = b.x + sx * b.w / 2, cz = b.z + sz * b.d / 2;
      const cur = env.walk();
      const from = { x: cur.x, d: cur.depth };
      const vx = cx - from.x, vd = cz - from.d;
      if (Math.hypot(vx, vd) < 60) continue;
      await turnTo((Math.atan2(vx, vd) * 180) / Math.PI);
      await watch(["w"], 160);
    }
  }
  // V4 (round 45): painted walls the body can reach are collider strips — a world quad standing on
  // the walkable floor (base within a hand's width of it), taller than the chest line, with a bottom
  // edge running inside the box, must leave NO free standing point on its floor line. Measured
  // against the page's own blockedAt, never a re-implementation. Pre-fix: 526/786 free points on
  // niagara and journey — that scan is this check's bite.
  {
    const layer = env.doc.querySelector("[data-walk]");
    const WALL0 = Number(layer.dataset.laneW ?? 640) / 2;
    const MIND0 = Number(layer.dataset.laneStart ?? 0), MAXD0 = Number(layer.dataset.laneLen ?? 6000);
    /* P2 (round 69): the backdrop of a big place lives in js/places/<place>.js now, and this gate
       read `.textContent` only — so after the data moved it found zero quads and scanned zero runs
       for exactly the pages the check was written for (round 45's 526/786 free points were on
       niagara and journey). A gate that silently loses its subject is worse than a red one: it
       printed "holes x0" about nothing. Read the same two places the page does. */
    let bd = {};
    {
      const el = env.doc.querySelector("[data-walk-backdrop]");
      try { bd = JSON.parse((el && el.textContent) || "{}"); } catch (e) { bd = {}; }
      if (!bd.world && el) {
        const store = (env.w.__HX_PLACES || {})[el.dataset.place];
        bd = (store && store["data-walk-backdrop"]) || {};
      }
    }
    const segd = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)));
      return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
    const runs = [];
    for (const p of (bd.world || {}).prims || []) {
      if (p.t !== "f" && p.t !== "x") continue;
      const pts = p.p || []; if (!pts.length || pts.some((c) => !Array.isArray(c) || c.length < 3)) continue;
      const ys = pts.map((c) => c[1]); const base = Math.min(...ys);
      if (Math.max(...ys) - base < 130 || base < -20 || base > 120) continue;
      for (let i = 0; i < pts.length; i++) {
        const q0 = pts[i], q1 = pts[(i + 1) % pts.length];
        if (Math.abs(q0[1] - base) > 30 || Math.abs(q1[1] - base) > 30) continue;   // bottom edges only
        let a = [q0[0], q0[2]], b2 = [q1[0], q1[2]];
        if (Math.max(a[1], b2[1]) < MIND0 - 4 || Math.min(a[1], b2[1]) > MAXD0 + 4) continue;
        if (a[0] < b2[0]) { const t = a; a = b2; b2 = t; }
        const x0 = -WALL0 - 4, x1 = WALL0 + 4;
        if (a[0] > x1) { const t = (x1 - b2[0]) / (a[0] - b2[0] || 1); a = [x1, b2[1] + (a[1] - b2[1]) * t]; }
        if (b2[0] < x0) { const t = (x0 - a[0]) / (b2[0] - a[0] || 1); b2 = [x0, a[1] + (b2[1] - a[1]) * t]; }
        if (a[0] <= b2[0] || Math.hypot(b2[0] - a[0], b2[1] - a[1]) < 10 || Math.hypot(b2[0] - a[0], b2[1] - a[1]) > WALL0) continue;
        // same cross-section tell as site.js: a run wider than half the lane is not a wall the floor meets.
        // Mirror rule, measured against the LIVE blockedAt — the pre-fix scan (526/786 free points) is
        // this run's bite; disabling site.js's strip collection makes holes>0 here, verified round 45.
        runs.push([a, b2]);
      }
    }
    const blockedAt = env.walk().blockedAt;
    const half = env.walk().halfWidth;
    let holes = 0;
    outer: for (let x = -half; x <= half && !holes; x += 8) for (let z = MIND0; z <= Math.min(MAXD0, 30000); z += 8) {
      for (const [a, b2] of runs) if (segd(x, z, a, b2) < 14.4 && !blockedAt(x, z)) { holes++; continue outer; }
    }
    ok(`${file}: painted floor-walls block the body (holes x${holes})`, holes === 0,
       `${runs.length} bottom-edge runs scanned`);
  }

  // V2: every rail stop on a FRESH boot — the §0x probe's own lesson (round 42): measuring a
  // glide from a braced position left by the contact sweep strands the verdict in sequence noise.
  const env2 = await boot(file);
  const stops = Array.from(env2.doc.querySelectorAll("[data-walk-stop]"));
  let stranded = 0;
  for (let i = 0; i < stops.length; i++) {
    const wantZ = parseFloat(stops[i].style.getPropertyValue("--z")) || 0;
    const rawX = parseFloat(stops[i].style.getPropertyValue("--x"));
    const w0 = env2.walk();
    const dist = Math.hypot(w0.depth - wantZ, Number.isFinite(rawX) ? w0.x - rawX : 0);
    stops[i].click();
    // the budget is the STRAIGHT-LINE walk plus accel/settle only: a glide that rounds an
    // obstacle spends frames doing it and fails here. That is deliberate — the rail promises the
    // visitor an arrival, and 165 cm/s down the lane is the promise; V3 and the probe carry the
    // detour's own correctness. The old solver stranded Journey stop#2 18 m short at any budget.
    await env2.pump(Math.min(5000, Math.ceil(dist / 165 * 1000 / 17) + 140));
    const s = env2.walk();
    const dev = Number.isFinite(rawX) ? Math.hypot(s.x - rawX, s.depth - wantZ) : Math.abs(s.depth - wantZ);
    if (dev > 6) stranded++;
  }
  ok(`${file}: held input always answers (freeze-with-exit x${freezes})`, freezes === 0,
     freezes ? `${freezes} stuck-and-escapable moments over ${watchedFrames} frames` : `${watchedFrames} frames held`);
  ok(`${file}: every rail stop arrives (stranded x${stranded})`, stranded === 0,
     stranded ? `${stranded}/${stops.length} stops not reached in budget` : `${stops.length} stops`);
  ok(`${file}: no body rests inside a solid's margin (x${restInside})`, restInside === 0);
  if (env.errors.length) ok(`${file}: no page errors`, false, env.errors[0]);
}

(async () => {
  for (const p of PAGES) await pageGate(p);
  console.log(`\nverify-collision: ${checks - fails.length}/${checks} pass`);
  if (fails.length) { for (const f of fails) console.log("FAILED " + f); process.exit(1); }
  /* The gate used to leave the process standing after the last line, because the jsdom window it
     opened keeps a handle open. The result was on the screen and the exit code was unreachable,
     so "the gate passed" could only ever be read by eye and never by a script. Leave now, with
     the code the result implies. */
  process.exit(0);
})();
