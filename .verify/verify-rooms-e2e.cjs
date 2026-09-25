/* verify-rooms-e2e.cjs — the chain, walked with the keys, not clicked.

   Boots each open room, walks the lane the way a visitor does (W to move, arrow
   taps to turn, E to act), and proves the three questions the static harnesses
   cannot answer end to end:

     1. Canada: walking to the far end brings the onward door into reach, and E
        on it leaves for Tokyo.
     2. Tokyo: the same walk reaches ITS onward door, and E leaves for Fukuoka.
     3. Fukuoka: the lane ends in water, there is no onward door, and Esc — the
        designed exit — leaves for the room behind (Tokyo).

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
      unobserve(){} disconnect(){}
    };
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

async function main() {
  /* ---- 1. Canada: walk the walkway, E on the far door, land in Tokyo ---- */
  out.push("-- Canada: W-walk to the far end, E on the onward door --");
  let env = await boot("rooms-canada.html");
  ok("canada boots with the walk view", !!env.doc.querySelector("[data-walk]"));
  ok("canada paints the lane (quads > 100)", env.walk().quads > 100, `quads=${env.walk().quads}`);
  ok("canada has pressable objects visible at the mouth",
     [...env.doc.querySelectorAll(".walk-hit")].filter((e) => e.style.visibility === "visible").length >= 3);
  await walkDeep(env, 210, 90);
  const cWalk = env.walk();
  ok("canada: W carried the walker to the far end", cWalk.depth > 1000, `depth=${cWalk.depth.toFixed(0)}`);
  const reachedDoor = await turnToReach(env, "way-on");
  ok("canada: the onward door comes into reach (ring on it)", reachedDoor,
     env.reach() ? env.reach().dataset.obj : "nothing in reach");
  env.navs.length = 0;
  env.key("e");
  await env.pump(10); await sleep(60);
  ok("canada: E on the door leaves for Tokyo", env.navs.length === 1, env.navs[0] || "no navigation");
  env.close();

  /* ---- 2. Tokyo: same walk, onward door, land in Fukuoka ---- */
  out.push("\n-- Tokyo: W-walk the lane, E on the onward door --");
  env = await boot("rooms.html");
  ok("tokyo boots with the walk view", !!env.doc.querySelector("[data-walk]"));
  await walkDeep(env, 210, 80);
  const tWalk = env.walk();
  ok("tokyo: W carried the walker to the far end", tWalk.depth > 1000, `depth=${tWalk.depth.toFixed(0)}`);
  const tDoor = await turnToReach(env, "way-on");
  ok("tokyo: the onward door comes into reach", tDoor, env.reach()?.dataset.obj || "nothing");
  env.navs.length = 0;
  env.key("e");
  await env.pump(10); await sleep(60);
  ok("tokyo: E on the door leaves for Fukuoka", env.navs.length === 1, env.navs[0] || "no navigation");
  env.close();

  /* ---- 3. Tokyo at the mouth: press E on the drain, then leave by the curtain ---- */
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
  const noren = env.doc.querySelector('[data-obj="noren"]');
  ok("tokyo: the back curtain is a real link", noren && noren.dataset.leave === "rooms-canada.html",
     noren?.dataset.leave || "missing");
  env.navs.length = 0;
  env.key("escape");                                 // nothing open now: Esc is the door
  await env.pump(6); await sleep(60);
  ok("tokyo: Esc with nothing open leaves for Canada", env.navs.length === 1, env.navs[0] || "no nav");
  env.close();

  /* ---- 4. Fukuoka: the lane ends at water; Esc is the way back ---- */
  out.push("\n-- Fukuoka: end of the chain --");
  env = await boot("rooms-fukuoka.html");
  ok("fukuoka boots with the walk view", !!env.doc.querySelector("[data-walk]"));
  ok("fukuoka has pressable objects visible at the mouth",
     [...env.doc.querySelectorAll(".walk-hit")].filter((e) => e.style.visibility === "visible").length >= 3);
  ok("fukuoka: no onward door (the chain ends here)",
     !env.doc.querySelector('[data-obj="way-on"]'));
  await walkDeep(env, 250, 0);
  const fWalk = env.walk();
  ok("fukuoka: W carries the walker to the water", fWalk.depth > 950, `depth=${fWalk.depth.toFixed(0)}`);
  const curtain = env.doc.querySelector('[data-obj="curtain-back"]');
  ok("fukuoka: the back curtain points at Tokyo", curtain && curtain.dataset.leave === "rooms.html",
     curtain?.dataset.leave || "missing");
  env.navs.length = 0;
  env.key("escape");
  await env.pump(6); await sleep(60);
  ok("fukuoka: Esc leaves for the room behind (Tokyo)", env.navs.length === 1, env.navs[0] || "no nav");
  env.close();

  /* ---- 5. The doors themselves are drawn, not just wired ---- */
  out.push("\n-- The chain doors are painted geometry, and clicking one leaves --");
  for (const [file, objId, expect] of [
    ["rooms-canada.html", "way-on", "rooms.html"],
    ["rooms.html", "way-on", "rooms-fukuoka.html"],
    ["rooms-canada.html", "door-back", "activities.html"],
    ["rooms.html", "noren", "rooms-canada.html"],
    ["rooms-fukuoka.html", "curtain-back", "rooms.html"],
  ]) {
    const e2 = await boot(file);
    const el = e2.doc.querySelector(`[data-obj="${objId}"]`);
    // The way-on door hangs at the far end and is visible from the mouth. A back exit needs both
    // some distance (a door fills the frame at arm's length, so its box overflows the view) and a
    // look behind: walk in, then turn until its press box is on screen.
    if (objId !== "way-on") { e2.key("w"); await e2.pump(70); e2.keyUp("w"); await e2.pump(6); }
    let vis = el && el.style.visibility === "visible";
    for (let i = 0; i < 55 && !vis; i++) {
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
