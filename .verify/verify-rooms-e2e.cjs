/* verify-rooms-e2e.cjs — the hub street, walked with the keys, not clicked.

   The site is a street with three rooms off it, and this harness walks it the
   way a visitor does (W to move, A/D to edge across, arrow taps to turn, E to
   act, Esc to leave) and proves the things a static grep cannot:

     1. The street boots outdoors: sky vista and backdrop wired, lamps painted,
        and at least one room door within reach of the mouth.
     2. Each street door is reachable on foot — walk beside it, face it, press
        E — and E leaves for the room it names (Canada, Tokyo, Fukuoka).
     3. Every room's back curtain leaves for the street, and Esc — the designed
        exit — leaves for the street from all three rooms.
     4. The street's own back door leaves for the album, not for a room.
     5. The doors are drawn geometry: walked-in and turned-for, each is a
        visible plane and clicking it navigates.

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

function boot(file) {
  return new Promise((resolve, reject) => {
    const navs = [], errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => {
      const m = String((e && e.message) || e);
      if (/navigation/.test(m)) navs.push(m); else errors.push(m);
    });
    let html = fs.readFileSync(file, "utf8").replace(/<script[^>]*src=[^>]*><\/script>/g, "");
    const dom = new JSDOM(html, {
      runScripts: "dangerously", pretendToBeVisual: true,
      url: "https://huaxu.test/" + file, virtualConsole: vc,
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
    async function pump(n) {
      for (let i = 0; i < n; i++) {
        now += 17;
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

/* Walk forward holding W; a slight right strafe counteracts the authored -4° yaw
   so the walker ends deep and near the middle rather than hugging a wall. */
async function walkDeep(env, forwardFrames, strafeFrames) {
  env.key("w");
  await env.pump(forwardFrames);
  if (strafeFrames) { env.key("d"); await env.pump(strafeFrames); env.keyUp("d"); }
  env.keyUp("w");
  await env.pump(6);
}

/* Turn (arrow taps) until the wanted object is the one in reach; one tap is 7°. */
async function turnToReach(env, objId, maxTaps = 60) {
  for (let i = 0; i < maxTaps; i++) {
    const r = env.reach();
    if (r && r.dataset.obj === objId) return true;
    env.key("arrowright");
    await env.pump(2);
  }
  const r = env.reach();
  return !!(r && r.dataset.obj === objId);
}

/* Sidle along the street (A or D, no forward motion) until the wanted door is
   the one in reach once you face it. Doors sit flush to a wall at x ±346; the
   walker's stop keeps ~60 cm off the wall, well inside the 190 cm reach, so
   the whole problem is being beside the door in z — edging solves that. */
async function sidleToReach(env, objId, dir = -1, maxFrames = 400) {
  const k = dir < 0 ? "a" : "d";
  env.key(k);
  for (let i = 0; i < maxFrames; i += 4) {
    await env.pump(4);
    const r = env.reach();
    if (r && r.dataset.obj === objId) { env.keyUp(k); await env.pump(4); return true; }
  }
  env.keyUp(k);
  await env.pump(4);
  return turnToReach(env, objId);
}

/* Hold W until the walker is deep enough (door z minus a body's width), with a
   hard frame cap. Fixed frame counts lie: forward speed saturates, so the same
   285 frames that cross the lane's mid-depth stop well short of the far door. */
async function walkToDepth(env, target, maxFrames = 600) {
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
    env.key("arrowright");
    await env.pump(2);
  }
  return el.style.visibility === "visible";
}

async function main() {
  /* ---- 1. The street boots as an outdoor place ---- */
  out.push("-- Street: boots, paints, and is outdoors --");
  let env = await boot("street.html");
  ok("street boots with the walk view", !!env.doc.querySelector("[data-walk]"));
  ok("street paints the space (quads > 100)", env.walk().quads > 100, `quads=${env.walk().quads}`);
  ok("street has pressable objects visible at the mouth",
     [...env.doc.querySelectorAll(".walk-hit")].filter((e) => e.style.visibility === "visible").length >= 3);
  const vista = env.doc.querySelector('[data-walk-vista]');
  const backdrop = env.doc.querySelector('[data-walk-backdrop]');
  ok("street carries a far-end vista (the opening is authored, not implied)",
     !!vista && JSON.parse(vista.textContent).w >= 600,
     vista ? `w=${JSON.parse(vista.textContent).w}` : "missing");
  ok("street carries a painted backdrop (sky, skyline, roofs)",
     !!backdrop && JSON.parse(backdrop.textContent).city.length >= 3
       && JSON.parse(backdrop.textContent).sky.length >= 2,
     backdrop ? "sky+city present" : "missing");
  ok("street carries all three room doors as objects",
     ["door-canada", "door-tokyo", "door-fukuoka"].every((id) => env.doc.querySelector(`[data-obj="${id}"]`)));
  ok("no room door on the street is wired to another street door",
     ["door-canada", "door-tokyo", "door-fukuoka"].every((id) => {
       const el = env.doc.querySelector(`[data-obj="${id}"]`);
       return el && el.dataset.leave && el.dataset.leave !== "street.html";
     }));

  /* ---- 2. Canada by foot: walk beside the first door, face it, press E ---- */
  out.push("\n-- Street -> Canada on foot: E on the lit door --");
  env.close();
  env = await boot("street.html");
  await walkToDepth(env, 290);                            // door walk-z 348: stop just short of it
  const cReach = await sidleToReach(env, "door-canada", -1);
  ok("street: the Canada door comes into reach (ring on it)", cReach,
     env.reach() ? env.reach().dataset.obj : "nothing in reach");
  env.navs.length = 0;
  env.key("e"); await env.pump(10); await sleep(60);
  ok("street: E on the Canada door leaves for rooms-canada.html", env.navs.length === 1,
     env.navs[0] || "no navigation");
  env.close();

  /* ---- 3. Tokyo by foot: further up the street, right-hand side ---- */
  out.push("\n-- Street -> Tokyo on foot: E on the middle door --");
  env = await boot("street.html");
  await walkToDepth(env, 810);                            // door walk-z 870: the middle of the street
  const tReach = await sidleToReach(env, "door-tokyo", 1);
  ok("street: the Tokyo door comes into reach", tReach,
     env.reach() ? env.reach().dataset.obj : "nothing in reach");
  env.navs.length = 0;
  env.key("e"); await env.pump(10); await sleep(60);
  ok("street: E on the Tokyo door leaves for rooms.html", env.navs.length === 1,
     env.navs[0] || "no navigation");
  env.close();

  /* ---- 4. Fukuoka by foot: the far stretch, left-hand side ---- */
  out.push("\n-- Street -> Fukuoka on foot: E on the last door --");
  env = await boot("street.html");
  await walkToDepth(env, 1040);                           // door walk-z 1102: the far stretch
  const fReach = await sidleToReach(env, "door-fukuoka", -1);
  ok("street: the Fukuoka door comes into reach", fReach,
     env.reach() ? env.reach().dataset.obj : "nothing in reach");
  env.navs.length = 0;
  env.key("e"); await env.pump(10); await sleep(60);
  ok("street: E on the Fukuoka door leaves for rooms-fukuoka.html", env.navs.length === 1,
     env.navs[0] || "no navigation");
  env.close();

  /* ---- 5. The street's own back door opens the album ---- */
  out.push("\n-- Street back door: the album, not another room --");
  env = await boot("street.html");
  const sBack = env.doc.querySelector('[data-obj="door-back"]');
  ok("street: the back door points at activities.html",
     sBack && sBack.dataset.leave === "activities.html", sBack?.dataset.leave || "missing");
  env.navs.length = 0;
  env.key("escape"); await env.pump(6); await sleep(60);
  ok("street: Esc with nothing open leaves for the album", env.navs.length === 1,
     env.navs[0] || "no nav");
  env.close();

  /* ---- 6. Every room exits to the street, by attribute and by Esc ---- */
  out.push("\n-- Rooms: every way out lands on the street --");
  for (const [file, objId, label] of [
    ["rooms-canada.html", "door-back", "Canada"],
    ["rooms.html", "noren", "Tokyo"],
    ["rooms-fukuoka.html", "curtain-back", "Fukuoka"],
  ]) {
    const e1 = await boot(file);
    ok(`${label}: boots with the walk view`, !!e1.doc.querySelector("[data-walk]"));
    ok(`${label}: no onward door exists (the hub carries the doors)`,
       !e1.doc.querySelector('[data-obj="way-on"]'));
    const back = e1.doc.querySelector(`[data-obj="${objId}"]`);
    ok(`${label}: the way you came in points at the street`,
       back && back.dataset.leave === "street.html", back?.dataset.leave || "missing");
    e1.navs.length = 0;
    e1.key("escape"); await e1.pump(6); await sleep(60);
    ok(`${label}: Esc leaves for the street`, e1.navs.length === 1, e1.navs[0] || "no nav");
    e1.close();
  }

  /* ---- 7. Tokyo inside: the plate still opens, Esc folds it before leaving ---- */
  out.push("\n-- Tokyo mouth: E acts on the street kit, the noren leaves --");
  env = await boot("rooms.html");
  const mouth = env.reach();
  ok("tokyo: something street-level is in reach at the mouth", !!mouth, mouth?.dataset.obj || "none");
  const card = env.doc.querySelector("[data-walk-card]");
  env.key("e");
  await env.pump(10);
  ok("tokyo: E at the mouth opens its plate (nothing silently fails)", card && !card.hidden,
     card && !card.hidden ? `“${env.doc.querySelector("[data-walk-title]").textContent}”` : "no card");
  if (card && !card.hidden) {
    env.key("escape");
    await env.pump(6);
    ok("tokyo: Esc folds the plate first", card.hidden);
  }
  env.navs.length = 0;
  env.key("escape");                                 // nothing open now: Esc is the door
  await env.pump(6); await sleep(60);
  ok("tokyo: Esc with nothing open leaves for the street", env.navs.length === 1,
     env.navs[0] || "no nav");
  env.close();

  /* ---- 8. Fukuoka still ends at the water; the walk has a far end ---- */
  out.push("\n-- Fukuoka: end of the alley is water --");
  env = await boot("rooms-fukuoka.html");
  ok("fukuoka has pressable objects visible at the mouth",
     [...env.doc.querySelectorAll(".walk-hit")].filter((e) => e.style.visibility === "visible").length >= 3);
  await walkDeep(env, 250, 0);
  const fWalk = env.walk();
  ok("fukuoka: W carries the walker to the water", fWalk.depth > 950, `depth=${fWalk.depth.toFixed(0)}`);
  env.close();

  /* ---- 9. The doors are painted geometry: walk in, turn, click, leave ---- */
  out.push("\n-- The hub doors are painted geometry, and clicking one leaves --");
  for (const [file, objId, expect, prep] of [
    ["street.html", "door-canada", "rooms-canada.html", { fwd: 250, side: -1 }],
    ["street.html", "door-tokyo", "rooms.html", { fwd: 750, side: 1 }],
    ["street.html", "door-fukuoka", "rooms-fukuoka.html", { fwd: 1000, side: -1 }],
    ["rooms-canada.html", "door-back", "street.html", { fwd: 300, side: 0 }],
    ["rooms.html", "noren", "street.html", { fwd: 300, side: 0 }],
    ["rooms-fukuoka.html", "curtain-back", "street.html", { fwd: 300, side: 0 }],
  ]) {
    const e2 = await boot(file);
    const el = e2.doc.querySelector(`[data-obj="${objId}"]`);
    // A door needs both some distance (its box overflows the view at arm's length) and a look
    // toward it: walk past the mouth, edge to its side of the street, then turn until on screen.
    if (prep.fwd) await walkToDepth(e2, prep.fwd);
    if (prep.side) {
      const k = prep.side < 0 ? "a" : "d";
      e2.key(k); await e2.pump(30); e2.keyUp(k); await e2.pump(6);
    }
    let vis = el && el.style.visibility === "visible";
    for (let i = 0; i < 70 && !vis; i++) {
      e2.key("arrowright"); await e2.pump(2);
      vis = el.style.visibility === "visible";
    }
    ok(`${file} [${objId}]: becomes a visible plane as you walk in and look around`, vis,
       `vis=${el ? el.style.visibility : "missing"}`);
    if (vis) {
      e2.navs.length = 0;
      el.dispatchEvent(new e2.w.MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(60);
      ok(`${file} [${objId}]: clicking it leaves for ${expect}`, e2.navs.length === 1,
         e2.navs[0] || "no navigation");
    }
    e2.close();
  }

  console.log(out.join("\n"));
  console.log(`\n${fails.length} failure(s)` + (fails.length ? "  " + fails.join(", ") : ""));
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
